// Dijalankan sekali saat server Next.js start.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapDatabase } = await import("./db/bootstrap");
    await bootstrapDatabase();

    // Trigger initial sync and periodic background sync every 2 minutes
    const { syncProductsCore } = await import("./actions/sync");
    
    // Initial sync non-blocking
    syncProductsCore().catch((err) => {
      console.warn("[instrumentation] Initial Google Sheets sync warning:", err);
    });

    // Periodic sync every 2 minutes (120,000 ms)
    setInterval(() => {
      syncProductsCore().catch((err) => {
        console.warn("[instrumentation] Periodic Google Sheets sync warning:", err);
      });
    }, 120_000);
  }
}
