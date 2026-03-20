/**
 * bcrypt (Python bcrypt + bcryptjs) only accepts passwords whose UTF-8 encoding
 * is at most 72 bytes. Truncating a Buffer and calling .toString("utf8") can
 * produce a string that re-encodes to MORE than 72 bytes (replacement chars).
 * This trims to 72 bytes and strips incomplete UTF-8 tails so re-encoding stays ≤72.
 */
const MAX = 72;

export function passwordUtf8Bytes72(password: string): Buffer {
  const buf = Buffer.from(password, "utf8");
  if (buf.length <= MAX) return buf;
  let b = buf.subarray(0, MAX);
  // Drop trailing continuation bytes of an incomplete code point
  while (b.length > 0 && (b[b.length - 1]! & 0xc0) === 0x80) {
    b = b.subarray(0, b.length - 1);
  }
  return b;
}

/** String safe for bcryptjs (UTF-8 length ≤ 72 bytes). */
export function passwordForBcryptJs(password: string): string {
  return passwordUtf8Bytes72(password).toString("utf8");
}
