"use client";

import React, { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: "login" | "register";
}

export default function AuthModals({ isOpen, onClose, initialMode }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  
  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" 
        ? { email, password }
        : { username, email, password };

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || `${mode === "login" ? "Sign in" : "Registration"} failed`);
      }

      if (data.token) {
        localStorage.setItem("pf_token", data.token);
        window.location.href = "/camera";
      } else {
        throw new Error("No authentication token received from server");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleMode = () => {
    setError(null);
    setMode(mode === "login" ? "register" : "login");
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <div 
      className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={handleOverlayClick}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-8 relative shadow-2xl flex flex-col mx-4">
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>

        <h2 className="text-white text-2xl font-bold text-center tracking-tight mb-1">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h2>
        <p className="text-zinc-400 text-sm text-center mb-6">
          {mode === "login" 
            ? "Sign in to Recall to view recognized faces" 
            : "Get started for free and match faces instantly"
          }
        </p>

        {error && (
          <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-zinc-300 text-sm font-medium">Username</label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="bg-zinc-950 border border-zinc-700 rounded-md text-white px-3 py-2 text-sm focus:border-white focus:outline-none transition-colors placeholder-zinc-600"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-zinc-300 text-sm font-medium">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-zinc-950 border border-zinc-700 rounded-md text-white px-3 py-2 text-sm focus:border-white focus:outline-none transition-colors placeholder-zinc-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-zinc-300 text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-zinc-950 border border-zinc-700 rounded-md text-white px-3 py-2 text-sm focus:border-white focus:outline-none transition-colors placeholder-zinc-600"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-white text-zinc-950 rounded-md py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity duration-200 w-full mt-2 disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-zinc-400 text-sm text-center mt-6">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          <button 
            className="text-white underline cursor-pointer font-medium hover:text-zinc-200 ml-1 bg-transparent border-none p-0 inline"
            onClick={toggleMode}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
