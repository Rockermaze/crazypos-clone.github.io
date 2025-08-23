"use client";
import { useState } from "react";

interface PlanToggleProps {
  onChange: (mode: "monthly" | "yearly") => void;
}

export function PlanToggle({ onChange }: PlanToggleProps) {
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");

  const toggle = (value: "monthly" | "yearly") => {
    setMode(value);
    onChange(value);
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => toggle("monthly")}
        className={`px-4 py-2 rounded ${
          mode === "monthly" ? "bg-blue-600 text-white" : "bg-gray-200"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => toggle("yearly")}
        className={`px-4 py-2 rounded ${
          mode === "yearly" ? "bg-blue-600 text-white" : "bg-gray-200"
        }`}
      >
        Yearly
      </button>
    </div>
  );
}
