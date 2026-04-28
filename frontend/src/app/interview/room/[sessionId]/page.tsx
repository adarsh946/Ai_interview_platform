"use client";

import socket from "@/lib/socket";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

function Page({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const router = useRouter();

  // ── UI State
  const [status, setStatus] = useState<InterviewStatus>("starting");
  const [error, setError] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);

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

  // currentAnswer ref — needed inside recognition callback
  // because closures capture stale state values
  const currentAnswerRef = useRef<string>("");
  const currentQuestionRef = useRef<string>("");

  // ─── Camera Setup ──────────────────────────────────────────────────────────

  useEffect(() => {
    let localStream: MediaStream;

    const startCamera = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false, // audio handled by Web Speech API
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
    // Check browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Your browser does not support speech recognition. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // keep listening until we stop it
    recognition.interimResults = true; // show words as they are spoken
    recognition.lang = "en-US";

    recognitionRef.current = recognition;

    // fires every time speech is detected
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

      // show interim + final combined in real time
      const combined =
        currentAnswerRef.current + finalTranscript + interimTranscript;
      setCurrentAnswer(combined);

      // update ref with only final transcript
      if (finalTranscript) {
        currentAnswerRef.current += finalTranscript;
      }
    };

    recognition.onstart = () => {
      setIsMicActive(true);
    };

    recognition.onend = () => {
      setIsMicActive(false);
      // submit answer when speech ends
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

    // don't submit empty answer
    if (!answer) return;

    setStatus("processing");
    setIsMicActive(false);

    // append to transcript history
    setTranscript((prev) => [
      ...prev,
      {
        question: currentQuestionRef.current,
        answer,
      },
    ]);

    // emit answer to backend
    socket.emit("answer:submit", {
      sessionId,
      answer,
    });

    // reset for next question
    currentAnswerRef.current = "";
    setCurrentAnswer("");
  }, [sessionId]);

  // ─── Timer ────────────────────────────────────────────────────────────────

  const startTimer = useCallback((durationInSeconds: number) => {
    setTimeLeft(durationInSeconds);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // time is up — end interview
          clearInterval(timerRef.current!);
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ─── Socket Events ─────────────────────────────────────────────────────────

  useEffect(() => {
    // Event 1 — new question received
    socket.on("interview:question", (payload: QuestionPayload) => {
      const { question, audio, questionNumber } = payload;

      console.log(`[room] question #${questionNumber}: "${question}"`);

      // update state and refs
      setCurrentQuestion(question);
      currentQuestionRef.current = question;
      setCurrentAnswer("");
      currentAnswerRef.current = "";
      setStatus("ai-speaking");

      // play TTS audio
      const blob = new Blob([audio], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audioEl = new Audio(url);
      audioRef.current = audioEl;

      audioEl.play().catch((err) => {
        console.error("[room] audio play error:", err);
      });

      // when AI finishes speaking — start listening
      audioEl.onended = () => {
        URL.revokeObjectURL(url); // cleanup memory
        setStatus("listening");
        startListening();
      };
    });

    // Event 2 — status update from backend
    socket.on("interview:status", (payload: StatusPayload) => {
      console.log(`[room] status: ${payload.status}`);

      if (payload.status === "processing") {
        setStatus("processing");
        // stop listening when backend is processing
        recognitionRef.current?.stop();
      }

      if (payload.status === "starting") {
        setStatus("starting");
        // start timer — default 30 minutes if not set
        startTimer(30 * 60);
      }

      if (payload.status === "cancelled") {
        setStatus("cancelled");
        clearInterval(timerRef.current!);
        router.push("/dashboard");
      }
    });

    // Event 3 — interview complete
    socket.on("interview:complete", (payload: CompletePayload) => {
      console.log("[room] interview complete");

      setStatus("done");

      // stop everything
      clearInterval(timerRef.current!);
      recognitionRef.current?.stop();
      audioRef.current?.pause();

      // redirect to result page
      router.push(`/result/${sessionId}`);
    });

    // Event 4 — error from backend
    socket.on("interview:error", (payload: ErrorPayload) => {
      console.error("[room] error:", payload.message);
      setError(payload.message);
    });

    // cleanup — remove all listeners on unmount
    return () => {
      socket.off("interview:question");
      socket.off("interview:status");
      socket.off("interview:complete");
      socket.off("interview:error");
    };
  }, [startListening, startTimer, sessionId, router]);

  // ─── End Interview ─────────────────────────────────────────────────────────

  const handleEndInterview = useCallback(() => {
    // stop timer
    clearInterval(timerRef.current!);

    // stop mic
    recognitionRef.current?.stop();

    // stop audio
    audioRef.current?.pause();

    // emit cancel to backend
    socket.emit("interview:cancel", {
      sessionId,
      reason: "User ended interview",
    });

    router.push("/dashboard");
  }, [sessionId, router]);

  // ─── Timer Format Helper ───────────────────────────────────────────────────

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ─── Frame Capture ─────────────────────────────────────────────────────────

  useEffect(() => {
    // capture frame every 5 seconds for expression analysis
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
        expressionData: {
          frame: frameData,
          timestamp: Date.now(),
        },
      });
    }, 5000);

    return () => clearInterval(frameInterval);
  }, [sessionId]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <span className="font-bold text-emerald-400 text-lg">BaatCheet</span>
        <span className="text-2xl font-mono font-bold text-white">
          {formatTime(timeLeft)}
        </span>
        <button
          onClick={handleEndInterview}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          End Interview
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Status indicator */}
        <div className="text-center">
          <span className="text-sm text-slate-400">
            {status === "starting" && "Preparing your interview..."}
            {status === "ai-speaking" && "AI Interviewer is speaking..."}
            {status === "listening" && "Listening to your answer..."}
            {status === "processing" && "Evaluating your answer..."}
            {status === "done" && "Interview complete!"}
          </span>
        </div>

        {/* AI Avatar */}
        <div className="flex justify-center">
          <div
            className={`w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center text-4xl
            ${
              status === "ai-speaking"
                ? "ring-4 ring-emerald-400 ring-offset-4 ring-offset-slate-950 animate-pulse"
                : ""
            }
            ${status === "processing" ? "opacity-50" : ""}
          `}
          >
            🤖
          </div>
        </div>

        {/* Question */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <p className="text-xs text-slate-500 font-medium mb-2">Question</p>
          <p className="text-white text-sm leading-relaxed">
            {currentQuestion || "Waiting for first question..."}
          </p>
        </div>

        {/* Answer */}
        <div
          className={`bg-slate-900 rounded-2xl p-5 border transition-colors
          ${isMicActive ? "border-emerald-500" : "border-slate-800"}
        `}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium">Your Answer</p>
            {isMicActive && (
              <span className="text-xs text-emerald-400 animate-pulse">
                🎤 Listening...
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            {currentAnswer || "Your answer will appear here as you speak..."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Candidate Video — bottom right */}
      <div className="fixed bottom-6 right-6">
        <div className="w-40 h-28 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export default Page;
