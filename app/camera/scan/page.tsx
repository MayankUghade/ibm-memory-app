"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { getPersonById, matchFace } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Encounter = {
  id: string;
  summary: string | null;
  topics: string[] | null;
  date: string;
};

type Person = {
  id: string;
  name: string | null;
  occupation: string | null;
  encounters: Encounter[];
};

type FaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function RecognizePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const lastMatchIdRef = useRef<string | null>(null);
  const lockedRef = useRef(false);

  const [status, setStatus] = useState("Loading models...");
  const [matchedPerson, setMatchedPerson] = useState<Person | null>(null);
  const [isNewPerson, setIsNewPerson] = useState(false);
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("pf_token");
    if (!token) router.push("/login");
  }, []);

  useEffect(() => {
    let stopped = false;

    async function init() {
      const faceapi = await import("face-api.js");
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      if (stopped) return;
      setStatus("Starting camera...");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }

      streamRef.current = stream;
      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current!.play();
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }
        setStatus("Scanning...");
        setCameraActive(true);
        startLoop(faceapi);
      };
    }

    init().catch((err) => {
      console.error(err);
      setStatus("Camera permission denied.");
    });

    return () => {
      stopped = true;
      killCamera();
    };
  }, []);

  function startLoop(faceapi: any) {
    loopRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      try { await runDetection(faceapi); }
      catch (err) { console.error("[detection]", err); }
    }, 1000);
  }

  async function runDetection(faceapi: any) {
  const video = videoRef.current!;
  const canvas = canvasRef.current!;
 
  const detections = await faceapi
    .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
 
  if (detections.length === 0) {
    setFaceBox(null);
    setMatchedPerson(null);
    setIsNewPerson(false);
    lastMatchIdRef.current = null;
    lockedRef.current = false;
    setStatus("Scanning...");
    return;
  }
 
  const primary = detections[0];
  const { x, y, width, height } = primary.detection.box;
  const scaleX = canvas.offsetWidth / video.videoWidth;
  const scaleY = canvas.offsetHeight / video.videoHeight;
 
  setFaceBox({
    x: x * scaleX,
    y: y * scaleY,
    width: width * scaleX,
    height: height * scaleY,
  });
 
  // Already locked onto a result — skip the API call
  if (lockedRef.current) return;
 
  const embedding = Array.from(primary.descriptor) as number[];
 
  // Use matchFace from api.ts — handles auth header automatically
  const { match } = await matchFace(embedding);
  lockedRef.current = true;
 
  if (match) {
    if (match.id === lastMatchIdRef.current) return;
    lastMatchIdRef.current = match.id;
    setIsNewPerson(false);
    setStatus("Person recognized");
 
    // matchFace already returns encounters (partial) on the match object,
    // but we call getPersonById to get the full encounter history
    const person = await getPersonById(match.id);
    setMatchedPerson(person);
  } else {
    lastMatchIdRef.current = null;
    setMatchedPerson(null);
    setIsNewPerson(true);
    setStatus("New person — switch to Record tab to save");
  }
}

  function killCamera() {
    if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    lockedRef.current = false;
    setCameraActive(false);
    setFaceBox(null);
    setMatchedPerson(null);
    setIsNewPerson(false);
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden">
      <Navbar />

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 bg-zinc-950 z-10">
        <button onClick={() => { killCamera(); router.push("/camera/scan"); }} className="px-6 py-3 text-sm font-medium text-white border-b-2 border-white">
          Recognize
        </button>
        <button
          onClick={() => { killCamera(); router.push("/camera/record"); }}
          className="px-6 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer border-b-2 border-transparent"
        >
          Record
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden bg-zinc-950">
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-zinc-950">
            <p className="text-white/40 text-sm">{status}</p>
          </div>
        )}

        {cameraActive && (
          <>
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-3.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-white/70 text-xs">{status}</span>
            </div>

            <button
              onClick={() => { killCamera(); setStatus("Camera stopped."); }}
              className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium px-3.5 py-1.5 rounded-full backdrop-blur-md transition-colors cursor-pointer"
            >
              ⏹ Stop
            </button>

            {faceBox && (matchedPerson || isNewPerson) && (
              <FloatingTag faceBox={faceBox} person={matchedPerson} isNew={isNewPerson} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FloatingTag({ faceBox, person, isNew }: { faceBox: FaceBox; person: Person | null; isNew: boolean }) {
  const tagWidth = 200;
  const padding = 14;
  const containerWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
  const mirroredX = containerWidth - faceBox.x - faceBox.width;
  const placeRight = mirroredX < containerWidth / 2;
  const left = placeRight ? mirroredX + faceBox.width + padding : mirroredX - tagWidth - padding;
  const top = faceBox.y;

  return (
    <div className="absolute z-30 pointer-events-none transition-all duration-200" style={{ left, top, width: tagWidth }}>
      <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-2.5 shadow-lg">
        {person ? (
          <>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-green-400/90 text-[9px] font-medium uppercase tracking-wider">Recognized</span>
            </div>
            <h3 className="text-white/90 font-semibold text-xs mb-0.5">{person.name ?? "Unknown person"}</h3>
            <p className="text-white/40 text-[10px] mb-1.5">{person.occupation ?? "Occupation unknown"}</p>
            {person.encounters.length > 0 && (
              <>
                <div className="h-px bg-white/10 mb-1.5" />
                <p className="text-white/55 text-[10px] leading-snug">{person.encounters[0].summary ?? "No summary."}</p>
              </>
            )}
            {person.encounters.length === 0 && <p className="text-white/30 text-[10px]">No conversations yet.</p>}
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
              <span className="text-yellow-400/90 text-[9px] font-medium uppercase tracking-wider">New person</span>
            </div>
            <p className="text-white/45 text-[10px] leading-snug">Switch to Record tab to save.</p>
          </>
        )}
      </div>
    </div>
  );
}