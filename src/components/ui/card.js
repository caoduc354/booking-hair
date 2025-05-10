export function Card({ children, className = "", selected = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-md border-2 cursor-pointer transition-colors duration-200 
        ${selected ? "border-blue-600 bg-blue-50" : "border-gray-400"} 
        ${className}`}
    >
      {children}
    </div>
  );
}
