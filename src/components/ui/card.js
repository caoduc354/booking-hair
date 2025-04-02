export function Card({ children, className = "" }) {
  return <div className={`p-4 border rounded-md ${className}`}>{children}</div>;
}
