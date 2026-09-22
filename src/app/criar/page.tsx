"use client";

import { useState } from "react";
import Link from "next/link";
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

function autoTheme(category: Category, topSize: number) {
  if (category === "general") return `Top ${topSize}`;
  return `Top ${topSize} ${CATEGORY_LABELS[category]}`;
}

const TOP_SIZE_OPTIONS = [3, 5, 10];
const DURATION_OPTIONS = [
  { seconds: 120, label: "2 min" },
  { seconds: 180, label: "3 min" },
  { seconds: 300, label: "5 min" },
  { seconds: 600, label: "10 min" },
];

export default function CriarSalaPage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("movie");
  const [topSize, setTopSize] = useState(10);
  const [durationSeconds, setDurationSeconds] = useState(180);
  const [theme, setTheme] = useState(() => autoTheme("movie", 10));
  const [themeTouched, setThemeTouched] = useState(false);
  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the theme in sync with category/top size until the user edits it
  // by hand — gives them a ready-to-tweak starting point instead of a
  // blank field.
  function handleCategoryChange(next: Category) {
    setCategory(next);
    if (!themeTouched) setTheme(autoTheme(next, topSize));
  }

  function handleTopSizeChange(next: number) {
    setTopSize(next);
    if (!themeTouched) setTheme(autoTheme(category, next));
  }

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
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition mb-6"
      >
        ← Voltar
      </Link>
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
              onChange={(e) => handleCategoryChange(e.target.value as Category)}
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

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2">2. Posições</label>
            <div className="flex gap-2 mb-2">
              {TOP_SIZE_OPTIONS.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => handleTopSizeChange(n)}
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
            <label className="flex items-center gap-2 text-xs text-text-muted">
              ou digite:
              <input
                type="number"
                min={3}
                max={20}
                value={topSize}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n)) handleTopSizeChange(Math.min(20, Math.max(3, n)));
                }}
                className="input-field w-16 rounded-lg px-2 py-1 text-text text-sm"
              />
            </label>
          </div>

          <div>
            <label className="block font-semibold mb-2">Tempo</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
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
            <label className="flex items-center gap-2 text-xs text-text-muted">
              ou digite (min):
              <input
                type="number"
                min={1}
                max={60}
                value={Math.round(durationSeconds / 60)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n)) setDurationSeconds(Math.min(60, Math.max(1, n)) * 60);
                }}
                className="input-field w-16 rounded-lg px-2 py-1 text-text text-sm"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-2">3. Dê um nome ao Top</label>
          <input
            className="input-field w-full rounded-xl px-4 py-3"
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value);
              setThemeTouched(true);
            }}
            maxLength={120}
            required
          />
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
