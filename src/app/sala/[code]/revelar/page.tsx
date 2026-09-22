"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getReveal } from "@/lib/api-client";
import { getRoomSession } from "@/lib/session";
import { Avatar } from "@/components/Avatar";
import type { RevealParticipant } from "@/lib/types";

export default function RevelarPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [participants, setParticipants] = useState<RevealParticipant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getRoomSession(code)) {
      router.replace(`/entrar?code=${code}`);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function load() {
      try {
        const data = await getReveal(code);
        if (!cancelled) setParticipants(data.participants);
      } catch {
        attempts += 1;
        if (attempts < 10 && !cancelled) setTimeout(load, 500);
        else if (!cancelled) setError("Não foi possível revelar os Tops ainda.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  useEffect(() => {
    if (!participants) return;
    const timer = setTimeout(() => router.push(`/sala/${code}/comparar`), 2600);
    return () => clearTimeout(timer);
  }, [participants, code, router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center gap-8">
      {!participants ? (
        <p className="text-text-muted">{error ?? "Revelando os Tops..."}</p>
      ) : (
        <>
          <div className="animate-pop-in">
            <p className="text-5xl mb-4">🎉</p>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold gradient-text">
              Tops revelados!
            </h1>
            <p className="text-text-muted mt-2">Preparando a comparação...</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
            {participants.map((p, i) => (
              <div
                key={p.participant.id}
                className="flex flex-col items-center gap-2 animate-pop-in"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <Avatar name={p.participant.name} size={56} ring />
                <span className="text-sm font-medium">{p.participant.name}</span>
                <span className="text-xs text-text-muted">{p.items.length} itens</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push(`/sala/${code}/comparar`)}
            className="btn-secondary rounded-xl px-6 py-3 text-sm"
          >
            Ver comparação agora →
          </button>
        </>
      )}
    </main>
  );
}
