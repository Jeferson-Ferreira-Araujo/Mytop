import Link from "next/link";
import { CollageCard } from "@/components/CollageCard";
import { Avatar } from "@/components/Avatar";

const CATEGORY_ROW = [
  { emoji: "🎬", label: "Filmes e Séries" },
  { emoji: "🎵", label: "Música" },
  { emoji: "🎮", label: "Games" },
  { emoji: "🍔", label: "Comida" },
  { emoji: "🏆", label: "Esportes" },
  { emoji: "✨", label: "e muito mais" },
];

const NAV_LINKS = [{ href: "#categorias", label: "Categorias" }];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto w-full max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 font-display font-extrabold text-lg">
            <span aria-hidden>👑</span> SameTop
          </span>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-text-muted">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-text transition">
                {link.label}
              </a>
            ))}
          </nav>
          <Link href="/criar" className="btn-primary rounded-full px-5 py-2.5 text-sm whitespace-nowrap">
            Criar um Top
          </Link>
        </div>
      </header>

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

            <div className="flex items-center gap-3 mt-1">
              <div className="flex -space-x-3">
                {["Jeferson", "Ana", "Lucas"].map((name) => (
                  <div key={name} className="ring-2 ring-bg rounded-full">
                    <Avatar name={name} size={32} />
                  </div>
                ))}
              </div>
              <p className="text-sm text-text-muted">
                Feito para amigos, comunidades e criadores de conteúdo.
              </p>
            </div>

            {/* Mobile: simple grid instead of the absolute-positioned collage */}
            <div className="lg:hidden grid grid-cols-3 gap-3 mt-4">
              <MiniTopCard className="col-span-3" />
              <CollageCard emoji="🎬" from="#3b82f6" to="#1e3a8a" className="aspect-square" />
              <CollageCard emoji="🍕" from="#ec4899" to="#831843" className="aspect-square" />
              <CollageCard emoji="🎤" from="#22d3ee" to="#0e7490" className="aspect-square" />
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
              imageAlt="Card de filme/personagem"
              className="absolute w-36 h-48"
              style={{ top: "8%", left: "42%", transform: "rotate(4deg)" }}
            />
            <CollageCard
              emoji="⚔️"
              from="#3a3a4a"
              to="#1a1a24"
              imageAlt="Card de série"
              className="absolute w-36 h-48"
              style={{ top: "0%", right: "2%", transform: "rotate(6deg)" }}
            />
            <CollageCard
              emoji="🍕"
              from="#ec4899"
              to="#831843"
              imageAlt="Card de comida"
              className="absolute w-32 h-32"
              style={{ top: "46%", left: "6%", transform: "rotate(-5deg)" }}
            />
            <CollageCard
              emoji="🎤"
              from="#22d3ee"
              to="#0e7490"
              imageAlt="Card de música"
              className="absolute w-32 h-40"
              style={{ bottom: "2%", left: "30%", transform: "rotate(-4deg)" }}
            />
            <CollageCard
              emoji="🎮"
              from="#84cc16"
              to="#3b82f6"
              imageAlt="Card de game"
              className="absolute w-32 h-32"
              style={{ bottom: "0%", right: "6%", transform: "rotate(5deg)" }}
            />
          </div>
        </section>

        <section id="categorias" className="mx-auto w-full max-w-5xl px-6 py-10 pb-16 animate-fade-up">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
            {CATEGORY_ROW.map((c) => (
              <div key={c.label} className="flex flex-col items-center gap-2 text-center">
                <span className="w-14 h-14 rounded-full glass-card flex items-center justify-center text-2xl">
                  {c.emoji}
                </span>
                <span className="text-xs text-text-muted">{c.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
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
