"use client";

import socket from "@/lib/socket";
import { Mic, MicOff, Phone, Video, VideoOff, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewStatus =
  | "starting"
  | "ai-speaking"
  | "listening"
  | "processing"
  | "done"
  | "cancelled";

interface TranscriptEntry {
  question: string;
  answer: string;
}

interface QuestionPayload {
  question: string;
  audio: ArrayBuffer;
  questionNumber: number;
}

interface StatusPayload {
  status: string;
}

interface CompletePayload {
  overallScore: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  transcript: TranscriptEntry[];
}

interface ErrorPayload {
  message: string;
}

// ─── Status Label Helper ──────────────────────────────────────────────────────

function getStatusLabel(status: InterviewStatus): string {
  switch (status) {
    case "starting":
      return "Preparing your interview...";
    case "ai-speaking":
      return "AI Interviewer is speaking...";
    case "listening":
      return "Listening to your answer...";
    case "processing":
      return "Evaluating your answer...";
    case "done":
      return "Interview complete!";
    case "cancelled":
      return "Interview cancelled";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function Page({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const router = useRouter();

  // ── UI State
  const [status, setStatus] = useState<InterviewStatus>("starting");
  const [error, setError] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);

  // ── Content State
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  // ── Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // ── Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // refs for stale closure fix
  const currentAnswerRef = useRef<string>("");
  const currentQuestionRef = useRef<string>("");

  // ─── Auto scroll chat to bottom ───────────────────────────────────────────

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, currentQuestion, currentAnswer]);

  // ─── Camera Setup ──────────────────────────────────────────────────────────

  useEffect(() => {
    let localStream: MediaStream;

    const startCamera = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.error("[room] camera error:", err);
      }
    };

    startCamera();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // ─── Web Speech API ────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Your browser does not support speech recognition. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const combined =
        currentAnswerRef.current + finalTranscript + interimTranscript;
      setCurrentAnswer(combined);

      if (finalTranscript) {
        currentAnswerRef.current += finalTranscript;
      }
    };

    recognition.onstart = () => setIsMicActive(true);

    recognition.onend = () => {
      setIsMicActive(false);
      submitAnswer();
    };

    recognition.onerror = (event: any) => {
      console.error("[recognition] error:", event.error);
      setIsMicActive(false);
    };

    recognition.start();
  }, []);

  // ─── Submit Answer ─────────────────────────────────────────────────────────

  const submitAnswer = useCallback(() => {
    const answer = currentAnswerRef.current.trim();
    if (!answer) return;

    setStatus("processing");
    setIsMicActive(false);

    setTranscript((prev) => [
      ...prev,
      {
        question: currentQuestionRef.current,
        answer,
      },
    ]);

    socket.emit("answer:submit", { sessionId, answer });

    currentAnswerRef.current = "";
    setCurrentAnswer("");
  }, [sessionId]);

  // ─── Timer ────────────────────────────────────────────────────────────────

  const handleEndInterview = useCallback(() => {
    clearInterval(timerRef.current!);
    recognitionRef.current?.stop();
    audioRef.current?.pause();
    socket.emit("interview:cancel", {
      sessionId,
      reason: "User ended interview",
    });
    router.push("/dashboard");
  }, [sessionId, router]);

  const startTimer = useCallback(
    (durationInSeconds: number) => {
      setTimeLeft(durationInSeconds);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [handleEndInterview]
  );

  // ─── Socket Events ─────────────────────────────────────────────────────────

  useEffect(() => {
    socket.on("interview:question", (payload: QuestionPayload) => {
      const { question, audio, questionNumber } = payload;

      console.log(`[room] question #${questionNumber}: "${question}"`);

      setCurrentQuestion(question);
      currentQuestionRef.current = question;
      setCurrentAnswer("");
      currentAnswerRef.current = "";
      setStatus("ai-speaking");

      const blob = new Blob([audio], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audioEl = new Audio(url);
      audioRef.current = audioEl;

      audioEl.play().catch((err) => console.error("[room] audio error:", err));

      audioEl.onended = () => {
        URL.revokeObjectURL(url);
        setStatus("listening");
        startListening();
      };
    });

    socket.on("interview:status", (payload: StatusPayload) => {
      if (payload.status === "processing") {
        setStatus("processing");
        recognitionRef.current?.stop();
      }
      if (payload.status === "starting") {
        setStatus("starting");
        startTimer(30 * 60);
      }
      if (payload.status === "cancelled") {
        setStatus("cancelled");
        clearInterval(timerRef.current!);
        router.push("/dashboard");
      }
    });

    socket.on("interview:complete", (_payload: CompletePayload) => {
      setStatus("done");
      clearInterval(timerRef.current!);
      recognitionRef.current?.stop();
      audioRef.current?.pause();
      router.push(`/result/${sessionId}`);
    });

    socket.on("interview:error", (payload: ErrorPayload) => {
      setError(payload.message);
    });

    return () => {
      socket.off("interview:question");
      socket.off("interview:status");
      socket.off("interview:complete");
      socket.off("interview:error");
    };
  }, [startListening, startTimer, sessionId, router]);

  // ─── Frame Capture ─────────────────────────────────────────────────────────

  useEffect(() => {
    const frameInterval = setInterval(() => {
      if (!videoRef.current) return;

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0);
      const frameData = canvas.toDataURL("image/jpeg", 0.5);

      socket.emit("frame:capture", {
        sessionId,
        expressionData: { frame: frameData, timestamp: Date.now() },
      });
    }, 5000);

    return () => clearInterval(frameInterval);
  }, [sessionId]);

  // ─── Timer Format ─────────────────────────────────────────────────────────

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ─── Toggle Mic ───────────────────────────────────────────────────────────

  const toggleMic = () => {
    if (isMicActive) {
      recognitionRef.current?.stop();
    } else {
      if (status === "listening") startListening();
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:h-full lg:px-8">
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <header className="flex flex-shrink-0 items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              BaatCheet
            </span>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              Mock Interview
            </h1>
          </div>

          {/* Status + Timer */}
          <div className="flex items-center gap-3">
            {/* Status badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {getStatusLabel(status)}
            </span>

            {/* Timer */}
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 ring-1 ring-emerald-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-emerald-700">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </header>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <div className="flex flex-shrink-0 items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-600">
            <AlertCircle size={15} className="shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-5">
          {/* LEFT — video stack ──────────────────────────────────────────── */}
          <div className="flex min-h-0 flex-col gap-3 sm:gap-4 lg:col-span-3">
            <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
              {/* AI Interviewer */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm aspect-video lg:aspect-auto lg:min-h-0 lg:flex-1 lg:basis-0">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="relative aspect-square h-[70%] max-h-56 min-h-20">
                    {/* Outer ring — only animate when AI is speaking */}
                    <span
                      className={`absolute inset-0 rounded-full bg-emerald-400/30 ${
                        status === "ai-speaking" ? "animate-ping" : ""
                      }`}
                    />
                    <span
                      className={`absolute inset-[7%] rounded-full bg-blue-400/30 ${
                        status === "ai-speaking" ? "animate-pulse" : ""
                      }`}
                      style={{ animationDuration: "2.5s" }}
                    />
                    <span className="absolute inset-[15%] rounded-full bg-gradient-to-br from-blue-500/40 to-emerald-500/40 blur-xl" />
                    <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 shadow-2xl">
                      <span className="text-2xl font-bold tracking-wide text-white sm:text-3xl">
                        AI
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="rounded-md bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm">
                    AI Interviewer
                  </div>
                  {status === "processing" && (
                    <div className="rounded-md bg-amber-50/90 px-2.5 py-1 text-xs font-medium text-amber-700 backdrop-blur-sm ring-1 ring-amber-200">
                      Thinking...
                    </div>
                  )}
                </div>
              </div>

              {/* Candidate video */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm aspect-video lg:aspect-auto lg:min-h-0 lg:flex-1 lg:basis-0">
                {/* Real camera feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
                    isCameraOn ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Camera off placeholder */}
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
                      <VideoOff className="h-8 w-8 text-slate-500" />
                    </div>
                  </div>
                )}

                {/* Name label */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    You
                  </div>
                  {isMicActive && (
                    <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/80 px-2.5 py-1 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      <span className="text-xs font-medium text-white">
                        Speaking
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — transcript chat ──────────────────────────────────────── */}
          <aside className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2 lg:min-h-0">
            {/* Chat header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500">
                  <span className="text-xs font-bold text-white">AI</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Live Transcript
                  </p>
                  <p className="text-xs text-slate-500">Conversation history</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                Live
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {/* Empty state */}
              {transcript.length === 0 && !currentQuestion && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-slate-400 text-center">
                    Your conversation will appear here...
                  </p>
                </div>
              )}

              {/* Transcript history */}
              {transcript.map((entry, index) => (
                <div key={index} className="space-y-3">
                  {/* AI question */}
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500">
                      <span className="text-[10px] font-bold text-white">
                        AI
                      </span>
                    </div>
                    <div className="flex max-w-[85%] flex-col gap-1">
                      <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5">
                        <p className="text-sm leading-relaxed text-slate-800">
                          {entry.question}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User answer */}
                  <div className="flex flex-row-reverse gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-800">
                      <span className="text-[10px] font-bold text-white">
                        You
                      </span>
                    </div>
                    <div className="flex max-w-[85%] flex-col items-end gap-1">
                      <div className="rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-2.5">
                        <p className="text-sm leading-relaxed text-white">
                          {entry.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Current live question */}
              {currentQuestion && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500">
                    <span className="text-[10px] font-bold text-white">AI</span>
                  </div>
                  <div className="flex max-w-[85%] flex-col gap-1">
                    <div className="rounded-2xl rounded-tl-sm border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                        Current Question
                      </span>
                      <p className="text-sm font-medium leading-relaxed text-slate-900">
                        {currentQuestion}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current live answer */}
              {currentAnswer && (
                <div className="flex flex-row-reverse gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-800">
                    <span className="text-[10px] font-bold text-white">
                      You
                    </span>
                  </div>
                  <div className="flex max-w-[85%] flex-col items-end gap-1">
                    <div className="rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-2.5">
                      <p className="text-sm leading-relaxed text-white">
                        {currentAnswer}
                        {isMicActive && (
                          <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-white align-middle" />
                        )}
                      </p>
                    </div>
                    {isMicActive && (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-medium text-emerald-600">
                          Speaking…
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Auto scroll anchor */}
              <div ref={chatBottomRef} />
            </div>

            {/* Footer */}
            <div className="flex flex-shrink-0 items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isMicActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                }`}
              />
              <span className="text-[11px] font-medium text-slate-500">
                {isMicActive
                  ? "Transcribing in real time"
                  : getStatusLabel(status)}
              </span>
            </div>
          </aside>
        </section>

        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <div className="flex flex-shrink-0 items-center justify-center gap-4 pt-1 sm:gap-6">
          {/* Mic toggle */}
          <button
            type="button"
            onClick={toggleMic}
            aria-label="Toggle microphone"
            className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-colors
              ${
                isMicActive
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
          >
            {isMicActive ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>

          {/* End call */}
          <button
            type="button"
            onClick={handleEndInterview}
            aria-label="End interview"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
          >
            <Phone className="h-6 w-6 rotate-[135deg]" />
          </button>

          {/* Camera toggle */}
          <button
            type="button"
            onClick={() => setIsCameraOn((prev) => !prev)}
            aria-label="Toggle camera"
            className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-colors
              ${
                isCameraOn
                  ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  : "bg-red-100 text-red-600 hover:bg-red-200"
              }`}
          >
            {isCameraOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default Page;
