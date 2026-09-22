"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import {
  addRankingItem,
  finalizeRoom,
  finishRanking,
  getMyRanking,
  getRoom,
  removeRankingItem,
  reorderRankingItems,
  searchItems,
} from "@/lib/api-client";
import { getRoomSession, type RoomSession } from "@/lib/session";
import { useRoomRealtime } from "@/lib/useRoomRealtime";
import { useServerClockOffset, serverNow } from "@/lib/useServerClock";
import { CATEGORY_LABELS, type Participant, type RankingItem, type Room, type SearchResultItem } from "@/lib/types";
import { Timer } from "@/components/Timer";
import { ProgressList } from "@/components/ProgressList";
import { SearchResultCard } from "@/components/SearchResultCard";
import { SortableRankingItem } from "@/components/SortableRankingItem";

export default function MontarPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const offset = useServerClockOffset();

  const [session] = useState<RoomSession | null>(() => getRoomSession(code));
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myItems, setMyItems] = useState<RankingItem[]>([]);
  const [finished, setFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const finalizingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

  // Initial load ------------------------------------------------------
  useEffect(() => {
    if (!session) {
      router.replace(`/entrar?code=${code}`);
      return;
    }

    (async () => {
      try {
        const [roomData, mine] = await Promise.all([getRoom(code), getMyRanking(code, session.sessionId)]);
        if (roomData.room.status === "lobby") {
          router.replace(`/sala/${code}/lobby`);
          return;
        }
        if (roomData.room.status === "finished") {
          router.replace(`/sala/${code}/revelar`);
          return;
        }
        setRoom(roomData.room);
        setParticipants(roomData.participants);
        setMyItems(mine.items);
        setFinished(mine.participant.finished_at !== null);
        setLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar sala");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, code]);

  const refreshParticipants = useCallback(async () => {
    try {
      const data = await getRoom(code);
      setParticipants(data.participants);
      setRoom(data.room);
    } catch {
      // best-effort refresh
    }
  }, [code]);

  useRoomRealtime(room?.id ?? null, {
    onRoomUpdate: (updated) => setRoom(updated),
    onParticipantChange: refreshParticipants,
  });

  useEffect(() => {
    if (room?.status === "finished") {
      router.push(`/sala/${code}/revelar`);
    }
  }, [room?.status, code, router]);

  // Countdown -----------------------------------------------------------
  useEffect(() => {
    if (!room?.ends_at) return;
    const endsAtMs = new Date(room.ends_at).getTime();

    const tick = () => {
      const remaining = endsAtMs - serverNow(offset);
      setRemainingMs(remaining);
      if (remaining <= 0 && !finalizingRef.current) {
        finalizingRef.current = true;
        finalizeRoom(code)
          .then(({ room: updated }) => setRoom(updated))
          .catch(() => {
            finalizingRef.current = false;
          });
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [room?.ends_at, offset, code]);

  // Realtime can miss an event (dropped websocket, tab backgrounded,
  // flaky mobile network, ...). Poll as a fallback — e.g. so a client
  // still finds out the round ended even if it never got the broadcast
  // for another participant finishing everyone's list early — and
  // re-sync immediately whenever the tab regains focus.
  useEffect(() => {
    if (!room || room.status !== "running") return;
    const interval = setInterval(() => {
      void refreshParticipants();
    }, 5000);
    function onVisible() {
      if (document.visibilityState === "visible") void refreshParticipants();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [room, refreshParticipants]);

  const locked = finished || (remainingMs !== null && remainingMs <= 0);

  // Search ----------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const trimmed = query.trim();
    const category = room?.category;

    debounceRef.current = setTimeout(
      async () => {
        if (trimmed.length < 2 || !category) {
          setResults([]);
          setSearching(false);
          setSearchError(null);
          return;
        }

        setSearching(true);
        setSearchError(null);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const data = await searchItems(category, trimmed, controller.signal);
          setResults(data.results);
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            setSearchError(err instanceof Error ? err.message : "Erro na busca");
          }
        } finally {
          setSearching(false);
        }
      },
      trimmed.length < 2 ? 0 : 350
    );

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, room?.category]);

  async function handleAdd(result: SearchResultItem) {
    if (!session || !room || locked) return;
    if (myItems.length >= room.top_size) return;
    setError(null);
    try {
      const { item } = await addRankingItem(code, session.sessionId, result);
      setMyItems((prev) => [...prev, item]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar item");
    }
  }

  async function handleRemove(item: RankingItem) {
    if (!session || locked) return;
    setError(null);
    const prev = myItems;
    setMyItems((cur) => cur.filter((i) => i.id !== item.id));
    try {
      await removeRankingItem(code, session.sessionId, item.id);
    } catch (err) {
      setMyItems(prev);
      setError(err instanceof Error ? err.message : "Erro ao remover item");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (locked || !session) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMyItems((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const next = arrayMove(items, oldIndex, newIndex);
      reorderRankingItems(
        code,
        session.sessionId,
        next.map((i) => i.id)
      ).catch(() => refreshMine());
      return next;
    });
  }

  async function refreshMine() {
    if (!session) return;
    try {
      const mine = await getMyRanking(code, session.sessionId);
      setMyItems(mine.items);
    } catch {
      // ignore
    }
  }

  async function handleFinish() {
    if (!session || finished) return;
    setFinishing(true);
    setError(null);
    try {
      await finishRanking(code, session.sessionId);
      setFinished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao finalizar");
    } finally {
      setFinishing(false);
    }
  }

  if (!loaded || !room || !session) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <p className="text-text-muted">{error ?? "Carregando rodada..."}</p>
      </main>
    );
  }

  const existingKeys = new Set(myItems.map((i) => `${i.provider}:${i.external_id}`));

  return (
    <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 flex flex-col gap-5">
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="min-w-0">
          <p className="text-text-muted text-xs mb-0.5">{CATEGORY_LABELS[room.category]}</p>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold break-words">{room.theme}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {remainingMs !== null && (
            <Timer remainingMs={remainingMs} totalMs={room.duration_seconds * 1000} />
          )}
          <button
            onClick={handleFinish}
            disabled={finished || finishing}
            className="btn-primary rounded-xl px-5 py-3 text-sm whitespace-nowrap disabled:opacity-60"
          >
            {finished ? "Top finalizado ✓" : finishing ? "Enviando..." : "Finalizar meu Top"}
          </button>
        </div>
      </header>

      {error && <p className="text-danger text-sm">{error}</p>}

      {finished ? (
        <div className="glass-card rounded-2xl p-8 text-center animate-pop-in">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-display font-bold text-lg mb-1">Você terminou!</p>
          <p className="text-text-muted mb-6">Aguardando os outros participantes...</p>
          <div className="max-w-sm mx-auto text-left">
            <ProgressList participants={participants} topSize={room.top_size} currentSessionId={session.sessionId} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_0.8fr] gap-5">
          {/* Search column */}
          <section className="glass-card rounded-2xl p-4 flex flex-col gap-3 min-h-[320px]">
            <p className="font-semibold text-sm">Pesquisar</p>
            <input
              className="input-field rounded-xl px-4 py-2.5"
              placeholder="Digite para buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[420px] pr-1">
              {searching && <SkeletonRows />}
              {!searching && searchError && <p className="text-danger text-sm px-1">{searchError}</p>}
              {!searching && !searchError && results.length === 0 && query.trim().length >= 2 && (
                <p className="text-text-muted text-sm px-1">Nenhum resultado.</p>
              )}
              {!searching &&
                results.map((r) => (
                  <SearchResultCard
                    key={`${r.provider}:${r.external_id}`}
                    result={r}
                    disabled={myItems.length >= room.top_size}
                    alreadyAdded={existingKeys.has(`${r.provider}:${r.external_id}`)}
                    onAdd={() => handleAdd(r)}
                  />
                ))}
            </div>
          </section>

          {/* My ranking column */}
          <section className="glass-card rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Seu Top (arraste para reordenar)</p>
              <span className="text-sm text-text-muted tabular-nums">
                {myItems.length}/{room.top_size}
              </span>
            </div>
            {myItems.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-10">
                Pesquise ao lado e adicione seus itens favoritos.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={myItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2">
                    {myItems.map((item, idx) => (
                      <SortableRankingItem
                        key={item.id}
                        item={item}
                        position={idx + 1}
                        disabled={locked}
                        onRemove={() => handleRemove(item)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>

          {/* Progress column */}
          <section className="glass-card rounded-2xl p-4 flex flex-col gap-3">
            <p className="font-semibold text-sm">Progresso dos participantes</p>
            <ProgressList participants={participants} topSize={room.top_size} currentSessionId={session.sessionId} />
          </section>
        </div>
      )}
    </main>
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-1.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[60px] rounded-xl bg-bg-elevated animate-pulse" />
      ))}
    </div>
  );
}
