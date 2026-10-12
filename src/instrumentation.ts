// Dijalankan sekali saat server Next.js start.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapDatabase } = await import("./db/bootstrap");
    await bootstrapDatabase();
  }
}
