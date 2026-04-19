"use client";

interface SeverityBadgeProps {
  level: string;
}

const CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  HIGH: { bg: "bg-red-600/20", text: "text-red-400", label: "🔴 HIGH SEVERITY" },
  MEDIUM: {
    bg: "bg-amber-600/20",
    text: "text-amber-400",
    label: "🟡 MEDIUM SEVERITY",
  },
  LOW: {
    bg: "bg-emerald-600/20",
    text: "text-emerald-400",
    label: "🟢 LOW SEVERITY",
  },
};

export default function SeverityBadge({ level }: SeverityBadgeProps) {
  const cfg = CONFIG[level] ?? CONFIG.LOW;

  return (
    <span
      id="severity-badge"
      className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}
