"use client";

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
    <div
      id="detection-card"
      className="bg-gray-800/60 border border-gray-700 rounded-xl p-5"
    >
      <h3 className="text-base font-semibold text-gray-200 mb-3 flex items-center gap-2">
        <span className="text-lg">🔍</span> Detection Summary
      </h3>

      <p className="text-sm text-gray-300 mb-4 leading-relaxed">{summary}</p>

      {/* Stats bar */}
      {boxes.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex items-center gap-1.5 bg-emerald-900/30 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {strongCount} confirmed
          </div>
          {weakCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-900/30 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {weakCount} possible
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-gray-700/50 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-lg">
            {boxes.length} total detections
          </div>
        </div>
      )}

      {/* Detection list — clean, no raw coords */}
      {boxes.length > 0 && (
        <div className="space-y-1.5">
          {boxes.map((box, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-900/60 rounded-lg px-4 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    box.tier === "strong" ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-gray-200 font-medium capitalize">
                  {box.label.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {box.confidence != null && (
                  <span
                    className={`font-mono ${
                      box.tier === "strong"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {(box.confidence * 100).toFixed(0)}%
                  </span>
                )}
                <span className="text-gray-600">
                  {box.tier === "strong" ? "confirmed" : "possible"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {boxes.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          No detections above confidence threshold.
        </p>
      )}
    </div>
  );
}
