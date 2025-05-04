import BookingHaircut from "@/components/booking";

export default function Home() {
  const storeImages = [
    "/images/store/IMG_0575.jpg",
    "/images/store/IMG_0721.jpg",
    "/images/store/IMG_7560.jpg",
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* All background images stacked with blur */}
      {storeImages.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 z-0 bg-center bg-cover filter blur-sm opacity-30 animate-fade"
          style={{
            backgroundImage: `url(${image})`,
            animationDelay: `${index * 2}s`,
          }}
        />
      ))}

      {/* Optional: dark overlay for contrast */}
      <div className="absolute inset-0 z-10 bg-black/40" />

      {/* Main content */}
      <div className="relative z-20">
        <BookingHaircut />
      </div>
    </div>
  );
}
