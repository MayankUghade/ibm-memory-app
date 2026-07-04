"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPersonById, Person } from "@/lib/api";
import {
  ArrowLeft, User, Briefcase, Calendar,
  Clock, FileText, Tag, Loader2, MessageSquare, ChevronDown,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (mins > 0) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  return "Just now";
}

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPersonById(id)
      .then(setPerson)
      .catch((err) => setError(err?.response?.data?.error ?? err?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={24} className="text-[#52525b] animate-spin" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-[#f87171] text-[14px]">{error ?? "Person not found"}</p>
        <button onClick={() => router.back()} className="text-[#71717a] text-[13px] cursor-pointer bg-transparent border-none">← Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
        <Navbar />
      <div className="max-w-[860px] mx-auto mt-3">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#71717a] text-[14px] bg-transparent border-none cursor-pointer mb-10"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* ── Profile header ── */}
        <div className="flex flex-row items-center gap-7 mb-10">
          {/* Avatar circle */}
          <div className="w-24 h-24 rounded-full bg-[#27272a] flex items-center justify-center shrink-0">
            {person.name
              ? <span className="text-white text-[38px] font-bold">{person.name[0].toUpperCase()}</span>
              : <User size={36} color="#71717a" />
            }
          </div>

          {/* Name + info */}
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[28px] font-bold text-white leading-[1.2]">
              {person.name ?? "Unknown person"}
            </h1>
            {person.occupation && (
              <div className="flex items-center gap-2">
                <Briefcase size={15} color="#71717a" />
                <span className="text-[#a1a1aa] text-[15px]">{person.occupation}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={15} color="#71717a" />
              <span className="text-[#71717a] text-[15px]">First met {formatRelativeTime(person.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* ── Stats — 2 columns ── */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {/* Conversations */}
          <div className="bg-[#18181b] rounded-2xl p-6 flex flex-row items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-[#27272a] flex items-center justify-center shrink-0">
              <MessageSquare size={22} color="#71717a" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#71717a] text-[13px]">Conversations</span>
              <span className="text-white text-[32px] font-bold leading-none">{person.encounters.length}</span>
              <span className="text-[#52525b] text-[13px]">Total conversations</span>
            </div>
          </div>

          {/* Last seen */}
          <div className="bg-[#18181b] rounded-2xl p-6 flex flex-row items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-[#27272a] flex items-center justify-center shrink-0">
              <Clock size={22} color="#71717a" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#71717a] text-[13px]">Last seen</span>
              <span className="text-white text-[26px] font-bold leading-none">
                {person.encounters[0] ? formatRelativeTime(person.encounters[0].date) : "Never"}
              </span>
              <span className="text-[#52525b] text-[13px]">Last time they were seen</span>
            </div>
          </div>
        </div>

        {/* ── Conversations label ── */}
        <p className="m-0 mb-5 text-[11px] font-semibold text-[#52525b] uppercase tracking-[0.1em]">
          Conversations
        </p>

        {/* ── Empty ── */}
        {person.encounters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-[#27272a] rounded-2xl">
            <MessageSquare size={24} color="#3f3f46" />
            <p className="text-[#52525b] text-[14px] m-0">No conversations recorded yet.</p>
          </div>
        )}

        {/* ── Encounter cards ── */}
        <div className="flex flex-col gap-3">
          {person.encounters.map((enc, index) => (
            <EncounterCard key={enc.id} enc={enc} number={person.encounters.length - index} />
          ))}
        </div>

      </div>
    </div>
  );
}

function EncounterCard({ enc, number }: { enc: Person["encounters"][0]; number: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-[#18181b] rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex flex-row items-center gap-[14px] py-[18px] px-6">
        <div className="w-8 h-8 rounded-lg bg-[#27272a] flex items-center justify-center text-[13px] font-semibold text-[#a1a1aa] shrink-0">
          {number}
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Calendar size={15} color="#71717a" />
          <span className="text-white text-[15px] font-medium">{formatDate(enc.date)}</span>
        </div>
        <div className="flex items-center gap-[6px] text-[#71717a] text-[13px] shrink-0">
          <Clock size={14} />
          <span>{formatTime(enc.date)}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-[#27272a]" />

      {/* Body */}
      <div className="py-5 px-6 flex flex-col gap-5">

        {/* Summary */}
        {enc.summary && (
          <div>
            <div className="flex items-center gap-2 mb-[10px]">
              <MessageSquare size={14} color="#71717a" />
              <span className="text-[#71717a] text-[11px] font-semibold uppercase tracking-[0.1em]">Summary</span>
            </div>
            <p className="m-0 text-[#d4d4d8] text-[15px] leading-[1.7]">{enc.summary}</p>
          </div>
        )}

        {/* Topics */}
        {enc.topics && enc.topics.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} color="#71717a" />
              <span className="text-[#71717a] text-[11px] font-semibold uppercase tracking-[0.1em]">Topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {enc.topics.map((t, i) => (
                <span key={i} className="text-[13px] bg-[#27272a] text-[#d4d4d8] py-[6px] px-[14px] rounded-lg">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Transcript toggle */}
        {enc.transcript && (
          <>
            <div className="h-[1px] bg-[#27272a] mx-[-24px]" />
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-[10px] text-[#71717a] text-[14px] bg-transparent border-none cursor-pointer p-0 w-full"
            >
              <FileText size={16} />
              <span>View full transcript</span>
              <ChevronDown size={16} className={`ml-auto transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`} />
            </button>

            {open && (
              <div className="border-t border-[#27272a] mt-[-8px] pt-4">
                <p className="m-0 text-[#71717a] text-[13px] leading-[1.8] whitespace-pre-wrap">
                  {enc.transcript}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}