"use client";

import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Upload,
  X,
  Plus,
  AlertCircle,
  Loader2,
  FileText,
  Briefcase,
  ChevronDown,
} from "lucide-react";

const ROUND_OPTIONS = [
  "Technical",
  "Behavioral",
  "HR",
  "System Design",
  "Case Study",
];
const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

function Page() {
  const [role, setRole] = useState<string>("");
  const [round, setRound] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentskill, setCurrentSkill] = useState<string>("");
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

  function addSkill() {
    if (!currentskill) return;
    if (skills.includes(currentskill)) return;
    setSkills([...skills, currentskill]);
    setCurrentSkill("");
  }

  const removeSkill = (removeIdx: number) => {
    setSkills(skills.filter((_, index) => index !== removeIdx));
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === "application/pdf") {
      setResume(file);
      setError(null);
    } else {
      setError("Please upload a PDF file only");
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!resume) {
      setError("Please provide a resume.");
      return;
    }
    if (skills.length === 0) {
      setError("Please add at least one skill.");
      return;
    }
    if (!role || !round || !difficulty || !duration) {
      setError("Please fill in all required fields.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("role", role);
      formData.append("round", round);
      formData.append("difficulty", difficulty);
      formData.append("duration", duration);
      formData.append("skills", JSON.stringify(skills));
      formData.append("resume", resume);

      const { data } = await api.post("/mock/create", formData);
      router.push(`/interview/setup/${data.interviewId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 py-12 px-4">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/60 border border-white/60 p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Briefcase size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Create Mock Interview
              </h1>
              <p className="text-xs text-slate-500">
                Fill in the details to set up your personalized AI interview
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-6" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1 — Role + Round */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Job Role */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Job Role <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>

              {/* Interview Round */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Interview Round <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">Select round</option>
                    {ROUND_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 2 — Difficulty + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Difficulty Level <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">Select difficulty</option>
                    <option value="Easy">🟢 Easy</option>
                    <option value="Medium">🟠 Medium</option>
                    <option value="Hard">🔴 Hard</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Duration <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">Select duration</option>
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Skills to Evaluate <span className="text-rose-400">*</span>
              </label>

              {/* Skill badges */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="hover:bg-emerald-100 rounded-full p-0.5 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Skill input row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentskill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a skill and press Enter or Add"
                  className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-emerald-200"
                >
                  <Plus size={15} />
                  Add
                </button>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Resume <span className="text-rose-400">*</span>
              </label>
              <p className="text-xs text-slate-400 -mt-1">
                PDF files only, max 5MB
              </p>

              {/* Hidden file input */}
              <input
                id="resume-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {resume !== null ? (
                /* Success state */
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-800 truncate">
                      {resume.name}
                    </p>
                    <p className="text-xs text-emerald-600">
                      File selected successfully
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResume(null)}
                    className="text-emerald-400 hover:text-emerald-600 transition-colors p-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                /* Upload area */
                <div
                  onClick={() =>
                    document.getElementById("resume-input")?.click()
                  }
                  className="flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                    <Upload
                      size={18}
                      className="text-slate-400 group-hover:text-emerald-500 transition-colors"
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">PDF only</p>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600">
                <AlertCircle size={15} className="shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-200/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Interview"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Page;
