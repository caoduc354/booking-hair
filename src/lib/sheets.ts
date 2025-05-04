import fs from "fs";
import { JWT } from "google-auth-library";
import { google, sheets_v4 } from "googleapis";
import path from "path";
import credentials from "./credentials.json" assert { type: "json" };

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const jwtClient = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: SCOPES,
});

const sheets: sheets_v4.Sheets = google.sheets({
  version: "v4",
  auth: jwtClient,
});

export interface BookingPayload {
  date: string;
  time: string;
  rank: string;
  barber: string;
  name: string;
  phone: string;
}

export interface Barber {
  STT: string;
  Name: string;
  Ranking: string;
  Phone: string;
  Email: string;
  AvatarUrl: string; // ảnh mặt chính diện
}

export interface CheckExistPayload {
  date: string;
  time: string;
  barberName: string;
  ranking: string;
}

export interface BookingSlotPayload {
  date: string;
  barber: any;
}

export async function getDataNV(): Promise<Barber[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Employee!A2:M", // Lấy từ A đến G (STT đến Ảnh mặt chính diện)
  });
  const rows = res.data.values || [];

  const barbers = await Promise.all(
    rows
      .filter((row) => row[0]) // Chỉ lấy các dòng có STT (cột 0 không rỗng)
      .map(async (row, index) => {
        const name = row[1] || "";
        const avatarUrl = getAvatarUrlByName(name);
        return {
          STT: row[0] || "",
          Name: row[1] || "",
          Ranking: row[2] || "",
          Phone: row[3] || "",
          Email: row[4] || "",
          AvatarUrl: avatarUrl,
          ProductImage: [row[6] || "", row[7] || "", row[8] || ""],
          ActivityImage: row[9] || "", // Cột J: ảnh hoạt động 1
          ClientImage: row[10] || "", // Cột K: ảnh hoạt động 2
          BusinessHours: row[11] || "", // Cột L: giờ làm việc 1
        };
      })
  );

  return barbers;
}

function getAvatarUrlByName(name: string): string {
  const safeName = name.trim().replace(/\s+/g, "_");
  const basePath = path.join(process.cwd(), "public", "images", safeName);
  const jpgPath = path.join(basePath, "avatar.jpg");
  const pngPath = path.join(basePath, "avatar.png");

  if (fs.existsSync(jpgPath)) {
    return `/images/${safeName}/avatar.jpg`;
  } else if (fs.existsSync(pngPath)) {
    return `/images/${safeName}/avatar.png`;
  } else {
    return "/images/default-avatar.jpg"; // fallback nếu không có
  }
}

export async function appendBooking(data: BookingPayload) {
  const values = [
    [data.date, data.time, data.rank, data.barber, data.name, data.phone],
  ];

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Bookings!A1", // Assumes headers are in A1:F1
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return res.data;
}

export async function checkExistBooking(data: CheckExistPayload) {
  const { barberName, date, time, ranking } = data;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Bookings!A2:F", // bỏ dòng tiêu đề
  });
  const rows = res.data.values || [];
  const exists = rows.some(
    (row) =>
      row[0] === date && // Date
      row[1] === time && // Time
      row[2] === ranking && // Ranking
      row[3] === barberName // Barber
  );
  return exists;
}

export async function bookingSlot(data: BookingSlotPayload) {
  const { barber, date } = data;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Bookings!A2:F",
  });

  const rows = res.data.values || [];
  const bookedSlots = rows
    .filter((row) => {
      const formatted = new Date(row[0]).toLocaleDateString("en-CA");
      return formatted === date && row[3] === barber.name;
    })
    .map((row) => row[1]); // lấy Time

  console.log("bookedSlots", bookedSlots);

  return bookedSlots;
}
