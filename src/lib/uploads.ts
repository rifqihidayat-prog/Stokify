import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
} as const;

type ImageExt = keyof typeof CONTENT_TYPES;

const STORED_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

export function getDataDir(): string {
  return path.resolve(process.env.DATA_DIR ?? "./data");
}

function getUploadDir(): string {
  return path.join(getDataDir(), "uploads");
}

/** Deteksi jenis gambar dari isi file (bukan dari nama / header client). */
function detectImageExt(bytes: Uint8Array): ImageExt | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "gif";
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "webp";
  return null;
}

export type SaveImageResult = { ok: true; url: string } | { ok: false; message: string };

export async function saveUploadedImage(file: File): Promise<SaveImageResult> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "Ukuran foto maksimal 8 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = detectImageExt(bytes);
  if (!ext) {
    return { ok: false, message: "Format foto harus JPG, PNG, WEBP, atau GIF." };
  }

  const name = `${randomUUID()}.${ext}`;
  await mkdir(getUploadDir(), { recursive: true });
  await writeFile(path.join(getUploadDir(), name), bytes);
  return { ok: true, url: `/uploads/${name}` };
}

export async function readUploadedImage(
  name: string
): Promise<{ data: Buffer; contentType: string } | null> {
  if (!STORED_NAME.test(name)) return null;
  const ext = name.split(".").pop() as ImageExt;
  try {
    const data = await readFile(path.join(getUploadDir(), name));
    return { data, contentType: CONTENT_TYPES[ext] };
  } catch {
    return null;
  }
}
