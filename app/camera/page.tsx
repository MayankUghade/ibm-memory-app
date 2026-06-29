"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Navbar from "../components/Navbar";
import Dashboard from "../components/Dashboard";
import Camera from "../components/Camera";
import { ScanFace } from "lucide-react";

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
          <button
            onClick={() => setCameraOpen(true)}
            className="flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 shadow-lg shadow-white/5 shrink-0"
          >
            <ScanFace size={17} />
            Scan face
          </button>
        </div>

        {/* People dashboard */}
        <Dashboard />
      </main>

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl mx-4 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-base">Face scanner</h2>
              <button
                onClick={() => setCameraOpen(false)}
                className="text-zinc-500 hover:text-white w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center transition-all"
              >
                &times;
              </button>
            </div>
            <Camera />
          </div>
        </div>
      )}
    </div>
  );
}
