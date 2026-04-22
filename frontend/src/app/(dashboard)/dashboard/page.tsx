import { useAuthStore } from "@/store/authStore";
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Plus,
  Star,
  Briefcase,
  ChevronRight,
  MessageSquare,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING" | "CANCELLED";

interface MockInterview {
  id: string;
  role: string;
  round: string;
  difficulty: string;
  status: InterviewStatus;
  date: string;
}

const INTERVIEWS: MockInterview[] = [
  {
    id: "1",
    role: "Frontend Developer",
    round: "Technical",
    difficulty: "Medium",
    status: "COMPLETED",
    date: "Apr 18, 2026",
  },
  {
    id: "2",
    role: "Product Manager",
    round: "Behavioral",
    difficulty: "Hard",
    status: "IN_PROGRESS",
    date: "Apr 20, 2026",
  },
  {
    id: "3",
    role: "Backend Engineer",
    round: "System Design",
    difficulty: "Easy",
    status: "PENDING",
    date: "Apr 21, 2026",
  },
];

const statusConfig: Record<
  InterviewStatus,
  { label: string; className: string; action: string }
> = {
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    action: "View Result",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
    action: "Continue",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
    action: "Start Interview",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 border border-red-200",
    action: "Retry",
  },
};

const difficultyConfig: Record<string, string> = {
  Easy: "bg-teal-50 text-teal-700 border border-teal-200",
  Medium: "bg-orange-50 text-orange-700 border border-orange-200",
  Hard: "bg-rose-50 text-rose-700 border border-rose-200",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg shadow-slate-200/50 p-6 flex items-center gap-4 hover:shadow-xl hover:shadow-slate-200/60 transition-shadow duration-200">
      <div
        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function InterviewCard({ interview }: { interview: MockInterview }) {
  const status = statusConfig[interview.status];
  const difficulty =
    difficultyConfig[interview.difficulty] ?? difficultyConfig["Medium"];

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg shadow-slate-200/40 p-5 hover:shadow-xl hover:shadow-emerald-100/60 hover:-translate-y-0.5 transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <Briefcase size={16} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">
              {interview.role}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {interview.round}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${difficulty}`}
              >
                {interview.difficulty}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
        <Calendar size={12} />
        {interview.date}
      </div>

      {/* Action */}
      <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors duration-150">
        {status.action}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 shadow-inner">
        <MessageSquare size={32} className="text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">
        No interviews yet
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-xs mb-6">
        Start your first mock interview and get AI-powered feedback
      </p>
      <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-200">
        <Plus size={16} />
        Create Interview
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/80 rounded-2xl border border-white/60 shadow-lg shadow-slate-200/40 p-5 animate-pulse">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
          <div className="flex gap-1.5">
            <div className="h-4 bg-slate-100 rounded-full w-16" />
            <div className="h-4 bg-slate-100 rounded-full w-14" />
          </div>
        </div>
        <div className="h-5 bg-slate-100 rounded-full w-20" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-28 mb-4" />
      <div className="h-9 bg-slate-100 rounded-xl w-full" />
    </div>
  );
}

export default function Page() {
  const [interviews, setInterviews] = useState();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const user = useAuthStore((state) => state.user);
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const router = useRouter;

  useEffect(() => {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, John 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Here&apos;s an overview of your interview practice
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-200 w-fit">
            <Plus size={16} />
            New Interview
          </button>
        </div>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            icon={<BarChart2 size={20} className="text-emerald-600" />}
            label="Total Interviews"
            value={12}
            accent="bg-emerald-50 border border-emerald-100"
          />
          <StatCard
            icon={<CheckCircle2 size={20} className="text-emerald-600" />}
            label="Completed"
            value={8}
            accent="bg-emerald-50 border border-emerald-100"
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-emerald-600" />}
            label="Average Score"
            value="7.4 / 10"
            accent="bg-emerald-50 border border-emerald-100"
          />
        </div>

        {/* ── Interviews List ───────────────────────────────────────────────── */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl shadow-slate-200/40 p-6">
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Clock size={15} className="text-emerald-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">
                Your Interviews
              </h2>
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {INTERVIEWS.length} total
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : showEmpty ? (
              <EmptyState />
            ) : (
              INTERVIEWS.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
