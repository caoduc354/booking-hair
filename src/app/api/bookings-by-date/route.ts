import { BookingSlotPayload, bookingSlot } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body: BookingSlotPayload = await req.json(); // ✅ lấy dữ liệu từ body
    const result = await bookingSlot(body);
    return NextResponse.json({ result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
