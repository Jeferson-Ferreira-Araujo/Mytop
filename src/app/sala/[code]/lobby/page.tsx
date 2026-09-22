"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoom, startRoom } from "@/lib/api-client";
import { getRoomSession, type RoomSession } from "@/lib/session";
import { useRoomRealtime } from "@/lib/useRoomRealtime";
import { CATEGORY_LABELS, type Participant, type Room } from "@/lib/types";
import { Avatar } from "@/components/Avatar";

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const [session] = useState<RoomSession | null>(() => getRoomSession(code));
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getRoom(code);
      setRoom(data.room);
      setParticipants(data.participants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sala não encontrada");
    }
  }, [code]);

  useEffect(() => {
    if (!session) {
      router.replace(`/entrar?code=${code}`);
      return;
    }
    void (async () => {
      await refresh();
    })();
  }, [session, code, router, refresh]);

  useRoomRealtime(room?.id ?? null, {
    onRoomUpdate: (updated) => setRoom(updated),
    onParticipantChange: refresh,
  });

  // Realtime can miss an event (dropped websocket, tab backgrounded to
  // copy the invite link, flaky mobile network, ...). Poll as a fallback
  // and re-sync immediately whenever the tab regains focus.
  useEffect(() => {
    if (!room || room.status !== "lobby") return;
    const interval = setInterval(() => {
      void refresh();
    }, 4000);
    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [room, refresh]);

  useEffect(() => {
    if (room?.status === "running") {
      router.push(`/sala/${code}/montar`);
    }
  }, [room?.status, code, router]);

  if (!room && !error) {
    return <CenteredMessage>Carregando sala...</CenteredMessage>;
  }

  if (error) {
    return <CenteredMessage>{error}</CenteredMessage>;
  }

  if (!room || !session) return null;

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const { room: updated } = await startRoom(code, session!.sessionId);
      setRoom(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar");
      setStarting(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.origin + `/entrar?code=${code}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12 sm:py-16 flex flex-col gap-8">
      <div className="text-center animate-fade-up">
        <p className="text-text-muted mb-1">{CATEGORY_LABELS[room.category]} · Top {room.top_size}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold">{room.theme}</h1>
      </div>

      <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3 animate-fade-up">
        <p className="text-text-muted text-sm">Código da sala</p>
        <p className="font-display text-5xl font-extrabold tracking-[0.2em] gradient-text">{code}</p>
        <button onClick={handleCopy} className="btn-secondary rounded-xl px-4 py-2 text-sm mt-1">
          {copied ? "Link copiado!" : "Copiar link de convite"}
        </button>
      </div>

      <div className="animate-fade-up">
        <p className="font-semibold mb-3">Participantes ({participants.length})</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {participants.map((p) => (
            <div
              key={p.id}
              className="glass-card rounded-xl px-3 py-4 flex flex-col items-center gap-2 animate-pop-in"
            >
              <Avatar name={p.name} size={48} />
              <span className="font-medium text-sm text-center truncate w-full">
                {p.name}
                {p.session_id === session.sessionId ? " (você)" : ""}
              </span>
              {p.is_host && (
                <span className="text-[10px] font-semibold text-accent bg-accent/10 border border-accent/30 rounded-full px-2 py-0.5">
                  👑 HOST
                </span>
              )}
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-border px-3 py-4 flex flex-col items-center justify-center gap-1 text-text-muted text-xs">
            <span className="text-lg">+</span>
            Aguardando...
          </div>
        </div>
      </div>

      {error && <p className="text-danger text-sm text-center">{error}</p>}

      <div className="animate-fade-up">
        {session.isHost ? (
          <button
            onClick={handleStart}
            disabled={starting}
            className="btn-primary rounded-2xl px-8 py-4 text-lg w-full"
          >
            {starting ? "Iniciando..." : "INICIAR RODADA"}
          </button>
        ) : (
          <p className="text-center text-text-muted">Aguardando o host iniciar a rodada...</p>
        )}
      </div>
    </main>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <p className="text-text-muted">{children}</p>
    </main>
  );
}
