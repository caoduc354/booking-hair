"use client";
import { useEffect, useState } from "react";
import BookingHaircut from "@/components/booking";

export default function Home() {
  const storeImages = [
    "/images/store/IMG_0575.jpg",
    "/images/store/IMG_0721.jpg",
    "/images/store/IMG_7560.jpg",
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % storeImages.length);
    }, 5000); // đổi ảnh mỗi 5 giây

    return () => clearInterval(interval);
  }, [storeImages.length]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image slideshow */}
      {storeImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 z-0 bg-center bg-cover transition-opacity duration-1000 ${
            index === currentImageIndex ? "opacity-30" : "opacity-0"
          }`}
          style={{
            backgroundImage: `url(${image})`,
          }}
        />
      ))}

      {/* Overlay for darkening the background */}
      <div className="absolute inset-0 z-10 bg-black/40" />

      {/* Main content */}
      <div className="relative z-20">
        <BookingHaircut />
      </div>
    </div>
  );
}
