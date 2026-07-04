"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { createEncounter } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type RecordingState = "loading" | "waiting" | "recording" | "saving" | "done";

export default function RecordPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const faceCheckLoopRef = useRef<NodeJS.Timeout | null>(null);
  const capturedEmbeddingRef = useRef<number[] | null>(null);
  const faceapiRef = useRef<any>(null);

  const [recordingState, setRecordingState] = useState<RecordingState>("loading");
  const [statusLine, setStatusLine] = useState("Starting up...");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("pf_token");
    if (!token) router.push("/login");
  }, []);

  useEffect(() => {
    let stopped = false;

    async function init() {
      setStatusLine("Loading models...");
      const faceapi = await import("face-api.js");
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      faceapiRef.current = faceapi;

      if (stopped) return;

      setStatusLine("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current!.play();
        setRecordingState("waiting");
        setStatusLine("Point the camera at the person...");
        startFaceCheckLoop();
      };
    }

    init().catch((err) => {
      console.error(err);
      setStatusLine("Camera or mic permission denied.");
    });

    return () => { stopped = true; cleanup(); };
  }, []);

  function startFaceCheckLoop() {
    faceCheckLoopRef.current = setInterval(async () => {
      if (!videoRef.current || !faceapiRef.current) return;
      if (capturedEmbeddingRef.current) return;

      try {
        const detections = await faceapiRef.current
          .detectAllFaces(videoRef.current, new faceapiRef.current.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length === 0) return;

        capturedEmbeddingRef.current = Array.from(detections[0].descriptor);
        console.log(capturedEmbeddingRef)

        if (faceCheckLoopRef.current) {
          clearInterval(faceCheckLoopRef.current);
          faceCheckLoopRef.current = null;
        }

        await startMicRecording();
      } catch (err) {
        console.error("[face check]", err);
      }
    }, 800);
  }

  async function startMicRecording() {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = ms;
      setMicStream(ms); // passed to waveform
      chunksRef.current = [];

      const recorder = new MediaRecorder(ms, { mimeType: "audio/webm" });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = handleSave;

      recorder.start();
      mediaRecorderRef.current = recorder;

      setRecordingState("recording");
      setStatusLine("Recording...");
    } catch (err) {
      console.error(err);
      setStatusLine("Microphone permission denied.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    setMicStream(null);
    setRecordingState("saving");
    setStatusLine("Saving...");
  }

    console.log("Chunks:", chunksRef.current.length);

  const blob = new Blob(chunksRef.current, {
    type: "audio/webm",
  });

  console.log("Blob size:", blob.size);


  async function handleSave() {
  // Check if we have the required data
  if (!chunksRef.current || chunksRef.current.length === 0) {
    setStatusLine("No audio recording found.");
    return;
  }

  if (!capturedEmbeddingRef.current) {
    setStatusLine("No face embedding captured.");
    return;
  }

  try {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    
    // Use the createEncounter function
    const result = await createEncounter({
      audio: blob,
      embedding: capturedEmbeddingRef.current
    });
    
    // Handle response
    if (result.person) {
      setSavedName(result.person.name ?? null);
    } else {
      setSavedName(null);
    }
    
    setRecordingState("done");
    setStatusLine(`Saved successfully${result.person?.name ? ` as ${result.person.name}` : ''}.`);
    
  } catch (err) {
    console.error("Save error:", err);
    setStatusLine("Save failed. Check backend.");
    setRecordingState("waiting");
    capturedEmbeddingRef.current = null;
    startFaceCheckLoop();
  }
}

  function recordAnother() {
    capturedEmbeddingRef.current = null;
    chunksRef.current = [];
    setSavedName(null);
    setMicStream(null);
    setRecordingState("waiting");
    setStatusLine("Point the camera at the person...");
    startFaceCheckLoop();
  }

  function cleanup() {
    if (faceCheckLoopRef.current) { clearInterval(faceCheckLoopRef.current); faceCheckLoopRef.current = null; }
    mediaRecorderRef.current?.stop();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden">
      <Navbar />

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 bg-zinc-950">
        <button
          onClick={() => { cleanup(); router.push("/camera/scan"); }}
          className="px-6 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer border-b-2 border-transparent"
        >
          Recognize
        </button>
        <button className="px-6 py-3 text-sm font-medium text-white border-b-2 border-white">
          Record
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden bg-zinc-950">
        {/* Camera always mounted */}
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Dim overlay when not actively recording */}
        {recordingState !== "recording" && (
          <div className="absolute inset-0 bg-black/55 z-10" />
        )}

        {/* ── Loading / waiting ── */}
        {(recordingState === "loading" || recordingState === "waiting") && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-white/15 animate-ping" />
              <div className="absolute inset-3 rounded-full border border-white/20" />
              <span className="text-3xl">👤</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-white/80 text-sm font-medium">{statusLine}</p>
              <p className="text-white/25 text-xs">Recording starts automatically once a face is detected</p>
            </div>
          </div>
        )}

        {/* ── Recording ── */}
        {recordingState === "recording" && (
          <>
            {/* Top-left — recording badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-red-500/30 rounded-full px-3.5 py-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">Recording</span>
            </div>

            {/* Bottom center — waveform + stop button stacked */}
            <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center gap-4">
              {/* Waveform */}
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3">
                <AudioWaveform stream={micStream} />
              </div>

              {/* Stop button */}
              <button
                onClick={stopRecording}
                className="bg-white hover:bg-zinc-100 text-black text-sm font-semibold px-8 py-3 rounded-full transition-colors cursor-pointer shadow-2xl"
              >
                ⏹ Stop & Save
              </button>
              <p className="text-white/25 text-xs">Tap when the conversation ends</p>
            </div>
          </>
        )}

        {/* ── Saving ── */}
        {recordingState === "saving" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Transcribing and saving...</p>
          </div>
        )}

        {/* ── Done ── */}
        {recordingState === "done" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-green-600/20 border border-green-500/40 flex items-center justify-center text-3xl">
                ✓
              </div>
              <p className="text-white/90 text-sm font-medium mt-1">
                {savedName ? `Saved as "${savedName}"` : "Saved (name not detected)"}
              </p>
              <p className="text-white/30 text-xs">Conversation stored successfully</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={recordAnother}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                + Record another
              </button>
              <button
                onClick={() => { cleanup(); router.push("/camera/scan"); }}
                className="bg-white hover:bg-zinc-200 text-black text-xs font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Go to Recognize
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Live audio waveform ───────────────────────────────────────────────────────

function AudioWaveform({ stream }: { stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64; // 32 bars — clean, not cluttered
    source.connect(analyser);
    audioCtxRef.current = audioCtx;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const totalBars = bufferLength;
      const barW = (canvas.width / totalBars) * 0.6;
      const gap = (canvas.width / totalBars) * 0.4;
      const centerY = canvas.height / 2;

      for (let i = 0; i < totalBars; i++) {
        const value = dataArray[i] / 255;
        // Minimum bar height so it's always visible even in silence
        const barH = Math.max(4, value * canvas.height * 0.9);
        const x = i * (barW + gap) + gap / 2;

        const alpha = 0.3 + value * 0.7;
        const gradient = ctx.createLinearGradient(0, centerY - barH / 2, 0, centerY + barH / 2);
        gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
        gradient.addColorStop(1, `rgba(255,255,255,${alpha * 0.3})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, centerY - barH / 2, barW, barH, barW / 2);
        ctx.fill();
      }
    }

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtx.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width={260}
      height={52}
    />
  );
}