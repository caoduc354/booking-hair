import { useState } from "react";

export function Calendar({ onChange, selected }) {
  const [date, setDate] = useState(selected || new Date());

  return (
    <input
      type="date"
      className="border p-2 rounded-md"
      value={date.toISOString().split("T")[0]}
      onChange={(e) => {
        const newDate = new Date(e.target.value);
        setDate(newDate);
        onChange(newDate);
      }}
    />
  );
}
