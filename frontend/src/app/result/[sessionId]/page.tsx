"use client";

import api from "@/lib/api";
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Quote,
  TrendingUp,
  ChevronDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";
import { useRouter } from "next/router";

interface TranscriptEntry {
  question: string;
  answer: string;
  score: number;
  evaluation: string;
}

interface Result {
  transcript: TranscriptEntry[];
  overallFeedback: string | null;
  overallScore: number;
  expressions: any;
  strengths: string[];
  improvements: string[];
  session: {
    mockInterview: {
      role: string;
      round: string;
      difficulty: string;
    };
  };
}

export default function Page({ params }: { params: { sessionId: string } }) {
  const [result, setResult] = useState<Result | null>(null);
  const [expandIndex, setExpandIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { sessionId } = params;

  useEffect(() => {
    const fetchResult = async () => {
      setIsLoading(true);

      try {
        const results = await api.get(`/result/${sessionId}`);
        if (!results) {
          setError("cannot found sessionId");
        }
        setResult(results.data);
      } catch {
        setError("Unable to find sessionId");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, []);

  const router = useRouter();

  const getScoreLabel = (score: number): string => {
    if (score >= 7) return "Excellent";
    if (score >= 5) return "Good";
    return "Needs Improvement";
  };

  const getScoreBg = (score: number): string => {
    if (score >= 7) return "bg-emerald-50 ring-emerald-200";
    if (score >= 5) return "bg-amber-50 ring-amber-200";
    return "bg-red-50 ring-red-200";
  };

  const getScoreColor = (score: number): string => {
    if (score >= 7) return "text-emerald-500";
    if (score >= 5) return "text-amber-500";
    return "text-red-500";
  };

  const chartData =
    result?.transcript.map((entry, index) => ({
      name: `Q${index + 1}`,
      score: entry.score,
    })) ?? [];

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading your results...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 p-4 md:p-8">
      {/* HEADER */}
      <div className="relative flex items-center justify-center mb-8">
        <Button
          variant="ghost"
          className="absolute left-0 flex items-center gap-2 text-slate-600"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft size={18} /> Dashboard
        </Button>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            Interview Complete
          </h1>
          <p className="text-slate-500 mt-1">Here's how you performed</p>
        </div>
      </div>

      {/* HERO SCORE CARD */}
      <Card className="rounded-2xl shadow-xl border border-white/60 backdrop-blur-sm mb-8">
        <CardContent className="flex flex-col items-center py-10">
          {/* Score Circle */}
          <div className="w-36 h-36 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600">
                {result?.overallScore}
                <span className="text-lg text-slate-500">/10</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold text-emerald-600">
            {getScoreLabel(result?.overallScore ?? 0)}
          </p>

          {/* Pills */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Badge className="bg-emerald-100 text-emerald-700">
              {result?.session?.mockInterview?.role}
              {result?.session?.mockInterview?.round}
              {result?.session?.mockInterview?.difficulty}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700">Technical</Badge>
            <Badge className="bg-slate-100 text-slate-700">Medium</Badge>
          </div>
        </CardContent>
      </Card>

      {/* TWO COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* AI Feedback */}
          <Card className="rounded-2xl shadow-xl border border-white/60 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote size={18} /> AI Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 leading-relaxed">
              {result?.overallFeedback ?? "No feedback available"}
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card className="rounded-2xl shadow-xl border border-white/60 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={18} /> Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {result?.strengths.map((strength, index) => (
                <Badge key={index} className="bg-emerald-100 text-emerald-700">
                  {strength}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Improvements */}
          <Card className="rounded-2xl shadow-xl border border-white/60 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <TrendingUp size={18} /> Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {result?.improvements.map((improvement, index) => (
                <Badge key={index} className="bg-amber-100 text-amber-700">
                  {improvement}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="rounded-2xl shadow-xl border border-white/60 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle>Question Scores</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" />
                  <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TRANSCRIPT */}
      <Card className="rounded-2xl shadow-xl border border-white/60 backdrop-blur-sm mb-8">
        <CardHeader>
          <CardTitle>Interview Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result?.transcript.map((entry, index) => (
            <div
              key={index}
              className="border rounded-xl p-4 bg-white/70 flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold text-slate-700">
                  Q{index + 1}: {entry.question}
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${getScoreBg(entry.score)} ${getScoreColor(
                      entry.score
                    )}`}
                  >
                    {entry.score}/10
                  </Badge>
                  <button
                    onClick={() =>
                      setExpandIndex(expandIndex === index ? null : index)
                    }
                  >
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${
                        expandIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {expandIndex === index && (
                <div className="text-sm text-slate-600 mt-2 space-y-1">
                  <p>
                    <strong>Answer:</strong> {entry.answer}
                  </p>
                  <p>
                    <strong>Evaluation:</strong> {entry.evaluation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ACTION BUTTONS */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => router.push("/mock/create")}>
          Try Again
        </Button>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
