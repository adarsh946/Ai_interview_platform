"use client";

import api from "@/lib/api";
import socket from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Camera,
  Mic,
  Volume2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Clock,
  BarChart2,
  RefreshCw,
  ChevronRight,
  Info,
  Layers,
} from "lucide-react";

function CheckItem({
  icon,
  label,
  sublabel,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  status: "ok" | "fail" | "checking";
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 truncate">{sublabel}</p>
      </div>
      <div className="shrink-0">
        {status === "ok" && (
          <CheckCircle2 size={18} className="text-emerald-500" />
        )}
        {status === "fail" && <XCircle size={18} className="text-red-400" />}
        {status === "checking" && (
          <RefreshCw size={16} className="text-slate-400 animate-spin" />
        )}
      </div>
    </div>
  );
}

function DetailBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

interface MockInterview {
  id: string;
  role: string;
  round: string;
  difficulty: string;
  duration: number;
  skills: string[];
  resumeText: string | null;
}

function Page({ params }: { params: { mockInterviewId: string } }) {
  const { mockInterviewId } = params;

  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [micReady, setMicReady] = useState<boolean>(false);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mockInterview, setMockInterview] = useState<MockInterview | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const { data } = await api.get(`/mock/${mockInterviewId}`);
        setMockInterview(data.interview);
      } catch (err) {
        setError("Failed to load interview details");
      }
    };

    fetchInterview();
  }, []);

  useEffect(() => {
    let localStream: MediaStream;

    const startCamera = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }

        setStream(localStream);
        setCameraReady(true);
        setMicReady(true);
      } catch (err) {
        setError("Camera or microphone access denied");
      }
    };

    startCamera();

    // cleanup so that if intrvew ends camera, mic also stops..
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleStartInterview = async () => {
    if (!mockInterview) {
      setError("Interview details not loaded. Please refresh.");
      return; //  stop here
    }

    setIsLoading(true);

    try {
      const response = await api.post("/session/start-session", {
        mockInterviewId,
      });
      const sessionId = response.data.sessionId;

      socket.connect();

      socket.emit("session:join", { sessionId });

      socket.on("interview:status", (data) => {
        if (data.status === "joined") {
          socket.emit("interview:start", {
            sessionId,
            role: mockInterview.role,
            round: mockInterview.round,
            difficulty: mockInterview.difficulty,
            duration: mockInterview.duration,
            skills: mockInterview.skills,
            resumeText: mockInterview.resumeText,
          });
          router.push(`/interview/room/${sessionId}`);
        }
      });
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 py-10 px-4">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto space-y-6">
        {/* Page title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Interview Setup
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Make sure your camera and microphone are working before you begin
          </p>
        </div>

        {/* ── Two column layout ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Camera feed */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl shadow-slate-200/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-slate-800">
                  Camera Preview
                </span>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Live
              </span>
            </div>

            {/* Video */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video">
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />

              {/* Overlay when no camera */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                  <Camera size={24} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-400">
                  Waiting for camera access…
                </p>
              </div>

              {/* Corner label */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white font-medium">You</span>
              </div>
            </div>
          </div>

          {/* Right — Checks + Details */}
          <div className="space-y-4">
            {/* System checks */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl shadow-slate-200/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">
                  System Checks
                </h2>
              </div>

              <div className="space-y-2.5">
                <CheckItem
                  icon={<Camera size={16} className="text-emerald-600" />}
                  label="Camera"
                  sublabel="HD Camera detected"
                  status="ok"
                />
                <CheckItem
                  icon={<Mic size={16} className="text-emerald-600" />}
                  label="Microphone"
                  sublabel="Built-in microphone active"
                  status="ok"
                />
                <CheckItem
                  icon={<Volume2 size={16} className="text-amber-500" />}
                  label="Audio Output"
                  sublabel="No audio device found"
                  status="fail"
                />
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-600 transition-colors">
                <RefreshCw size={13} />
                Re-check devices
              </button>
            </div>

            {/* Interview details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl shadow-slate-200/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Briefcase size={14} className="text-emerald-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Interview Details
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <DetailBadge
                  icon={<Briefcase size={14} className="text-emerald-600" />}
                  label="Role"
                  value="Frontend Developer"
                />
                <DetailBadge
                  icon={<Layers size={14} className="text-emerald-600" />}
                  label="Round"
                  value="Technical"
                />
                <DetailBadge
                  icon={<BarChart2 size={14} className="text-emerald-600" />}
                  label="Difficulty"
                  value="Medium"
                />
                <DetailBadge
                  icon={<Clock size={14} className="text-emerald-600" />}
                  label="Duration"
                  value="30 minutes"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Instructions ──────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl shadow-slate-200/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Info size={14} className="text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">
              Before You Begin
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                num: "01",
                title: "Speak clearly",
                desc: "Answer questions out loud — the AI listens and evaluates your spoken responses.",
              },
              {
                num: "02",
                title: "Stay on screen",
                desc: "Keep your face visible throughout the session for expression analysis.",
              },
              {
                num: "03",
                title: "Take your time",
                desc: "You can pause briefly to think — the AI waits for you to finish speaking.",
              },
              {
                num: "04",
                title: "Quiet environment",
                desc: "Find a quiet space to minimise background noise for better accuracy.",
              },
            ].map((item) => (
              <div
                key={item.num}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 shrink-0">
                  {item.num}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Start button ──────────────────────────────────────────────────── */}
        <button className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-2xl transition-colors shadow-lg shadow-emerald-200/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2">
          Start Interview
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Page;
