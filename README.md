# Tops

Crie um Top, convide seus amigos e descubra quem pensa como você. Rankings
simultâneos, em tempo real, com timer sincronizado — feito para grupos de
amigos, lives e vídeos.

## Como funciona

`CRIAR SALA → CONVIDAR → LOBBY → INICIAR → TIMER → PESQUISAR → MONTAR TOP → FINALIZAR → REVELAR → COMPARAR → DESTAQUES`

- O host cria uma sala com tema, categoria, quantidade de posições e tempo.
- Amigos entram pelo código/link e só informam um nome (sem conta).
- Quando o host inicia, todos recebem o **mesmo horário de início/fim**
  (calculado no servidor) e montam sua lista secretamente, em paralelo.
- Durante a rodada só é possível ver o progresso dos outros ("7/10"), nunca
  as escolhas.
- Quando o tempo acaba (ou todos finalizam antes), as listas são reveladas e
  o grupo vê uma comparação lado a lado + destaques automáticos (unânime,
  maior consenso, maior discordância, escolha única, dupla mais parecida).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres +
Realtime) + APIs externas por categoria (TMDB, Deezer, IGDB, Wikipédia,
Unsplash). Sem autenticação, sem catálogo próprio, sem microserviços —
propositalmente simples.

Cada integração externa é um "provider" isolado em `src/lib/providers/`,
todos atrás de um único contrato (`SearchResultItem`), então trocar ou
adicionar uma fonte de dados não mexe no resto do app.

## Arquitetura de dados/segurança (por quê)

- `rooms` e `participants` têm policies de **leitura pública** (via chave
  anon) porque são as únicas tabelas que o navegador lê diretamente, para
  alimentar o Realtime (status da sala, timer, nomes, contagem de
  progresso — nada sensível).
- `rankings` e `ranking_items` (as escolhas de cada um) têm RLS habilitado
  **sem nenhuma policy pública** — só a service role key (usada só nas API
  routes do servidor) acessa. Isso garante que ninguém consiga espiar o Top
  de outro participante antes da revelação, sem precisar de autenticação.
- O timer nunca confia no relógio do navegador: o servidor grava
  `starts_at`/`ends_at`; o cliente sincroniza um offset de relógio via
  `/api/time` e calcula o tempo restante a partir disso. Quando o tempo
  acaba, qualquer cliente pode chamar `/api/rooms/[code]/finalize`, que é
  idempotente e atômico (`UPDATE ... WHERE status='running' AND ends_at <= now()`).

## Instalação

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha as variáveis (veja as
seções abaixo).

```bash
npm run dev
```

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode o SQL de `supabase/schema.sql` no SQL Editor do projeto (cria as
   tabelas `rooms`, `participants`, `rankings`, `ranking_items`, as RLS
   policies e adiciona `rooms`/`participants` à publicação do Realtime).
3. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**nunca** exponha
     essa chave no cliente — ela só é usada dentro das API routes)

## Configuração das APIs externas

| Categoria | Provider | Variáveis | Observação |
|---|---|---|---|
| Filmes / Séries / Personagens | [TMDB](https://www.themoviedb.org/settings/api) | `TMDB_API_KEY` | "Personagens" busca por ator/atriz (`search/person`) — o TMDB não tem busca de personagem por nome. |
| Músicas / Artistas / Álbuns | [Deezer](https://developers.deezer.com/api) | _(nenhuma)_ | API pública, sem autenticação. Trocamos de Spotify para Deezer porque, desde fev/2026, o Modo de Desenvolvimento do Spotify passou a exigir conta Premium do desenvolvedor. |
| Jogos | [IGDB](https://api-docs.igdb.com/#getting-started) | `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` | Autenticação via app token do Twitch. |
| Comidas | [Wikipédia (pt)](https://pt.wikipedia.org) | _(nenhuma)_ | API pública, sem autenticação. Boa cobertura de pratos brasileiros (testamos: TheMealDB praticamente não tinha "coxinha", "pão de queijo" etc). |
| Tema livre (genérico) | [Unsplash](https://unsplash.com/developers) | `UNSPLASH_ACCESS_KEY` | Busca de fotos com `content_filter=high`; o nome do item é o texto pesquisado. |

Todas as chaves são usadas **só no servidor** (`src/app/api/search/route.ts`
→ `src/lib/providers/*`), nunca no navegador.

## Variáveis de ambiente

Veja `.env.example` para a lista completa e comentada.

## Segurança de conteúdo

- `src/lib/safety.ts` bloqueia termos claramente sexuais/adultos antes de
  qualquer busca chegar às APIs externas.
- TMDB é consultado com `include_adult=false`; Unsplash com
  `content_filter=high`.
- Não é possível colar URLs arbitrárias de imagem — todo item vem de uma
  busca validada num provider conhecido.
- Isso é uma primeira camada, propositalmente simples; dá pra evoluir para
  um serviço de moderação depois sem mudar o resto do app (troque só
  `isQuerySafe`).

## Estrutura

```
src/
  app/
    page.tsx                      Home
    criar/                        Criar sala
    entrar/                       Entrar em sala
    sala/[code]/lobby/            Lobby
    sala/[code]/montar/           Montagem do Top (busca + timer + drag-n-drop)
    sala/[code]/revelar/          Animação de revelação
    sala/[code]/comparar/         Comparação + destaques
    api/                          Rotas de servidor (rooms, rankings, search, time)
  components/                     UI compartilhada (Avatar, Timer, cards, etc.)
  lib/
    providers/                    Um arquivo por integração externa (TMDB, Deezer, IGDB, Wikipédia, Unsplash)
    highlights.ts                 Cálculo dos destaques (unânime, consenso, discordância, etc.)
    supabase/                     Clientes browser (anon) e server (service role)
    safety.ts                     Filtro de termos bloqueados
supabase/schema.sql                SQL completo (tabelas + RLS + realtime)
```

## Limitações conhecidas do MVP

- "Personagens de filmes" usa busca de atores do TMDB (não existe API
  gratuita de busca de personagens por nome).
- Sem autenticação: a identidade do participante é o `sessionId` salvo no
  `localStorage` do navegador — normal para uso casual entre amigos, mas
  não impede alguém de entrar duas vezes limpando o storage.
- Sem persistência de salas antigas para "assistir depois" — o produto é
  100% síncrono, como pedido.
