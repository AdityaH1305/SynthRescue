"use client";

import { motion } from "framer-motion";
import { AlertOctagon, ShieldAlert, ShieldCheck } from "lucide-react";

interface SeverityBadgeProps {
  level: string;
}

const CONFIG: Record<
  string,
  {
    border: string;
    bg: string;
    text: string;
    glow: string;
    label: string;
    pulse: boolean;
    Icon: typeof AlertOctagon;
  }
> = {
  HIGH: {
    border: "border-red-critical/60",
    bg: "bg-red-critical/10",
    text: "text-red-critical",
    glow: "shadow-[0_0_15px_rgba(255,23,68,0.3)]",
    label: "CRITICAL — HIGH SEVERITY",
    pulse: true,
    Icon: AlertOctagon,
  },
  MEDIUM: {
    border: "border-amber-alert/50",
    bg: "bg-amber-alert/10",
    text: "text-amber-alert",
    glow: "shadow-[0_0_10px_rgba(255,171,0,0.15)]",
    label: "ELEVATED — MEDIUM SEVERITY",
    pulse: false,
    Icon: ShieldAlert,
  },
  LOW: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    glow: "",
    label: "NOMINAL — LOW SEVERITY",
    pulse: false,
    Icon: ShieldCheck,
  },
};

export default function SeverityBadge({ level }: SeverityBadgeProps) {
  const cfg = CONFIG[level] ?? CONFIG.LOW;
  const IconComponent = cfg.Icon;

  return (
    <motion.span
      id="severity-badge"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-none text-xs font-mono font-bold
        tracking-[0.15em] uppercase border
        ${cfg.border} ${cfg.bg} ${cfg.text} ${cfg.glow}
        ${cfg.pulse ? "animate-glowPulse" : ""}
      `}
    >
      <IconComponent className="w-4 h-4" />
      {cfg.label}
    </motion.span>
  );
}
