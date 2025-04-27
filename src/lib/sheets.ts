import { google, sheets_v4 } from "googleapis";
import { JWT } from "google-auth-library";
import { downloadImage } from "@/lib/download";
import credentials from "./credentials.json" assert { type: "json" };
import axios from "axios";
import { load } from "cheerio";

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

const convertToDriveImageUrl = (googleDriveUrl: string) => {
  // Tìm kiếm phần ID trong URL
  const match = googleDriveUrl.match(/\/d\/(.*?)\//);

  if (match && match[1]) {
    const fileId = match[1];
    // Trả về URL có thể dùng trong thẻ <img>
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } else {
    throw new Error("Invalid Google Drive URL");
  }
};

export async function getDataNV(): Promise<Barber[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Employee!A2:M", // Lấy từ A đến G (STT đến Ảnh mặt chính diện)
  });

  const rows = res.data.values || [];

  // Tải ảnh và lưu vào thư mục public
  const downloadAndSaveImage = async (imageUrl: string, index: number) => {
    if (imageUrl) {
      // Lấy tên file từ URL (bạn có thể thay đổi cách đặt tên file)
      const fileName = `avatar_${index}.jpg`; // Ví dụ: avatar_1.jpg
      await downloadImage(imageUrl, fileName);
      return `/images/${fileName}`; // Trả về đường dẫn ảnh trong thư mục public
    }
    return "";
  };

  const barbers = await Promise.all(
    rows
      .filter((row) => row[0]) // Chỉ lấy các dòng có STT (cột 0 không rỗng)
      .map(async (row, index) => {
        const avatarUrl = await downloadAndSaveImage(
          convertToDriveImageUrl(row[5]) || "",
          index
        ); // Cột F: ảnh mặt chính diện

        return {
          STT: row[0] || "",
          Name: row[1] || "",
          Ranking: row[2] || "",
          Phone: row[3] || "",
          Email: row[4] || "",
          AvatarUrl: avatarUrl, // Lưu đường dẫn ảnh đã tải về
          ProductImage: [row[6] || "", row[7] || "", row[8] || ""],
          ActivityImage: row[9] || "", // Cột J: ảnh hoạt động 1
          ClientImage: row[10] || "", // Cột K: ảnh hoạt động 2
          BusinessHours: row[11] || "", // Cột L: giờ làm việc 1
        };
      })
  );

  console.log("barbers", barbers); // Log the barbers array for debugging

  return barbers;
}

function extractImageUrl(cellData: string): string {
  if (!cellData) return "";

  const match = cellData.match(/"(https?:\/\/[^"]+)"/);
  return match ? match[1] : "";
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
