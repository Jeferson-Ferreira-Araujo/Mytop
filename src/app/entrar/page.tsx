"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinRoom } from "@/lib/api-client";
import { saveRoomSession } from "@/lib/session";

function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code")?.toUpperCase() ?? "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const normalizedCode = code.trim().toUpperCase();
      const { room, session } = await joinRoom(normalizedCode, name);
      saveRoomSession(room.code, session);
      router.push(`/sala/${room.code}/lobby`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar na sala");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-md px-6 py-16 sm:py-24">
      <h1 className="font-display text-3xl sm:text-4xl font-extrabold mb-2">
        Entrar em uma <span className="gradient-text">sala</span>
      </h1>
      <p className="text-text-muted mb-8">Peça o código para quem criou a sala.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block font-semibold mb-2">Código da sala</label>
          <input
            className="input-field w-full rounded-xl px-4 py-3 text-center text-2xl font-display font-bold tracking-[0.3em] uppercase"
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Seu nome ou nick</label>
          <input
            className="input-field w-full rounded-xl px-4 py-3"
            placeholder="Como a galera vai te ver na sala"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary rounded-2xl px-8 py-4 text-lg">
          {loading ? "Entrando..." : "ENTRAR"}
        </button>
      </form>
    </main>
  );
}

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  );
}
