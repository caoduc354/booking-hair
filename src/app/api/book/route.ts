import { appendBooking, BookingPayload } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body: BookingPayload = await req.json(); // ✅ lấy dữ liệu từ body
    const result = await appendBooking(body);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
