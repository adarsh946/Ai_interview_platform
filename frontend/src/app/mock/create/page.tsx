import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    if (!currentskill) {
      return;
    }
    if (skills.includes(currentskill)) {
      return;
    }
    setSkills([...skills, currentskill]);
    setCurrentSkill("");
  }

  const removeSkill = (removeIdx: number) => {
    const updatedSkill = skills.filter((_, index) => index !== removeIdx);
    setSkills(updatedSkill);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file.type === "application/pdf") {
      setResume(file);
    } else {
      setError("Please add a pdf file");
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // validate if resume is selected and skill array is not empty

    if (!resume) {
      setError("Please provide resume.");
      return;
    }
    if (skills.length === 0) {
      setError("No skills is selected");
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
      formData.append("resume", resume); // File object

      const { data } = await api.post("/mock/create", formData);

      router.push(`/interview/setup/${data.interviewId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
}

export default Page;
