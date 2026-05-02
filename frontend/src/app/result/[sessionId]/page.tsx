import api from "@/lib/api";
import { useEffect, useState } from "react";

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
  return;
}
