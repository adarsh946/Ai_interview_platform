"use client";

import api from "@/lib/api";
import socket from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface MockInterview {
  id: string;
  role: string;
  round: string;
  difficulty: string;
  duration: number;
  skills: string[];
  resumeText: string | null;
}

const [mockInterview, setMockInterview] = useState<MockInterview | null>(null); // ✅

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
          videoRef.current.srcObject = stream;
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
      stream?.getTracks().forEach((track) => track.stop());
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
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
}

export default Page;
