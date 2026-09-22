"use client";

export interface RoomSession {
  sessionId: string;
  participantId: string;
  name: string;
  isHost: boolean;
}

function key(roomCode: string) {
  return `tops_session_${roomCode.toUpperCase()}`;
}

export function saveRoomSession(roomCode: string, session: RoomSession) {
  try {
    localStorage.setItem(key(roomCode), JSON.stringify(session));
  } catch {
    // localStorage unavailable (private mode etc.) — session just won't persist.
  }
}

export function getRoomSession(roomCode: string): RoomSession | null {
  try {
    const raw = localStorage.getItem(key(roomCode));
    return raw ? (JSON.parse(raw) as RoomSession) : null;
  } catch {
    return null;
  }
}

export function clearRoomSession(roomCode: string) {
  try {
    localStorage.removeItem(key(roomCode));
  } catch {
    // ignore
  }
}
