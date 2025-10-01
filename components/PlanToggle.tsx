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
    <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1">
      <button
        onClick={() => toggle("monthly")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          mode === "monthly" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => toggle("yearly")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          mode === "yearly" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Yearly
      </button>
    </div>
  );
}
