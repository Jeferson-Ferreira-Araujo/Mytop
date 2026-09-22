"use client";

import type { Category, Participant, RankingItem, Room, SearchResultItem } from "@/lib/types";
import type { Highlight } from "@/lib/highlights";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Erro ${res.status}`);
  }
  return data as T;
}

export interface SessionInfo {
  sessionId: string;
  participantId: string;
  name: string;
  isHost: boolean;
}

export function createRoom(input: {
  theme: string;
  category: Category;
  topSize: number;
  durationSeconds: number;
  hostName: string;
}) {
  return request<{ room: Room; session: SessionInfo }>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function joinRoom(code: string, name: string) {
  return request<{ room: Room; session: SessionInfo }>(`/api/rooms/${code}/join`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getRoom(code: string) {
  return request<{ room: Room; participants: Participant[] }>(`/api/rooms/${code}`);
}

export function startRoom(code: string, sessionId: string) {
  return request<{ room: Room }>(`/api/rooms/${code}/start`, {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

export function finalizeRoom(code: string) {
  return request<{ room: Room }>(`/api/rooms/${code}/finalize`, { method: "POST" });
}

export function getReveal(code: string) {
  return request<{
    room: Room;
    participants: { participant: Participant; items: RankingItem[] }[];
    highlights: Highlight[];
  }>(`/api/rooms/${code}/reveal`);
}

export function searchItems(category: Category, query: string, signal?: AbortSignal) {
  return request<{ results: SearchResultItem[] }>(
    `/api/search?category=${encodeURIComponent(category)}&q=${encodeURIComponent(query)}`,
    { signal }
  );
}

export function addRankingItem(roomCode: string, sessionId: string, item: SearchResultItem) {
  return request<{ item: RankingItem; progressCount: number }>("/api/rankings/items", {
    method: "POST",
    body: JSON.stringify({ roomCode, sessionId, item }),
  });
}

export function removeRankingItem(roomCode: string, sessionId: string, itemId: string) {
  return request<{ progressCount: number }>(`/api/rankings/items/${itemId}`, {
    method: "DELETE",
    body: JSON.stringify({ roomCode, sessionId }),
  });
}

export function reorderRankingItems(
  roomCode: string,
  sessionId: string,
  orderedItemIds: string[]
) {
  return request<{ ok: true }>("/api/rankings/reorder", {
    method: "POST",
    body: JSON.stringify({ roomCode, sessionId, orderedItemIds }),
  });
}

export function finishRanking(roomCode: string, sessionId: string) {
  return request<{ ok: true; allFinished: boolean }>("/api/rankings/finish", {
    method: "POST",
    body: JSON.stringify({ roomCode, sessionId }),
  });
}

export function getMyRanking(roomCode: string, sessionId: string) {
  return request<{ items: RankingItem[]; participant: Participant }>(
    `/api/rankings/mine?roomCode=${encodeURIComponent(roomCode)}&sessionId=${encodeURIComponent(sessionId)}`
  );
}
