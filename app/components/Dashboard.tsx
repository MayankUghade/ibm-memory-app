"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPeople, deletePerson, PersonPreview } from "@/lib/api";
import {
  User,
  Clock,
  Briefcase,
  MessageSquare,
  ChevronRight,
  Loader2,
  Camera,
  Trash2,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRelativeBucket(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This Week";
  return "Earlier";
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

// Group people by relative time bucket, sorted by most recent encounter
const BUCKET_ORDER = ["Today", "Yesterday", "This Week", "Earlier"];

function groupByRelativeTime(people: PersonPreview[]): [string, PersonPreview[]][] {
  // Sort people by most recent encounter descending
  const sorted = [...people].sort((a, b) => {
    const aTime = new Date(a.encounters[0]?.date ?? a.createdAt).getTime();
    const bTime = new Date(b.encounters[0]?.date ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  const map = new Map<string, PersonPreview[]>();
  for (const person of sorted) {
    const anchor = person.encounters[0]?.date ?? person.createdAt;
    const bucket = getRelativeBucket(anchor);
    if (!map.has(bucket)) map.set(bucket, []);
    map.get(bucket)!.push(person);
  }

  return BUCKET_ORDER.filter((b) => map.has(b)).map((b) => [b, map.get(b)!]);
}

// ─── Person Card ──────────────────────────────────────────────────────────────

function PersonCard({
  person,
  onDelete,
}: {
  person: PersonPreview;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const lastEncounter = person.encounters[0] ?? null;
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      await deletePerson(person.id);
      onDelete(person.id);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div
      onClick={() => !confirming && router.push(`/camera/person/${person.id}`)}
      className="group flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer"
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
        {person.name ? (
          <span className="text-white text-sm font-semibold">
            {person.name[0].toUpperCase()}
          </span>
        ) : (
          <User size={18} className="text-zinc-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name + relative time */}
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm truncate">
            {person.name ?? "Unknown person"}
          </span>
          {lastEncounter && (
            <span className="text-zinc-600 text-xs shrink-0 flex items-center gap-1">
              <Clock size={11} />
              {formatRelativeTime(lastEncounter.date)}
            </span>
          )}
        </div>

        {/* Occupation + last summary */}
        <div className="flex items-center gap-3 mt-0.5">
          {person.occupation && (
            <span className="text-zinc-500 text-xs flex items-center gap-1 truncate max-w-[140px]">
              <Briefcase size={11} className="shrink-0" />
              {person.occupation}
            </span>
          )}
          {lastEncounter?.summary && (
            <span className="text-zinc-600 text-xs flex items-center gap-1 truncate">
              <MessageSquare size={11} className="shrink-0" />
              {lastEncounter.summary}
            </span>
          )}
        </div>

        {/* Topics */}
        {lastEncounter?.topics && lastEncounter.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {lastEncounter.topics.slice(0, 3).map((t, i) => (
              <span
                key={i}
                className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete / Confirm */}
      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        {confirming && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[11px] font-semibold text-red-400 border border-red-500/40 bg-red-500/10 px-2 py-1 rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Confirm"}
          </button>
        )}
        <button
          onClick={handleDelete}
          onBlur={() => setTimeout(() => setConfirming(false), 150)}
          className={`p-1.5 rounded-lg transition-colors ${
            confirming
              ? "text-red-400 bg-red-500/10"
              : "text-zinc-700 hover:text-red-400 hover:bg-red-500/10"
          }`}
          title={confirming ? "Click again to confirm" : "Delete person"}
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      <ChevronRight
        size={16}
        className="text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0"
      />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [people, setPeople] = useState<PersonPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleDelete(id: string) {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }

  useEffect(() => {
    getPeople()
      .then(setPeople)
      .catch((err) => {
        setError(err?.response?.data?.error ?? err?.message ?? "Failed to load");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-600">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">Loading your connections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <User size={22} className="text-zinc-600" />
        </div>
        <div>
          <p className="text-white font-medium text-sm">No connections yet</p>
          <p className="text-zinc-600 text-xs mt-1 max-w-xs">
            Use the camera to record people you meet.
          </p>
        </div>
        <button
          onClick={() => router.push("/camera/record")}
          className="flex items-center gap-2 bg-white text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer mt-1"
        >
          <Camera size={14} />
          Record someone
        </button>
      </div>
    );
  }

  const groups = groupByRelativeTime(people);

  return (
    <div className="flex flex-col gap-8">
      {groups.map(([date, group]) => (
        <section key={date}>
          {/* Date header */}
          <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            {date}
          </h2>

          <div className="flex flex-col gap-2">
            {group.map((person) => (
              <PersonCard key={person.id} person={person} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}