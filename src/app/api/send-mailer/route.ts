import { NextResponse } from "next/server";
import { sendBookingEmail, SendMailerPayload } from "@/lib/send-mailer";

export async function POST(req: Request) {
  try {
    const body: SendMailerPayload = await req.json(); // ✅ lấy dữ liệu từ body
    const result = await sendBookingEmail(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
