"use client";

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
}

export default function ResultPanel({ result, previewSrc }: ResultPanelProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 py-12">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm">Upload &amp; analyze an image to see results</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
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
        />
      )}

      {/* Detection */}
      <DetectionCard summary={result.summary} boxes={result.boxes} />

      {/* AI Report */}
      <ReportCard report={result.report} aiSource={result.ai_source} />
    </div>
  );
}