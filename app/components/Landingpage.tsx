"use client";

import React, { useState } from "react";
import AuthModals from "./AuthModals";

export default function Landingpage() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "login" | "register";
  }>({
    isOpen: false,
    mode: "login",
  });

  const openModal = (mode: "login" | "register") => {
    setModalState({ isOpen: true, mode });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="bg-zinc-950 text-white min-h-screen flex flex-col font-sans antialiased selection:bg-white selection:text-black">
      <header className="flex justify-between items-center px-6 py-5 max-w-7xl w-full mx-auto">
        <div 
          className="text-xl font-bold tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.location.reload()}
        >
          Recall
        </div>
        <button
          className="bg-transparent border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-md text-sm font-medium px-4 py-2 transition-all duration-200 cursor-pointer"
          onClick={() => openModal("login")}
        >
          Sign In
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center px-4 max-w-3xl w-full mx-auto text-center">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight text-white leading-none">
            Recall
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-zinc-400 tracking-tight">
            Remember everyone you meet
          </h2>
          <p className="text-zinc-500 max-w-lg text-base sm:text-lg leading-relaxed">
            Recall uses your camera to recognize faces and surface your past conversations instantly.
          </p>
          <div className="flex gap-4 justify-center flex-wrap mt-4">
            <button
              className="bg-white text-zinc-950 hover:bg-zinc-100 rounded-md px-6 py-3 font-semibold text-base transition-colors duration-200 shadow-md cursor-pointer"
              onClick={() => openModal("register")}
            >
              Get Started
            </button>
            <button
              className="bg-transparent text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 rounded-md px-6 py-3 font-semibold text-base transition-all duration-200 cursor-pointer"
              onClick={() => openModal("login")}
            >
              Sign In
            </button>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-zinc-700 text-xs">
        &copy; {new Date().getFullYear()} Recall. All rights reserved.
      </footer>

      <AuthModals
        isOpen={modalState.isOpen}
        initialMode={modalState.mode}
        onClose={closeModal}
      />
    </div>
  );
}
