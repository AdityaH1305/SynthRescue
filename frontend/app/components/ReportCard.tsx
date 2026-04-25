"use client";

// ADDED CODE START — Import useState for copy feedback
import { useState } from "react";
// ADDED CODE END

import { motion } from "framer-motion";
import { FileText, AlertTriangle, Cpu, Copy, Download, Check } from "lucide-react";

interface ReportCardProps {
  report: string;
  aiSource: string;
}

export default function ReportCard({ report, aiSource }: ReportCardProps) {
  const isFallback = aiSource !== "gemini";

  // ADDED CODE START — Feature 3: Copy state
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently fail
    }
  };

  const handleDownload = () => {
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dispatch_report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  // ADDED CODE END

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

      <div className="mt-4 pt-3 border-t border-cyan-glow/10 flex items-center gap-3 flex-wrap">
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

        {/* ADDED CODE START — Feature 3: Copy & Download buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border border-cyan-glow/20 text-cyan-glow/60 hover:text-cyan-glow hover:border-cyan-glow/40 hover:bg-cyan-glow/5 transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                COPY
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border border-cyan-glow/20 text-cyan-glow/60 hover:text-cyan-glow hover:border-cyan-glow/40 hover:bg-cyan-glow/5 transition-all duration-200"
          >
            <Download className="w-3 h-3" />
            DOWNLOAD
          </button>
        </div>
        {/* ADDED CODE END */}
      </div>
    </motion.div>
  );
}
