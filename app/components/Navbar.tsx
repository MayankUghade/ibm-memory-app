"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const [href, setHref] = useState("/");

  useEffect(() => {
    setHref(isAuthenticated() ? "/camera" : "/");
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
        {/* Logo */}
        <Link href={href} className="text-white text-lg font-bold tracking-tight select-none cursor-pointer">
          Recall
        </Link>

        {/* Right side */}
        <LogoutButton variant="navbar" />
      </div>
    </header>
  );
}

