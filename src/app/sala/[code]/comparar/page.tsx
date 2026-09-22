"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getReveal } from "@/lib/api-client";
import { getRoomSession } from "@/lib/session";
import { Avatar } from "@/components/Avatar";
import { ItemImage } from "@/components/ItemImage";
import { HighlightCard } from "@/components/HighlightCard";
import type { Highlight } from "@/lib/highlights";
import { CATEGORY_LABELS, type RevealParticipant, type Room } from "@/lib/types";

export default function CompararPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RevealParticipant[] | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getRoomSession(code)) {
      router.replace(`/entrar?code=${code}`);
      return;
    }
    getReveal(code)
      .then((data) => {
        setRoom(data.room);
        setParticipants(data.participants);
        setHighlights(data.highlights);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar comparação"));
  }, [code, router]);

  const positions = useMemo(() => {
    if (!room) return [];
    return Array.from({ length: room.top_size }, (_, i) => i + 1);
  }, [room]);

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <p className="text-danger">{error}</p>
      </main>
    );
  }

  if (!room || !participants) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <p className="text-text-muted">Carregando comparação...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex flex-col gap-8">
      <header className="text-center animate-fade-up">
        <h1 className="font-display text-2xl sm:text-4xl font-extrabold flex items-center justify-center gap-2">
          <span aria-hidden>🎉</span>
          <span className="gradient-text">Tops revelados!</span>
        </h1>
        <p className="text-text-muted mt-1">Veja como cada um montou o próprio Top.</p>
        <p className="text-sm mt-2">
          <span className="font-semibold">{room.theme}</span>
          <span className="text-text-muted"> · {CATEGORY_LABELS[room.category]}</span>
        </p>
      </header>

      {/* Desktop grid — great for OBS capture */}
      <section className="hidden lg:block glass-card rounded-2xl p-5 overflow-x-auto animate-fade-up">
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="w-12 text-text-muted text-sm font-medium text-left">#</th>
              {participants.map((p) => (
                <th key={p.participant.id} className="px-2 min-w-[150px]">
                  <div className="flex flex-col items-center gap-1.5">
                    <Avatar name={p.participant.name} size={40} />
                    <span className="font-display font-bold text-sm">{p.participant.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr key={pos}>
                <td className="text-center font-display font-extrabold text-text-muted">{pos}</td>
                {participants.map((p) => {
                  const item = p.items.find((i) => i.position === pos);
                  return (
                    <td key={p.participant.id} className="px-2">
                      {item ? (
                        <div className="glass-card rounded-xl p-2 flex items-center gap-2">
                          <ItemImage
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <span className="text-sm font-medium truncate">{item.name}</span>
                        </div>
                      ) : (
                        <div className="rounded-xl p-2 text-center text-text-muted text-sm border border-dashed border-border">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Mobile: everyone's Top stacked together, no tab-switching needed */}
      <section className="lg:hidden flex flex-col gap-5 animate-fade-up">
        {participants.map((p, pi) => (
          <div
            key={p.participant.id}
            className="glass-card rounded-2xl p-4 animate-pop-in"
            style={{ animationDelay: `${Math.min(pi, 6) * 0.08}s` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={p.participant.name} size={40} ring />
              <div className="min-w-0">
                <p className="text-xs text-text-muted">Assim ficou o Top de</p>
                <p className="font-display font-bold text-lg truncate">{p.participant.name}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {positions.map((pos) => {
                const item = p.items.find((i) => i.position === pos);
                return (
                  <div key={pos} className="flex items-center gap-3 rounded-xl bg-bg-elevated/70 p-2">
                    <span className="w-7 text-center font-display font-bold text-sm text-text-muted shrink-0">
                      {pos}
                    </span>
                    {item ? (
                      <>
                        <ItemImage
                          src={item.image_url}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          {item.subtitle && (
                            <p className="text-xs text-text-muted truncate">{item.subtitle}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-text-muted text-sm">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Highlights */}
      {highlights.length > 0 && (
        <section className="animate-fade-up">
          <h2 className="font-display font-bold text-lg mb-3">Destaques da rodada</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {highlights.map((h, i) => (
              <HighlightCard key={i} highlight={h} />
            ))}
          </div>
        </section>
      )}

      <div className="flex justify-center">
        <Link href="/" className="btn-secondary rounded-xl px-6 py-3 text-sm">
          Criar um novo Top
        </Link>
      </div>
    </main>
  );
}
