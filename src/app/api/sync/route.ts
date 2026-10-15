import { NextResponse } from "next/server";
import { syncProductsCore } from "@/actions/sync";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await syncProductsCore();
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        ...result,
      },
      { status: result.ok ? 200 : 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Internal server error during sync",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
