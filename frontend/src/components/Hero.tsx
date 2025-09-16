import React from "react";
import { Button } from "./ui/button";

const Hero = () => {
  return (
    <div className="mx-auto mt-30 flex flex-col items-center w-full">
      <div className="flex flex-col">
        <h1 className="font-medium tracking-tighter text-7xl text-center">
          Ace Your Next Interview <br />{" "}
          <span className="text-emerald-500"> with AI-Powered Practice</span>
        </h1>
        <p className="text-neutral-800 text-xl text-center mt-4 max-w-4xl">
          Prepare for any job interview with personalized AI feedback, realistic
          mock interviews, and expert curated questions tailored to your
          industry.
        </p>
      </div>
      <div className="flex w-full mx-auto justify-center gap-6 mt-5">
        {" "}
        <Button className="bg-[#10B981] hover:bg-emerald-400 cursor-pointer px-6">
          Get Started
        </Button>
        <Button className="bg-transparent hover:bg-emerald-100 cursor-pointer text-slate-700 border border-emerald-500">
          Watch Demo
        </Button>
      </div>
    </div>
  );
};

export default Hero;
