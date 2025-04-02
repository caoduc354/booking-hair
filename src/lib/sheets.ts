import { google, sheets_v4 } from "googleapis";
import { JWT } from "google-auth-library";
import credentials from "./credentials.json" assert { type: "json" };

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SPREADSHEET_ID = "10Ay6PY1cmLK56V7KuZnBDn8vFXUOH7zNSynlEU9hxB0";

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
  "Tên Nhân Viên": string;
  Ranking: string;
}

export interface CheckExistPayload {
  date: string;
  time: string;
  barberName: string;
  ranking: string;
}

export interface BookingSlotPayload {
  date: string;
  barber: string;
}

export async function getDataNV(): Promise<Barber[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Employee!A1:C",
  });

  const rows = res.data.values || [];
  const headers = rows[0] as string[];
  const data = rows.slice(1);

  return data.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((key, i) => (obj[key] = row[i] || ""));
    return obj as any;
  });
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
      return formatted === date && row[3] === barber;
    })
    .map((row) => row[1]); // lấy Time

  return bookedSlots;
}
