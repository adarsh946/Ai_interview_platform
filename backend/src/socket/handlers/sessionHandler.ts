import { Server, Socket } from "socket.io";
import prisma from "../../prisma/prisma.js";
import { interviewGraph } from "../../langraph/interviewGraph.js";
import { Command } from "@langchain/langgraph";
import { redis } from "../../config/redis.js";

interface JoinPayload {
  sessionId: string;
}

interface StartPayload {
  sessionId: string;
  role: string;
  skills: string[];
  difficulty: string;
  round: string;
  duration: number;
  resumeText: string;
}

interface AnswerPayload {
  sessionId: string;
  answer: string;
}

interface CancelPayload {
  sessionId: string;
  reason?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function cleanupSession(sessionId: string): Promise<void> {
  await redis.del(`interview:expressions:${sessionId}`);
  console.log(
    `[sessionHandler] cleaned up Redis keys for session=${sessionId}`
  );
}

export function sessionHandler(io: Server, socket: Socket): void {
  // Event 1 session: join

  socket.on("session:join", async (payload: JoinPayload) => {
    const { sessionId } = payload;

    if (!sessionId) {
      socket.emit("interview:error", { message: "sessionId is required" });
      return;
    }

    try {
      const session = await prisma.session.findUnique({
        where: {
          id: sessionId,
        },
      });

      if (!session) {
        socket.emit("interview:error", { message: "Session not found" });
        return;
      }
      await socket.join(sessionId);
      console.log(
        `[sessionHandler] socket=${socket.id} joined session=${sessionId}`
      );

      io.to(sessionId).emit("interview:status", {
        status: "joined",
        sessionId,
      });
    } catch (err) {
      console.error("[sessionHandler] session:join error:", err);
      socket.emit("interview:error", { message: "Failed to join session" });
    }
  });

  //   Event 2 Interview: start

  socket.on("interview:start", async (payload: StartPayload) => {
    const { sessionId, role, skills, difficulty, round, duration, resumeText } =
      payload;

    if (
      !sessionId ||
      !role ||
      !skills ||
      !difficulty ||
      !round ||
      !duration ||
      !resumeText
    ) {
      socket.emit("interview:error", {
        message: "Missing required fields to start interview",
      });
      return;
    }

    try {
      console.log(
        `[sessionHandler] starting interview session=${sessionId} role=${role}`
      );

      // Build the initial LangGraph state
      const initialState = {
        sessionId,
        role,
        skills,
        difficulty,
        round,
        duration,
        resumeText,
        questionCount: 0,
        maxQuestions: 0, // initializer node calculates this from duration
        transcript: [],
        expressions: [],
        followUpNeeded: false,
        followUpContext: "",
        currentQuestion: "",
        currentAnswer: "",
        status: "in-progress" as const,
        lastAnswerScore: 0,
        lastAnswerFeedback: "",
        lastAnswerStrength: "",
        lastAnswerWeakness: "",
        lastQuestionType: "new" as const,
        overallScore: 0,
        overallFeedback: "",
        strengths: [],
        improvements: [],
      };

      // Notify frontend that interview is beginning
      io.to(sessionId).emit("interview:status", { status: "starting" });

      //    invoke the graph
      await interviewGraph.invoke(initialState, {
        configurable: { thread_id: sessionId },
      });

      const graphState = await interviewGraph.getState({
        configurable: { thread_id: sessionId },
      });

      const currentQuestion = graphState.values.currentQuestion as string;
      const questionCount = graphState.values.questionCount as number;

      console.log(
        `[sessionHandler] first question generated: "${currentQuestion}"`
      );

      // Emit question to all clients in the room
      io.to(sessionId).emit("interview:question", {
        question: currentQuestion,
        questionNumber: questionCount,
      });

      await prisma.session.update({
        where: {
          id: sessionId,
        },
        data: {
          status: "IN_PROGRESS",
        },
      });
      console.log(`[sessionHandler] session=${sessionId} status → IN_PROGRESS`);
    } catch (err) {
      console.error("[sessionHandler] interview:start error:", err);

      io.to(sessionId).emit("interview:error", {
        message: "Failed to start interview",
      });

      await prisma.session
        .update({
          where: { id: sessionId },
          data: { status: "FAILED" },
        })
        .catch(() => {}); // don't throw if DB update fails
    }
  });

  // Event 3 Answer submit

  socket.on("answer:submit", async (payload: AnswerPayload) => {
    const { sessionId, answer } = payload;

    if (!sessionId || !answer) {
      socket.emit("interview:error", {
        message: "sessionId and answer are required",
      });
      return;
    }

    try {
      console.log(`[sessionHandler] answer received session=${sessionId}`);

      io.to(sessionId).emit("interview:status", { status: "processing" });

      await interviewGraph.invoke(new Command({ resume: answer }), {
        configurable: { thread_id: sessionId },
      });

      const graphState = await interviewGraph.getState({
        configurable: { thread_id: sessionId },
      });

      const status = graphState.values.status as string;

      if (status === "done") {
        console.log(`[sessionHandler] interview complete session=${sessionId}`);

        const rawExpression = await redis.get(
          `interview:expressions:${sessionId}`
        );
        const expressions = rawExpression ? JSON.parse(rawExpression) : [];

        const result = {
          overallScore: graphState.values.overallScore as number,
          overallFeedback: graphState.values.overallFeedback as string,
          strengths: graphState.values.strengths as string[],
          improvements: graphState.values.improvements as string[],
          transcript: graphState.values.transcript,
          expressions,
        };

        await prisma.result.create({
          data: {
            sessionId,
            transcript: JSON.stringify(transcript),
            overallScore: Math.round(overallScore),
            overallFeedback,
            strengths,
            improvements,
            expressions: expressionsFromRedis,
            screenshots: null,
          },
        });
        await prisma.session.update({
          where: { id: sessionId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        io.to(sessionId).emit("interview:complete", result);

        await cleanupSession(sessionId);

        console.log(`[sessionHandler] session=${sessionId} status → COMPLETED`);
        return;
      }
    } catch (err) {
      console.error("[sessionHandler] answer:submit error:", err);
      io.to(sessionId).emit("interview:error", {
        message: "Failed to process answer",
      });
    }
  });

  socket.on("interview:cancel", async (payload: CancelPayload) => {
    const { sessionId, reason } = payload;

    if (!sessionId) {
      socket.emit("interview:error", { message: "sessionId is required" });
      return;
    }

    try {
      console.log(
        `[sessionHandler] cancelling session=${sessionId} reason=${
          reason ?? "none"
        }`
      );

      await prisma.session.update({
        where: {
          id: sessionId,
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason ?? null,
        },
      });

      io.to(sessionId).emit("interview:status", { status: "cancelled" });
      await cleanupSession(sessionId);

      socket.leave(sessionId);
      console.log(`[sessionHandler] session=${sessionId} status → CANCELLED`);
    } catch (err) {
      console.error("[sessionHandler] interview:cancel error:", err);
      socket.emit("interview:error", { message: "Failed to cancel interview" });
    }
  });
}
