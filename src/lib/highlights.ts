import type { Participant, RankingItem, RevealParticipant } from "@/lib/types";

export type HighlightType =
  | "unanime"
  | "escolha_unica"
  | "maior_consenso"
  | "maior_discordancia"
  | "dupla_parecida";

export interface Highlight {
  type: HighlightType;
  emoji: string;
  headline: string;
  detail: string;
  item?: RankingItem;
  participantNames?: string[];
}

interface ItemKeyEntry {
  item: RankingItem;
  entries: { participant: Participant; position: number }[];
}

function itemKey(item: RankingItem) {
  return `${item.provider}:${item.external_id}`;
}

function groupByItem(participants: RevealParticipant[]): Map<string, ItemKeyEntry> {
  const map = new Map<string, ItemKeyEntry>();
  for (const p of participants) {
    for (const item of p.items) {
      const key = itemKey(item);
      const existing = map.get(key);
      if (existing) {
        existing.entries.push({ participant: p.participant, position: item.position });
      } else {
        map.set(key, { item, entries: [{ participant: p.participant, position: item.position }] });
      }
    }
  }
  return map;
}

function pairSimilarity(
  a: RevealParticipant,
  b: RevealParticipant,
  topSize: number
): number {
  const bItems = new Map(b.items.map((i) => [itemKey(i), i.position]));
  const shared = a.items.filter((i) => bItems.has(itemKey(i)));
  if (shared.length === 0) return 0;

  const positionDenominator = Math.max(topSize - 1, 1);
  const positionScore =
    shared.reduce((sum, item) => {
      const posB = bItems.get(itemKey(item))!;
      const diff = Math.abs(item.position - posB);
      return sum + (1 - diff / positionDenominator);
    }, 0) / shared.length;

  const overlapScore = shared.length / topSize;
  return 0.5 * overlapScore + 0.5 * positionScore;
}

export function computeHighlights(
  participants: RevealParticipant[],
  topSize: number
): Highlight[] {
  const highlights: Highlight[] = [];
  const n = participants.length;
  if (n === 0) return highlights;

  const grouped = groupByItem(participants);

  // UNÂNIME — chosen by every participant.
  const unanimous = [...grouped.values()].filter((g) => g.entries.length === n && n >= 2);
  for (const g of unanimous) {
    highlights.push({
      type: "unanime",
      emoji: "🙌",
      headline: `${g.item.name} apareceu no Top de todos!`,
      detail: `Escolhido pelos ${n} participantes.`,
      item: g.item,
    });
  }

  // ESCOLHA ÚNICA — chosen by exactly one participant (capped so it doesn't flood the screen).
  if (n >= 2) {
    const uniques = [...grouped.values()].filter((g) => g.entries.length === 1);
    for (const g of uniques.slice(0, 6)) {
      const [{ participant, position }] = g.entries;
      highlights.push({
        type: "escolha_unica",
        emoji: "🎯",
        headline: `${participant.name} foi o único a escolher ${g.item.name}`,
        detail: `Colocou em #${position}.`,
        item: g.item,
        participantNames: [participant.name],
      });
    }
  }

  // MAIOR CONSENSO — most shared item, ties broken by closest average position.
  if (n >= 2) {
    const shared = [...grouped.values()].filter((g) => g.entries.length >= 2);
    shared.sort((a, b) => {
      if (b.entries.length !== a.entries.length) return b.entries.length - a.entries.length;
      const avgA = average(a.entries.map((e) => e.position));
      const avgB = average(b.entries.map((e) => e.position));
      return avgA - avgB;
    });
    const top = shared[0];
    if (top) {
      const avgPos = average(top.entries.map((e) => e.position));
      highlights.push({
        type: "maior_consenso",
        emoji: "🤝",
        headline: `${top.item.name} é o maior consenso do grupo`,
        detail: `Apareceu em ${top.entries.length}/${n} listas, posição média #${avgPos.toFixed(1)}.`,
        item: top.item,
      });
    }
  }

  // MAIOR DISCORDÂNCIA — shared item with the widest spread in position.
  if (n >= 2) {
    const shared = [...grouped.values()].filter((g) => g.entries.length >= 2);
    let best: { g: ItemKeyEntry; spread: number } | null = null;
    for (const g of shared) {
      const positions = g.entries.map((e) => e.position);
      const spread = Math.max(...positions) - Math.min(...positions);
      if (spread > 0 && (!best || spread > best.spread)) {
        best = { g, spread };
      }
    }
    if (best) {
      const detail = best.g.entries
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((e) => `${e.participant.name} #${e.position}`)
        .join(", ");
      highlights.push({
        type: "maior_discordancia",
        emoji: "⚡",
        headline: `${best.g.item.name} dividiu opiniões`,
        detail,
        item: best.g.item,
      });
    }
  }

  // DUPLA MAIS PARECIDA — pair of participants with the most similar rankings.
  if (n >= 2) {
    let bestPair: { a: RevealParticipant; b: RevealParticipant; score: number } | null = null;
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const score = pairSimilarity(participants[i], participants[j], topSize);
        if (score > 0 && (!bestPair || score > bestPair.score)) {
          bestPair = { a: participants[i], b: participants[j], score };
        }
      }
    }
    if (bestPair) {
      highlights.push({
        type: "dupla_parecida",
        emoji: "👯",
        headline: `${bestPair.a.participant.name} e ${bestPair.b.participant.name} tiveram os Tops mais parecidos`,
        detail: `${Math.round(bestPair.score * 100)}% de compatibilidade.`,
        participantNames: [bestPair.a.participant.name, bestPair.b.participant.name],
      });
    }
  }

  return highlights;
}

function average(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
