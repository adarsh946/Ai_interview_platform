"use client";

import socket from "@/lib/socket";
import { Mic, Phone, User, Video } from "lucide-react";
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
    <main className="min-h-screen bg-slate-50 text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:h-full lg:px-8">
        {/* Top bar */}
        <header className="flex flex-shrink-0 items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Mock Interview
            </span>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              Frontend Developer
            </h1>
          </div>

          {/* Timer badge */}
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 ring-1 ring-emerald-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-emerald-700">
              00:12:34
            </span>
          </div>
        </header>

        {/* Main content: left video stack + right chat */}
        <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-5">
          {/* LEFT — video stack */}
          <div className="flex min-h-0 flex-col gap-3 sm:gap-4 lg:col-span-3">
            {/* Videos area: on desktop fills available height, splits 50/50.
                On mobile each tile keeps a 16:9 ratio. */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
              {/* AI Interviewer (top) */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm aspect-video lg:aspect-auto lg:min-h-0 lg:flex-1 lg:basis-0">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="relative aspect-square h-[70%] max-h-56 min-h-20">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
                    <span
                      className="absolute inset-[7%] animate-pulse rounded-full bg-blue-400/30"
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
                <div className="absolute bottom-3 left-3 rounded-md bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm">
                  AI Interviewer
                </div>
              </div>

              {/* Candidate (bottom) */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm aspect-video lg:aspect-auto lg:min-h-0 lg:flex-1 lg:basis-0">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="flex aspect-square h-[70%] max-h-56 min-h-20 items-center justify-center rounded-full bg-slate-800/80">
                    <User className="h-1/2 w-1/2 text-slate-600" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  You
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — chat (40% on lg) */}
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

            {/* Messages — scrollable */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {/* AI message */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500">
                  <span className="text-[10px] font-bold text-white">AI</span>
                </div>
                <div className="flex max-w-[85%] flex-col gap-1">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5">
                    <p className="text-sm leading-relaxed text-slate-800">
                      Hi! Let's get started with a few questions about your
                      background.
                    </p>
                  </div>
                  <span className="px-1 text-[10px] text-slate-400">
                    10:02 AM
                  </span>
                </div>
              </div>

              {/* User message */}
              <div className="flex flex-row-reverse gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-800">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex max-w-[85%] flex-col items-end gap-1">
                  <div className="rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-2.5">
                    <p className="text-sm leading-relaxed text-white">
                      Sure, I'm ready whenever you are.
                    </p>
                  </div>
                  <span className="px-1 text-[10px] text-slate-400">
                    10:02 AM
                  </span>
                </div>
              </div>

              {/* AI question */}
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
                      Tell me about your experience with React and component
                      architecture
                    </p>
                  </div>
                  <span className="px-1 text-[10px] text-slate-400">
                    10:03 AM
                  </span>
                </div>
              </div>

              {/* User answer (live) */}
              <div className="flex flex-row-reverse gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-800">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex max-w-[85%] flex-col items-end gap-1">
                  <div className="rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-2.5">
                    <p className="text-sm leading-relaxed text-white">
                      I have been working with React for about 3 years
                      <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-white align-middle" />
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-600">
                      Speaking…
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="flex flex-shrink-0 items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-slate-500">
                Transcribing in real time
              </span>
            </div>
          </aside>
        </section>

        {/* Controls — centered, outside both panels */}
        <div className="flex flex-shrink-0 items-center justify-center gap-4 pt-1 sm:gap-6">
          <button
            type="button"
            aria-label="Toggle microphone"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-700 shadow-md transition hover:bg-slate-300"
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="End call"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
          >
            <Phone className="h-6 w-6 rotate-[135deg]" />
          </button>
          <button
            type="button"
            aria-label="Toggle camera"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-700 shadow-md transition hover:bg-slate-300"
          >
            <Video className="h-5 w-5" />
          </button>
        </div>
      </div>
    </main>
  );
}

export default Page;
