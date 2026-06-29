"use client";

import LogoutButton from "./LogoutButton";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
        {/* Logo */}
        <span className="text-white text-lg font-bold tracking-tight select-none">
          Recall
        </span>

        {/* Right side */}
        <LogoutButton variant="navbar" />
      </div>
    </header>
  );
}
