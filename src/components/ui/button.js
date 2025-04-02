export function Button({ children, variant = "default", ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-md ${
        variant === "default"
          ? "bg-blue-500 text-white"
          : "border border-gray-400"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}
