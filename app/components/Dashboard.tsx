"use client";

import { useEffect, useState } from "react";
import { getPeople, Person } from "@/lib/api";
import { User, Clock, Briefcase, MessageSquare, ChevronRight, Loader2 } from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

/** Group people by the date of their most recent encounter (or creation date) */
function groupByDate(people: Person[]): Record<string, Person[]> {
  return people.reduce<Record<string, Person[]>>((acc, person) => {
    const anchor =
      person.encounters[0]?.date ?? person.createdAt;
    const label = formatDate(anchor);
    if (!acc[label]) acc[label] = [];
    acc[label].push(person);
    return acc;
  }, {});
}

// ─── PersonCard ──────────────────────────────────────────────────────────────

function PersonCard({ person }: { person: Person }) {
  const lastEncounter = person.encounters[0];

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-base font-semibold shrink-0 overflow-hidden">
        {person.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.photoUrl} alt={person.name ?? "Person"} className="w-full h-full object-cover" />
        ) : (
          <User size={18} className="text-zinc-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
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

        <div className="flex items-center gap-3 mt-0.5">
          {person.occupation && (
            <span className="text-zinc-500 text-xs flex items-center gap-1 truncate">
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
      </div>

      {/* Arrow */}
      <ChevronRight
        size={16}
        className="text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0"
      />
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPeople()
      .then(setPeople)
      .catch((err) => {
        setError(
          err?.response?.data?.error ?? err?.message ?? "Failed to load people"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-600">
        <Loader2 size={22} className="animate-spin mr-2" />
        <span className="text-sm">Loading your connections…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <User size={24} className="text-zinc-600" />
        </div>
        <p className="text-white font-medium text-sm">No connections yet</p>
        <p className="text-zinc-600 text-xs max-w-xs">
          Use the camera to recognize and add people you meet.
        </p>
      </div>
    );
  }

  const groups = groupByDate(people);

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(groups).map(([date, group]) => (
        <section key={date}>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            {date}
          </h2>
          <div className="flex flex-col gap-2">
            {/* {group.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))} */}
          </div>
        </section>
      ))}
    </div>
  );
}
