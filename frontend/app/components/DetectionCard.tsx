"use client";

import { motion } from "framer-motion";
import { Target, Eye, Scan } from "lucide-react";

interface Box {
  label: string;
  confidence?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  tier?: string;
}

interface DetectionCardProps {
  summary: string;
  boxes: Box[];
}

export default function DetectionCard({ summary, boxes }: DetectionCardProps) {
  const strongCount = boxes.filter((b) => b.tier === "strong").length;
  const weakCount = boxes.filter((b) => b.tier === "weak").length;

  return (
    <motion.div
      id="detection-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-slate-900/40 border border-cyan-glow/15 rounded-none p-5 backdrop-blur-md"
    >
      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-glow/60 mb-3 flex items-center gap-2 border-b border-cyan-glow/10 pb-3">
        <Scan className="w-4 h-4" />
        DETECTION SUMMARY
      </h3>

      <p className="text-sm text-slate-300 mb-4 leading-relaxed font-mono">
        {summary}
      </p>

      {/* Stats bar */}
      {boxes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-cyan-glow/5 text-cyan-glow text-[10px] font-mono font-medium px-3 py-1.5 rounded-none border border-cyan-glow/15 uppercase tracking-wider">
            <Target className="w-3 h-3" />
            {strongCount} CONFIRMED
          </div>
          {weakCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-alert/5 text-amber-alert text-[10px] font-mono font-medium px-3 py-1.5 rounded-none border border-amber-alert/15 uppercase tracking-wider">
              <Eye className="w-3 h-3" />
              {weakCount} POSSIBLE
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-slate-800/50 text-slate-400 text-[10px] font-mono font-medium px-3 py-1.5 rounded-none border border-slate-700/50 uppercase tracking-wider">
            {boxes.length} TOTAL
          </div>
        </div>
      )}

      {/* Detection list */}
      {boxes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxes.map((box, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="flex flex-col gap-2 bg-slate-950/60 rounded-none p-4 text-sm border border-slate-800/50 hover:border-cyan-glow/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 ${
                    box.tier === "strong" ? "bg-cyan-glow" : "bg-amber-alert"
                  } animate-pulse`}
                />
                <span className="text-slate-200 font-mono text-xs uppercase tracking-wide font-bold">
                  {box.label.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800 pt-2 mt-1">
                <span className="text-slate-500 uppercase tracking-wider">
                  {box.tier === "strong" ? "CONFIRMED" : "POSSIBLE"}
                </span>
                {box.confidence != null && (
                  <span
                    className={`${
                      box.tier === "strong"
                        ? "text-cyan-glow"
                        : "text-amber-alert"
                    } font-bold`}
                  >
                    {(box.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {boxes.length === 0 && (
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
          NO DETECTIONS ABOVE CONFIDENCE THRESHOLD.
        </p>
      )}
    </motion.div>
  );
}
