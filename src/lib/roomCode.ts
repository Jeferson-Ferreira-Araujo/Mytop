import { customAlphabet } from "nanoid";

// No ambiguous characters (0/O, 1/I/L) — easy to read aloud on a stream.
const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const generateRoomCode = customAlphabet(alphabet, 6);

export const generateSessionId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  24
);
