"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { removeToken, decodeToken } from "@/lib/auth";

interface LogoutButtonProps {
  variant?: "default" | "navbar";
}

export default function LogoutButton({ variant = "default" }: LogoutButtonProps) {
  const router = useRouter();
  const user = decodeToken();

  const handleLogout = () => {
    removeToken();
    router.push("/");
  };

  return (
    <div className="flex items-center gap-3">
      {/* Avatar + username */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {user?.username?.[0]?.toUpperCase() ?? <User size={12} />}
        </div>
        <span className="text-sm text-zinc-300 font-medium">{user?.username ?? "User"}</span>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors duration-200"
        aria-label="Sign out"
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  );
}
