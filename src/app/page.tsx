import Link from "next/link";

const STEPS = [
  { emoji: "🎬", title: "Crie um Top", text: "Escolha o tema, quantas posições e o tempo da rodada." },
  { emoji: "🔗", title: "Convide a galera", text: "Compartilhe o código da sala e todos entram na hora." },
  { emoji: "⏱️", title: "Monte em tempo real", text: "Cada um busca e organiza seu ranking secretamente, contra o tempo." },
  { emoji: "🏆", title: "Revele e compare", text: "No final, todo mundo descobre quem pensa parecido — ótimo pra live." },
];

const CATEGORIES = [
  "🎬 Filmes", "📺 Séries", "🦸 Personagens", "🎵 Músicas", "🎤 Bandas", "💿 Álbuns", "🎮 Jogos", "🍔 Comidas",
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-16 sm:py-24 flex flex-col items-center text-center gap-8">
        <div className="animate-fade-up flex flex-col items-center gap-6">
          <span className="text-sm font-semibold tracking-wide uppercase text-accent bg-accent/10 border border-accent/30 rounded-full px-4 py-1">
            Feito para grupos, lives e vídeos
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-tight max-w-3xl">
            Crie um <span className="gradient-text">Top</span>, convide seus amigos e descubra quem pensa como você.
          </h1>
          <p className="text-text-muted text-lg max-w-xl">
            Rankings simultâneos, em tempo real, com timer sincronizado. Monte seu Top 10 secretamente e
            revele tudo junto com a galera.
          </p>
        </div>

        <div className="animate-fade-up flex flex-col sm:flex-row gap-4 w-full sm:w-auto" style={{ animationDelay: "0.1s" }}>
          <Link
            href="/criar"
            className="btn-primary rounded-2xl px-8 py-4 text-lg text-center"
          >
            CRIAR UM TOP
          </Link>
          <Link
            href="/entrar"
            className="btn-secondary rounded-2xl px-8 py-4 text-lg text-center"
          >
            ENTRAR EM UMA SALA
          </Link>
        </div>

        <div className="animate-fade-up flex flex-wrap justify-center gap-2 max-w-2xl mt-2" style={{ animationDelay: "0.2s" }}>
          {CATEGORIES.map((c) => (
            <span key={c} className="glass-card rounded-full px-4 py-1.5 text-sm text-text-muted">
              {c}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 w-full">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="glass-card rounded-2xl p-6 flex flex-col items-center gap-2 animate-fade-up"
              style={{ animationDelay: `${0.15 * i}s` }}
            >
              <span className="text-3xl">{step.emoji}</span>
              <h3 className="font-display font-bold">{step.title}</h3>
              <p className="text-sm text-text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-text-muted py-6">
        Tops — rankings em tempo real para grupos de amigos.
      </footer>
    </div>
  );
}
