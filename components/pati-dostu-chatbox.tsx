"use client";

import { useMemo, useState } from "react";
import { MessageCircleHeart, PawPrint, SendHorizonal, Sparkles, X } from "lucide-react";

const tips = [
  "Su kabini her gun tazelemek, idrar yolu sagligini destekler.",
  "Ani istah degisimi gorursen not alip veterinerinle paylas.",
  "Yuruyus sonrasi patilerini kontrol et ve nazikce temizle.",
  "Asi ve ic-dis parazit takibini takvimden gecirme.",
];

export function PatiDostuChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [tipIndex, setTipIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([
    "Merhaba! Ben Pati Dostu. Bugun minik dostun icin hangi konuda tavsiye istersin?",
  ]);

  const quickTip = useMemo(() => tips[tipIndex], [tipIndex]);

  const onSend = async () => {
    const prompt = message.trim();
    if (!prompt || isLoading) {
      return;
    }

    setHistory((prev) => [...prev, `Sen: ${prompt}`]);
    setMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? "Yanıt alınamadı.");
      }

      setHistory((prev) => [...prev, `Pati Dostu: ${data.reply}`]);
      setTipIndex((prev) => (prev + 1) % tips.length);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Su an yanit veremiyorum, lutfen tekrar dener misin?";
      setHistory((prev) => [...prev, `Pati Dostu: ${msg}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-4 z-50 inline-flex items-center gap-3 rounded-full bg-teal-600 px-5 py-3 text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-700"
          aria-label="Pati Dostu sohbeti aç"
        >
          <PawPrint size={18} />
          <span className="leading-tight text-left">
            <span className="block text-base font-bold">Pati Dostu</span>
            <span className="block text-sm font-semibold">AI Botu</span>
          </span>
        </button>
      ) : null}

      {isOpen ? (
        <section className="fixed right-4 bottom-4 z-50 w-[92vw] max-w-sm rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
          <header className="flex items-center justify-between rounded-t-2xl border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-pink-100 p-2 text-pink-600">
                <PawPrint size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Pati Dostu</p>
                <p className="text-xs text-slate-500">AI tavsiye asistani</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircleHeart size={18} className="text-slate-400" />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Sohbeti kapat"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="max-h-52 space-y-2 overflow-y-auto px-4 py-3">
            {history.slice(-4).map((line, idx) => (
              <p key={`${line}-${idx}`} className="text-xs leading-5 text-slate-700">
                {line}
              </p>
            ))}
          </div>

          <div className="border-t border-slate-200 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700">
              <Sparkles size={14} />
              <span>{quickTip}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onSend();
                  }
                }}
                placeholder="Soru yaz..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring"
              />
              <button
                type="button"
                onClick={() => void onSend()}
                disabled={isLoading}
                className="rounded-lg bg-sky-600 p-2 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Mesaj gonder"
              >
                <SendHorizonal size={16} />
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
