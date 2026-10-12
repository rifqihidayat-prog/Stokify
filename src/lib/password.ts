import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const PREFIX = "scrypt";
const KEY_LENGTH = 64;

export const MIN_PASSWORD_LENGTH = 8;

/** Format tersimpan: scrypt$<salt base64>$<hash base64> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `${PREFIX}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export function isPasswordHashed(stored: string): boolean {
  return stored.startsWith(`${PREFIX}$`);
}

/**
 * Cocokkan password dengan nilai tersimpan. Nilai lama yang masih plaintext
 * tetap diterima (lalu di-hash ulang saat login berhasil, lihat auth.ts).
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!isPasswordHashed(stored)) {
    const a = Buffer.from(password);
    const b = Buffer.from(stored);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  const [, saltB64, keyB64] = stored.split("$");
  if (!saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
