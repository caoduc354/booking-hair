import { NextResponse } from "next/server";
import { checkExistBooking, CheckExistPayload } from "@/lib/sheets";

export async function POST(req: Request) {
  try {
    const body: CheckExistPayload = await req.json(); // ✅ lấy dữ liệu từ body
    const exists = await checkExistBooking(body);
    return NextResponse.json({ available: !exists });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
