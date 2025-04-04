"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import Select from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const ranks = ["Junior", "Senior", "Master"];
const statuses = ["available", "booked", "busy"];

const generateTimeslots = () => {
  const slots = [];
  for (let hour = 9; hour <= 18; hour++) {
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    slots.push({ time: `${hour}:00`, status: randomStatus });
  }
  return slots;
};

export default function BookingHaircut() {
  type Barber = {
    name: string;
    email: string;
    avatar: string;
    fullname: string;
  };
  const [barbersByRank, setBarbersByRank] = useState<Record<string, Barber[]>>(
    {}
  );
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedRank, setSelectedRank] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    date: string;
    time: string;
    rank: string;
    barber: string;
    name: string;
    phone: string;
  } | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingBarber, setPendingBarber] = useState<Barber | null>(null);
  const [showBarberModal, setShowBarberModal] = useState(false);

  const timeslots = generateTimeslots();

  // Fetch barber data
  useEffect(() => {
    const fetchBarbers = async () => {
      const res = await fetch("/api/barbers");
      const barbers = await res.json();
      const grouped = barbers.reduce(
        (
          acc: Record<
            string,
            { name: string; email: string; avatar: string; fullname: string }[]
          >,
          b: any
        ) => {
          acc[b.Ranking] = acc[b.Ranking] || [];
          acc[b.Ranking].push({
            name: b.Name,
            email: b.Mail,
            avatar: b.Image,
            fullname: b.Fullname,
          });
          return acc;
        },
        {}
      );

      setBarbersByRank(grouped);
    };

    fetchBarbers();
  }, []);

  // Fetch booked slots when selectedDate or selectedBarber thay đổi
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDate || !selectedBarber) return;
      setLoadingSlots(true);
      const dateStr = selectedDate.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const res = await fetch("/api/bookings-by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, barber: selectedBarber }),
      });
      const data = await res.json();
      setBookedSlots(data.result || []);
      setLoadingSlots(false);
    };

    fetchBookedSlots();
  }, [selectedDate, selectedBarber]);

  const handleSubmit = async () => {
    if (isSubmitting) return; // tránh double click
    setIsSubmitting(true);
    const payload = {
      date: selectedDate?.toDateString(),
      time: selectedTime,
      rank: selectedRank,
      barber: selectedBarber?.name,
      name: customerName,
      phone: customerPhone,
    };

    // Kiểm tra trùng slot
    const checkRes = await fetch("/api/check-slot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: payload.date,
        time: payload.time,
        barberName: payload.barber,
        ranking: payload.rank,
      }),
    });
    const checkData = await checkRes.json();

    if (!checkData.available) {
      alert("Lịch hẹn này đã được đặt. Vui lòng chọn khung giờ khác.");
      setIsSubmitting(false);
      return;
    }

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (result.success) {
      //Send mail đến người đặt và người cắt
      await fetch("/api/send-mailer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberEmail: selectedBarber?.email,
          barberName: selectedBarber?.name,
          customerName,
          appointmentTime: `${payload.date} ${payload.time}`,
          location: "ELITE Barbershop",
        }),
      });

      setConfirmedBooking({
        date: payload.date!,
        time: payload.time!,
        rank: payload.rank!,
        barber: payload.barber!,
        name: payload.name!,
        phone: payload.phone!,
      });

      setShowSuccess(true);
      // Reset form sau khi đặt
      setSelectedDate(null);
      setSelectedRank(null);
      setSelectedBarber(null);
      setSelectedTime(null);
      setCustomerName("");
      setCustomerPhone("");
    } else {
      alert("Đặt vé thất bại!");
    }

    setIsSubmitting(false);
  };

  const isDisabled =
    !selectedDate ||
    !selectedRank ||
    !selectedBarber ||
    !selectedTime ||
    !customerName ||
    !customerPhone;

  const getDisabledReason = () => {
    if (!selectedDate) return "Vui lòng chọn ngày.";
    if (!selectedRank) return "Vui lòng chọn hạng thợ.";
    if (!selectedBarber) return "Vui lòng chọn thợ cắt tóc.";
    if (!selectedTime) return "Vui lòng chọn khung giờ.";
    if (!customerName) return "Vui lòng nhập tên khách.";
    if (!customerPhone) return "Vui lòng nhập số điện thoại.";
    return "";
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Đặt vé cắt tóc</h1>

      <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 rounded" />
          <span>Có thể đặt</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 rounded" />
          <span>Đã đặt</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <span>Bận</span>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Chọn ngày</h2>
        <Calendar onChange={setSelectedDate} selected={selectedDate} />
      </div>

      <div>
        <h2 className="text-lg font-semibold">Chọn hạng thợ cắt tóc</h2>
        <div className="flex space-x-2">
          {ranks.map((rank) => (
            <Button
              key={rank}
              variant={selectedRank === rank ? "default" : "outline"}
              onClick={() => {
                setSelectedRank(rank);
                setSelectedBarber(null);
              }}
            >
              {rank}
            </Button>
          ))}
        </div>
      </div>

      {selectedRank && (
        <div>
          <h2 className="text-lg font-semibold">Chọn thợ cắt tóc</h2>
          <Select
            onChange={(e) => {
              const selectedEmail = e.target.value;
              const foundBarber = barbersByRank[selectedRank!]?.find(
                (b) => b.email === selectedEmail
              );
              if (foundBarber) {
                setPendingBarber(foundBarber);
                setShowBarberModal(true);
              }
            }}
            value={selectedBarber?.email || ""}
          >
            <option value="" disabled>
              Chọn thợ cắt tóc
            </option>
            {(barbersByRank[selectedRank!] || []).map((barber) => (
              <option key={barber.email} value={barber.email}>
                {barber.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {selectedBarber && (
        <div>
          <h2 className="text-lg font-semibold">Chọn khung giờ</h2>
          {loadingSlots ? (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <svg
                className="animate-spin h-5 w-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <span className="text-gray-500 italic">
                Đang tải khung giờ...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {timeslots.map(({ time }) => {
                const isBooked = bookedSlots.includes(time);
                const status = isBooked ? "booked" : "available";
                return (
                  <div
                    key={time}
                    onClick={() => !isBooked && setSelectedTime(time)}
                    className={cn(
                      "p-2 text-center cursor-pointer rounded-lg border shadow",
                      status === "available" &&
                        "bg-green-100 hover:bg-green-200",
                      status === "booked" && "bg-red-100 cursor-not-allowed",
                      selectedTime === time && "ring-2 ring-blue-500"
                    )}
                  >
                    <Card className="p-2">{time}</Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Thông tin khách hàng */}
      {selectedTime && selectedBarber && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Tên khách hàng</h2>
            <input
              className="w-full px-3 py-2 border rounded"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nhập tên khách"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Số điện thoại</h2>
            <input
              className="w-full px-3 py-2 border rounded"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <Button
          variant="default"
          onClick={handleSubmit}
          disabled={isDisabled || isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <span>Đang xử lý...</span>
            </div>
          ) : (
            "Xác nhận đặt vé"
          )}
        </Button>

        {isDisabled && !isSubmitting && (
          <p className="text-sm text-red-500">{getDisabledReason()}</p>
        )}
      </div>
      {showBarberModal && pendingBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setShowBarberModal(false)}
          ></div>

          {/* modal box */}
          <div className="relative bg-white rounded-xl p-6 shadow-xl text-center max-w-sm w-full animate-fadeInScale space-y-4 z-10">
            <img
              src={"/images-nam.png"}
              alt={pendingBarber.name}
              className="w-24 h-24 rounded-full mx-auto object-cover"
            />
            <h3 className="text-xl font-bold">{pendingBarber.fullname}</h3>
            {pendingBarber.email && (
              <p className="text-sm text-gray-500">
                Email: {pendingBarber.email}
              </p>
            )}
            <p className="text-gray-600 text-sm italic">
              {selectedRank} Barber tại ELITE Barbershop
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPendingBarber(null);
                  setShowBarberModal(false);
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  setSelectedBarber(pendingBarber);
                  setPendingBarber(null);
                  setShowBarberModal(false);
                }}
              >
                Chọn người này cắt
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay nền đen mờ */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>

          {/* modal box */}
          <div className="relative bg-white rounded-xl p-6 shadow-xl text-center max-w-sm w-full animate-fadeInScale">
            <h2 className="text-xl font-bold mb-4 text-green-600">
              🎉 Đặt lịch cắt tóc thành công!
            </h2>
            <p className="mb-4 text-gray-700">
              Cảm ơn bạn đã đặt lịch. Hẹn gặp lại tại <strong>ELITE</strong>!
            </p>
            <div className="text-left text-sm text-gray-600 bg-gray-50 p-4 rounded mb-4 border">
              <p>
                <strong>Ngày:</strong> {confirmedBooking.date}
              </p>
              <p>
                <strong>Giờ:</strong> {confirmedBooking.time}
              </p>
              <p>
                <strong>Thợ cắt:</strong> {confirmedBooking.barber} (
                {confirmedBooking.rank})
              </p>
              <p>
                <strong>Khách:</strong> {confirmedBooking.name} -{" "}
                {confirmedBooking.phone}
              </p>
            </div>
            <Button
              onClick={() => {
                setShowSuccess(false);
                setConfirmedBooking(null);
              }}
              variant="default"
              className="w-full"
            >
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
