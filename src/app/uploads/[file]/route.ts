import { getCurrentUser } from "@/actions/auth";
import { readUploadedImage } from "@/lib/uploads";

// Foto lampiran hanya bisa dilihat user yang sudah login.
// (Path *.jpg/*.png dikecualikan dari middleware, jadi cek sesi dilakukan di sini.)
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { file } = await params;
  const image = await readUploadedImage(file);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
