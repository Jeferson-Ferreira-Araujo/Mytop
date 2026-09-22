"use client";

import { useState } from "react";
import Link from "next/link";
import { CollageCard } from "@/components/CollageCard";

const STEPS = [
  { emoji: "🎬", title: "Crie um Top", text: "Escolha o tema, quantas posições e o tempo da rodada." },
  { emoji: "🔗", title: "Convide a galera", text: "Compartilhe o código da sala e todos entram na hora." },
  { emoji: "⏱️", title: "Monte em tempo real", text: "Cada um busca e organiza seu ranking secretamente, contra o tempo." },
  { emoji: "🏆", title: "Revele e compare", text: "No final, todo mundo descobre quem pensa parecido — ótimo pra live." },
];

export default function Home() {
  const [showHow, setShowHow] = useState(false);

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto w-full max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 font-display font-extrabold text-lg">
            <span aria-hidden>👑</span> SameTop
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowHow(true)}
              className="hidden sm:block text-sm text-text-muted hover:text-text transition"
            >
              Como funciona
            </button>
            <Link href="/criar" className="btn-primary rounded-full px-5 py-2.5 text-sm whitespace-nowrap">
              Criar um Top
            </Link>
          </div>
        </div>
      </header>

      {showHow && <HowItWorksModal onClose={() => setShowHow(false)} />}

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up flex flex-col gap-6">
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight">
              Crie um <span className="gradient-text">Top</span>, convide seus{" "}
              <span className="gradient-text">amigos</span> e descubra quem pensa como você.
            </h1>
            <p className="text-text-muted text-lg max-w-md">
              Monte rankings juntos, em tempo real, compare no final e gere conversas incríveis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/criar" className="btn-primary rounded-2xl px-8 py-4 text-lg text-center">
                Criar um Top
              </Link>
              <Link href="/entrar" className="btn-secondary rounded-2xl px-8 py-4 text-lg text-center">
                Entrar em uma sala
              </Link>
            </div>

            {/* Mobile: simple grid instead of the absolute-positioned collage */}
            <div className="lg:hidden grid grid-cols-3 gap-3 mt-4">
              <MiniTopCard className="col-span-3" />
              <CollageCard
                emoji="🎬"
                from="#3b82f6"
                to="#1e3a8a"
                imageSrc="/collage/filme-mario.webp"
                imageAlt="Card de filme"
                className="aspect-square"
              />
              <CollageCard
                emoji="🍕"
                from="#ec4899"
                to="#831843"
                imageSrc="/collage/comida-pizza.jpg"
                imageAlt="Card de comida"
                className="aspect-square"
              />
              <CollageCard
                emoji="🎤"
                from="#22d3ee"
                to="#0e7490"
                imageSrc="/collage/musica-link_park.jpg"
                imageAlt="Card de música"
                className="aspect-square"
              />
            </div>
          </div>

          {/* Desktop: rotated overlapping collage, ready for real artwork later */}
          <div className="hidden lg:block relative h-[420px] animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <MiniTopCard
              className="absolute w-44"
              style={{ top: "4%", left: "2%", transform: "rotate(-7deg)" }}
            />
            <CollageCard
              emoji="🦹"
              from="#3b82f6"
              to="#1e3a8a"
              imageSrc="/collage/filme-mario.webp"
              imageAlt="Card de filme"
              className="absolute w-36 h-48"
              style={{ top: "8%", left: "42%", transform: "rotate(4deg)" }}
            />
            <CollageCard
              emoji="⚔️"
              from="#3a3a4a"
              to="#1a1a24"
              imageSrc="/collage/series-snow.jpg"
              imageAlt="Card de série"
              className="absolute w-36 h-48"
              style={{ top: "0%", right: "2%", transform: "rotate(6deg)" }}
            />
            <CollageCard
              emoji="🍕"
              from="#ec4899"
              to="#831843"
              imageSrc="/collage/comida-pizza.jpg"
              imageAlt="Card de comida"
              className="absolute w-32 h-32"
              style={{ top: "46%", left: "6%", transform: "rotate(-5deg)" }}
            />
            <CollageCard
              emoji="🎤"
              from="#22d3ee"
              to="#0e7490"
              imageSrc="/collage/musica-link_park.jpg"
              imageAlt="Card de música"
              className="absolute w-32 h-40"
              style={{ bottom: "2%", left: "30%", transform: "rotate(-4deg)" }}
            />
            <CollageCard
              emoji="🎮"
              from="#84cc16"
              to="#3b82f6"
              imageSrc="/collage/jogo-elder.jpg"
              imageAlt="Card de game"
              className="absolute w-32 h-32"
              style={{ bottom: "0%", right: "6%", transform: "rotate(5deg)" }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-fade-up"
      style={{ animationDuration: "0.2s" }}
      onClick={onClose}
    >
      <div
        className="glass-card bg-bg-card rounded-2xl p-6 w-full max-w-md animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-extrabold">Como funciona</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-text-muted hover:text-text text-xl leading-none px-1"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {STEPS.map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{step.emoji}</span>
              <div>
                <p className="font-display font-bold text-sm">{step.title}</p>
                <p className="text-sm text-text-muted">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose} className="btn-primary rounded-xl w-full py-3 mt-6 text-sm">
          Entendi
        </button>
      </div>
    </div>
  );
}

function MiniTopCard({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`glass-card rounded-2xl p-3 shadow-2xl bg-bg-card ${className}`}
      style={style}
    >
      <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1.5">Top 10</p>
      <p className="text-xs font-display font-bold mb-2 leading-snug">
        Melhores filmes de todos os tempos
      </p>
      <div className="flex flex-col gap-1">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-text-muted w-3">{n}</span>
            <span className="h-1.5 rounded-full bg-primary/40 flex-1" style={{ width: `${100 - n * 15}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
