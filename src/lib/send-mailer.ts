import nodemailer from "nodemailer";

export interface SendMailerPayload {
  barberEmail: string;
  barberName: string;
  customerName: string;
  appointmentTime: string;
  location: string;
}

export async function sendBookingEmail(data: SendMailerPayload) {
  const { barberEmail, barberName, customerName, appointmentTime, location } = data;

  // Cấu hình đúng cho Gmail SMTP + App Password
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // dùng SSL/TLS nên cần port 465
    secure: true, // bắt buộc true với port 465
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // phải là App Password 16 ký tự
    },
  });

  const mailOptions = {
    from: `"ELITE Barbershop" <${process.env.GMAIL_USER}>`,
    to: barberEmail,
    subject: "Bạn có lịch hẹn mới",
    html: `
      <h2>Xin chào ${barberName},</h2>
      <p>Bạn có một lịch cắt tóc mới:</p>
      <ul>
        <li><strong>Khách hàng:</strong> ${customerName}</li>
        <li><strong>Thời gian:</strong> ${appointmentTime}</li>
        <li><strong>Địa điểm:</strong> ${location}</li>
      </ul>
      <p>Vui lòng chuẩn bị và xác nhận lịch trình.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Lỗi gửi mail:", error);
    return { success: false, message: error.message };
  }
}
