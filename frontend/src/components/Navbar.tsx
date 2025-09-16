"use client";

import Link from "next/link";
import { Button } from "./ui/button";

const Navbar = () => {
  const links = [
    {
      href: "/mock",
      tittle: "Mock",
    },
    {
      href: "/pricing",
      tittle: "Pricing",
    },
    {
      href: "/jobs",
      tittle: "Jobs",
    },
    {
      href: "/login",
      tittle: "Log in",
    },
  ];
  return (
    <div className=" flex justify-between items-center px-4  ">
      <h1 className="text-black font-bold text-2xl">BaatCheet</h1>

      <div className="flex  items-center gap-7">
        {links.map((link, idx) => (
          <Link
            href={link.href}
            key={idx}
            className="font-medium text-neutral-900 hover:text-neutral-600 transition duration-200"
          >
            {link.tittle}
          </Link>
        ))}
        <Button className="bg-[#10B981] hover:bg-emerald-400 cursor-pointer">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
