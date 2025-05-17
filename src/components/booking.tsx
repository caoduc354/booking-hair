"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import Select from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

const statuses = ["available", "booked", "busy"];

// const generateTimeslots = () => {
//   const slots = [];
//   for (let hour = 9; hour <= 18; hour++) {
//     const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
//     slots.push({ time: `${hour}:00`, status: randomStatus });
//   }
//   return slots;
// };

const parseBusinessHours = (businessHours: string): string[] => {
  const slots: string[] = [];

  const ranges = businessHours.split(","); // ["09:00-12:00", "14:00-18:00"]
  for (const range of ranges) {
    const [start, end] = range.split("-").map((t) => parseInt(t.split(":")[0]));
    for (let hour = start; hour <= end; hour++) {
      slots.push(`${hour}:00`);
    }
  }
  return slots;
};

export default function BookingHaircut() {
  type Barber = {
    STT: string;
    name: string;
    email: string;
    avatar: string;
    phone: string;
    productImages: string[];
    activityImage: string;
    clientImage: string;
    businessHours: string;
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
  const [ranks, setRanks] = useState<string[]>([]);
  const timeslots = selectedBarber
    ? parseBusinessHours(selectedBarber.businessHours)
    : [];
  // Fetch barbers + lấy luôn ranks
  useEffect(() => {
    const fetchBarbers = async () => {
      const res = await fetch("/api/barbers");
      const barbers = await res.json();
      const grouped = barbers.reduce(
        (
          acc: Record<
            string,
            {
              STT: string;
              name: string;
              email: string;
              avatar: string;
              phone: string;
              productImages: string[];
              activityImage: string;
              clientImage: string;
              businessHours: string;
            }[]
          >,
          b: any
        ) => {
          // Khởi tạo group cho Ranking nếu chưa có
          acc[b.Ranking] = acc[b.Ranking] || [];

          // Thêm thông tin vào group của Ranking
          acc[b.Ranking].push({
            STT: b.STT || "", // Cột STT
            name: b.Name || "", // Cột Name
            email: b.Email || "", // Cột Email
            avatar: b.AvatarUrl || "", // Cột Avatar
            phone: b.Phone || "", // Cột Phone
            productImages: b.ProductImage || [], // Ảnh sản phẩm
            activityImage: b.ActivityImage || "", // Cột ActivityImage
            clientImage: b.ClientImage || "", // Cột ClientImage
            businessHours: b.BusinessHours || "", // Cột giờ làm việc
          });
          return acc;
        },
        {}
      );

      setBarbersByRank(grouped);

      // Set danh sách rank duy nhất
      const uniqueRanks: any = Array.from(
        new Set(
          barbers
            .map((b: any) => b.Ranking)
            .filter((ranking: string) => ranking && ranking.length > 0)
        )
      );
      setRanks(uniqueRanks);
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
    <div className="w-full max-w-lg px-4 mx-auto space-y-6 sm:px-6 md:px-8">
      <h1 className="text-2xl font-bold text-center sm:text-3xl">
        Đặt vé cắt tóc
      </h1>
      <div className="flex flex-col p-3 text-sm bg-gray-200 border-2 border-black rounded-lg sm:flex-row sm:justify-between sm:text-base">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-200 rounded" />
          <span>Có thể đặt</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-200 rounded" />
          <span>Đã đặt</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-400 rounded" />
          <span>Bận</span>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold sm:text-xl">Chọn ngày</h2>
        <Calendar onChange={setSelectedDate} selected={selectedDate} />
      </div>
      <div>
        <h2 className="text-lg font-semibold sm:text-xl">
          Chọn hạng thợ cắt tóc
        </h2>
        <div className="flex flex-wrap gap-2">
          {/* {ranks.map((rank) => (
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
          ))} */}

          {ranks.map((rank) => (
            <Button
              className="w-full"
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
          <h2 className="text-lg font-semibold sm:text-xl">Chọn thợ cắt tóc</h2>
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
          <h2 className="text-lg font-semibold sm:text-xl">Chọn khung giờ</h2>
          {loadingSlots ? (
            <div className="flex items-center justify-center mt-2 space-x-2">
              <svg
                className="w-5 h-5 text-gray-500 animate-spin"
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
              <span className="italic text-gray-500">
                Đang tải khung giờ...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {timeslots.map((time) => {
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
                    <Card
                      className="p-2"
                      selected={selectedTime === time}
                      onClick={() => !isBooked && setSelectedTime(time)}
                    >
                      {time}
                    </Card>{" "}
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
            <h2 className="text-lg font-semibold sm:text-xl">Tên khách hàng</h2>
            <input
              className="w-full px-3 py-2 text-sm border rounded"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nhập tên khách"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Số điện thoại</h2>
            <input
              className="w-full px-3 py-2 text-sm border rounded"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
      )}
      <div className="space-y-2 text-center">
        <Button
          variant="default"
          onClick={handleSubmit}
          disabled={isDisabled || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-4 h-4 text-white animate-spin"
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
          <div className="relative z-10 w-full max-w-sm p-6 space-y-4 text-center bg-white shadow-xl rounded-xl animate-fadeInScale overflow-y-auto max-h-[90vh]">
            <img
              src={pendingBarber.avatar}
              alt={pendingBarber?.name || "Unknown Barber"}
              className="object-cover w-24 h-24 mx-auto rounded-full"
            />
            <h3 className="text-xl font-bold">{pendingBarber.name}</h3>

            {pendingBarber.email && (
              <p className="text-sm text-gray-500">
                Email: {pendingBarber.email}
              </p>
            )}

            <p className="text-sm italic text-gray-600">
              {selectedRank} Barber tại ELITE Barbershop
            </p>

            {/* Product Images */}
            {pendingBarber.productImages.filter((img) => img).length > 0 && (
              <div className="text-left">
                <h4 className="mb-2 text-sm font-semibold">
                  Công việc thường ngày :
                </h4>
                <Swiper
                  modules={[Navigation]}
                  navigation
                  spaceBetween={10}
                  slidesPerView={1}
                  className="rounded"
                >
                  {pendingBarber.productImages
                    .filter((img) => img)
                    .map((img, idx) => (
                      <SwiperSlide key={idx}>
                        <img
                          src={img}
                          alt={`Product ${idx + 1}`}
                          className="w-full h-auto rounded"
                        />
                      </SwiperSlide>
                    ))}
                </Swiper>
              </div>
            )}

            {/* Client Image */}
            {/* {pendingBarber.clientImage && (
              <div>
                <h4 className="mb-1 text-sm font-semibold text-left">
                  Ảnh khách hàng:
                </h4>
                <img
                  src={pendingBarber.clientImage}
                  alt="Client"
                  className="object-cover w-full h-40 rounded"
                />
              </div>
            )} */}

            {/* Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPendingBarber(null);
                  setShowBarberModal(false);
                }}
                className="w-full"
              >
                Hủy
              </Button>
              <Button
                className="w-full"
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
          <div className="relative w-full max-w-sm p-6 text-center bg-white shadow-xl rounded-xl animate-fadeInScale">
            <h2 className="mb-4 text-xl font-bold text-green-600">
              🎉 Đặt lịch cắt tóc thành công!
            </h2>
            <p className="mb-4 text-gray-700">
              Cảm ơn bạn đã đặt lịch. Hẹn gặp lại tại <strong>ELITE</strong>!
            </p>
            <div className="p-4 mb-4 text-sm text-left text-gray-600 border rounded bg-gray-50">
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
