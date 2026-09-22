"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom } from "@/lib/api-client";
import { saveRoomSession } from "@/lib/session";
import { CATEGORY_LABELS, type Category } from "@/lib/types";

const CATEGORY_GROUPS: { label: string; options: { value: Category; emoji: string }[] }[] = [
  {
    label: "Filmes & séries",
    options: [
      { value: "movie", emoji: "🎬" },
      { value: "tv", emoji: "📺" },
      { value: "movie_character", emoji: "🦸" },
    ],
  },
  {
    label: "Música",
    options: [
      { value: "music_track", emoji: "🎵" },
      { value: "music_artist", emoji: "🎤" },
      { value: "music_album", emoji: "💿" },
    ],
  },
  {
    label: "Outros",
    options: [
      { value: "game", emoji: "🎮" },
      { value: "food", emoji: "🍔" },
      { value: "general", emoji: "✨" },
    ],
  },
];

const CATEGORY_EMOJI: Record<Category, string> = Object.fromEntries(
  CATEGORY_GROUPS.flatMap((g) => g.options.map((o) => [o.value, o.emoji]))
) as Record<Category, string>;

const THEME_PLACEHOLDER: Record<Category, string> = {
  movie: 'Ex: "Top 10 filmes de terror"',
  tv: 'Ex: "Top 5 séries de anime"',
  movie_character: 'Ex: "Top 10 vilões do cinema"',
  music_track: 'Ex: "Top 10 músicas do Linkin Park"',
  music_artist: 'Ex: "Top 5 bandas de rock"',
  music_album: 'Ex: "Top 10 álbuns dos anos 2000"',
  game: 'Ex: "Top 5 jogos de PS2"',
  food: 'Ex: "Top 10 comidas brasileiras"',
  general: 'Ex: "Top 10 cidades para viajar"',
};

const TOP_SIZE_OPTIONS = [3, 5, 10];
const DURATION_OPTIONS = [
  { seconds: 120, label: "2 min" },
  { seconds: 180, label: "3 min" },
  { seconds: 300, label: "5 min" },
  { seconds: 600, label: "10 min" },
];

export default function CriarSalaPage() {
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [category, setCategory] = useState<Category>("movie");
  const [topSize, setTopSize] = useState(10);
  const [durationSeconds, setDurationSeconds] = useState(180);
  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { room, session } = await createRoom({
        theme,
        category,
        topSize,
        durationSeconds,
        hostName,
      });
      saveRoomSession(room.code, session);
      router.push(`/sala/${room.code}/lobby`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar sala");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl font-extrabold mb-2">
        Criar um <span className="gradient-text">Top</span>
      </h1>
      <p className="text-text-muted mb-8">Defina o tema e as regras da rodada.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div>
          <label className="block font-semibold mb-2">1. Escolha a categoria</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              {CATEGORY_EMOJI[category]}
            </span>
            <select
              className="input-field w-full rounded-xl pl-11 pr-10 py-3 appearance-none cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORY_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {CATEGORY_LABELS[opt.value]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
              ▾
            </span>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-2">2. Dê um nome ao Top</label>
          <input
            className="input-field w-full rounded-xl px-4 py-3"
            placeholder={THEME_PLACEHOLDER[category]}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2">Posições</label>
            <div className="flex gap-2">
              {TOP_SIZE_OPTIONS.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setTopSize(n)}
                  className={`flex-1 rounded-xl px-3 py-2.5 border transition font-semibold ${
                    topSize === n
                      ? "border-primary bg-primary/15 text-white"
                      : "border-border bg-bg-elevated text-text-muted hover:border-primary/60"
                  }`}
                >
                  Top {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Tempo</label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  type="button"
                  key={d.seconds}
                  onClick={() => setDurationSeconds(d.seconds)}
                  className={`rounded-xl px-3 py-2.5 border transition font-semibold ${
                    durationSeconds === d.seconds
                      ? "border-primary bg-primary/15 text-white"
                      : "border-border bg-bg-elevated text-text-muted hover:border-primary/60"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-2">Seu nome ou nick</label>
          <input
            className="input-field w-full rounded-xl px-4 py-3"
            placeholder="Como a galera vai te ver na sala"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            maxLength={40}
            required
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary rounded-2xl px-8 py-4 text-lg">
          {loading ? "Criando sala..." : "CRIAR SALA"}
        </button>
      </form>
    </main>
  );
}
