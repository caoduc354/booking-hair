import React from "react";

interface SelectProps {
  value: string | null;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ value, onChange, children }) => {
  return (
    <select
      value={value || ""}
      onChange={onChange}
      className="w-full p-2 border rounded-md bg-white"
    >
      {children}
    </select>
  );
};

export default Select;
