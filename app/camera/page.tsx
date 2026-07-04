"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Navbar from "../components/Navbar";
import Dashboard from "../components/Dashboard";
import { ScanFace } from "lucide-react";
import Link from "next/link";

export default function CameraPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Your connections</h1>
            <p className="text-zinc-500 text-sm mt-1">People you've met, sorted by most recent encounter</p>
          </div>

          {/* Camera trigger */}
          <Link
            href="/camera/scan"
            className="flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 shadow-lg shadow-white/5 shrink-0 cursor-pointer"
          >
            <ScanFace size={17} />
            Scan face
          </Link>
        </div>

        {/* People dashboard */}
        <Dashboard />
      </main>
    </div>
  );
}
