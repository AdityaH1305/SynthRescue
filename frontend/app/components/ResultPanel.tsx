"use client";

import { motion } from "framer-motion";
import { Radar, MonitorOff, Clock, Timer } from "lucide-react";
import SeverityBadge from "./SeverityBadge";
import DetectionCard from "./DetectionCard";
import ReportCard from "./ReportCard";
import BoundingBoxOverlay from "./BoundingBoxOverlay";

export interface PredictionResult {
  boxes: Array<{
    label: string;
    confidence?: number;
    x: number;
    y: number;
    w: number;
    h: number;
    tier?: string;
  }>;
  summary: string;
  report: string;
  severity_level: string;
  ai_source: string;
  image_width: number;
  image_height: number;
}

interface ResultPanelProps {
  result: PredictionResult | null;
  previewSrc: string | null;
  // ADDED CODE START — New props for features 2, 5
  selectedDetectionId?: number | null;
  onSelectDetection?: (id: number | null) => void;
  scanDuration?: number | null;
  scanTimestamp?: string | null;
  // ADDED CODE END
}

export default function ResultPanel({
  result,
  previewSrc,
  // ADDED CODE START — Destructure new props
  selectedDetectionId = null,
  onSelectDetection,
  scanDuration = null,
  scanTimestamp = null,
  // ADDED CODE END
}: ResultPanelProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-600 py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Radar className="w-12 h-12 text-cyan-glow/15 mb-3" />
        </motion.div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-600 mt-2">
          NO ACTIVE FEED
        </p>
        <p className="text-[10px] font-mono text-slate-700 mt-1 flex items-center gap-1.5">
          <MonitorOff className="w-3 h-3" />
          UPLOAD &amp; SCAN TO INITIALIZE
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col space-y-4"
    >
      {/* Severity */}
      <div className="flex justify-center">
        <SeverityBadge level={result.severity_level} />
      </div>

      {/* Bounding box overlay on image */}
      {previewSrc && result.image_width > 0 && (
        <BoundingBoxOverlay
          imageSrc={previewSrc}
          boxes={result.boxes}
          imageWidth={result.image_width}
          imageHeight={result.image_height}
          // ADDED CODE START — Pass highlight state
          selectedDetectionId={selectedDetectionId}
          // ADDED CODE END
        />
      )}

      {/* Detection */}
      <DetectionCard
        summary={result.summary}
        boxes={result.boxes}
        // ADDED CODE START — Pass highlight props
        selectedDetectionId={selectedDetectionId}
        onSelectDetection={onSelectDetection}
        // ADDED CODE END
      />

      {/* ADDED CODE START — Feature 5: Scan metadata */}
      {(scanDuration !== null || scanTimestamp !== null) && (
        <div className="flex flex-wrap items-center gap-4 py-2 px-1">
          {scanDuration !== null && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-glow/50 uppercase tracking-wider">
              <Timer className="w-3 h-3" />
              SCAN TIME: {scanDuration}s
            </span>
          )}
          {scanTimestamp !== null && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-glow/50 uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              COMPLETED: {scanTimestamp}
            </span>
          )}
        </div>
      )}
      {/* ADDED CODE END */}

      {/* AI Report */}
      <ReportCard report={result.report} aiSource={result.ai_source} />
    </motion.div>
  );
}