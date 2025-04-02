// src/app/api/barbers/route.ts
import { getDataNV } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const barbers = await getDataNV();
    return NextResponse.json(barbers);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch barbers", message: e.message },
      { status: 500 }
    );
  }
}
