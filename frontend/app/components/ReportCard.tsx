"use client";

import { motion } from "framer-motion";
import { FileText, AlertTriangle, Cpu } from "lucide-react";

interface ReportCardProps {
  report: string;
  aiSource: string;
}

export default function ReportCard({ report, aiSource }: ReportCardProps) {
  const isFallback = aiSource !== "gemini";

  // Split report into lines for typewriter effect
  const lines = report.split("\n");

  return (
    <motion.div
      id="report-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`rounded-none p-5 border backdrop-blur-md ${
        isFallback
          ? "bg-amber-950/20 border-amber-alert/20"
          : "bg-slate-900/40 border-cyan-glow/15"
      }`}
    >
      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-glow/60 mb-3 flex items-center gap-2 border-b border-cyan-glow/10 pb-3">
        {isFallback ? (
          <AlertTriangle className="w-4 h-4 text-amber-alert" />
        ) : (
          <FileText className="w-4 h-4 text-cyan-glow/60" />
        )}
        <span>INCOMING TRANSMISSION — AI DISPATCH REPORT</span>
      </h3>

      {isFallback && (
        <div className="text-[10px] text-amber-alert/70 mb-3 font-mono uppercase tracking-wider flex items-center gap-1.5 bg-amber-950/30 px-3 py-1.5 border-l-2 border-amber-alert/50">
          <AlertTriangle className="w-3 h-3" />
          GEMINI LINK SEVERED — FALLBACK REPORT ACTIVE
        </div>
      )}

      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono">
        {lines.map((line, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.03, delay: i * 0.04 }}
            className="block"
          >
            {line || "\u00A0"}
          </motion.span>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-cyan-glow/10 flex items-center gap-3">
        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-mono">
          SOURCE
        </span>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-none border flex items-center gap-1.5 ${
            isFallback
              ? "bg-amber-950/30 text-amber-alert border-amber-alert/20"
              : "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"
          }`}
        >
          <Cpu className="w-3 h-3" />
          {aiSource.toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
}
