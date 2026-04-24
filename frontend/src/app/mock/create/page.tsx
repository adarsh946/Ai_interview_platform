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
}

export default Page;
