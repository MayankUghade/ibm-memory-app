"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send, User } from "lucide-react";
import { getChatResponse, Encounter } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  people?: { id: string; name: string | null }[]; // unique people referenced, for assistant messages
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function extractUniquePeople(encounters: Encounter[]) {
    const map = new Map<string, { id: string; name: string | null }>();
    encounters.forEach((e: any) => {
      const person = e.person;
      if (person?.id && !map.has(person.id)) {
        map.set(person.id, { id: person.id, name: person.name });
      }
    });
    return Array.from(map.values());
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await getChatResponse(trimmed);
      const people = extractUniquePeople(res.encounters || []);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, people },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 h-[28rem] bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-950">
            <span className="font-medium text-sm text-white">Recall Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-zinc-950">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-500 text-center mt-8">
                Ask me things like "who did I meet today?"
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block px-3 py-2 rounded-xl text-sm max-w-[85%] whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-white text-black rounded-br-sm"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </span>

                {/* Person chips for assistant replies that reference people */}
                {m.role === "assistant" && m.people && m.people.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.people.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => router.push(`/camera/person/${p.id}`)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors"
                      >
                        <User size={12} />
                        {p.name ?? "Unknown"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <span className="inline-block px-3 py-2 rounded-xl text-sm bg-zinc-900 border border-zinc-800 text-zinc-500">
                  Thinking...
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 p-2 flex gap-2 bg-zinc-950">
            <input
              className="flex-1 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-white text-black rounded-lg px-3 py-2 disabled:opacity-40 hover:bg-zinc-200 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 text-white shadow-xl flex items-center justify-center hover:bg-zinc-800 transition-colors"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}