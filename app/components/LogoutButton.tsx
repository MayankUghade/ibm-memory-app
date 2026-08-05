"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { removeToken, decodeToken, TokenPayload } from "@/lib/auth";
import { useEffect, useState } from "react";

interface LogoutButtonProps {
  variant?: "default" | "navbar";
}

export default function LogoutButton({ variant = "default" }: LogoutButtonProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<TokenPayload | null>(null);

  useEffect(() => {
    setMounted(true);
    setUser(decodeToken());
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push("/");
  };

  const displayUser = mounted ? user : null;

  return (
    <div className="flex items-center gap-3">
      {/* Avatar + username */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {displayUser?.username?.[0]?.toUpperCase() ?? <User size={12} />}
        </div>
        <span className="text-sm text-zinc-300 font-medium">{displayUser?.username ?? "User"}</span>
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

