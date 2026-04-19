"use client";

interface ReportCardProps {
  report: string;
  aiSource: string;
}

export default function ReportCard({ report, aiSource }: ReportCardProps) {
  const isFallback = aiSource !== "gemini";

  return (
    <div
      id="report-card"
      className={`rounded-xl p-5 border ${
        isFallback
          ? "bg-amber-950/30 border-amber-700/50"
          : "bg-gray-800/60 border-gray-700"
      }`}
    >
      <h3 className="text-base font-semibold text-gray-200 mb-1 flex items-center gap-2">
        <span className="text-lg">{isFallback ? "⚠️" : "🤖"}</span>
        AI Emergency Report
      </h3>

      {isFallback && (
        <p className="text-xs text-amber-400/80 mb-3">
          Gemini was unavailable — fallback report generated from detection data.
        </p>
      )}

      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
        {report}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
          Source
        </span>
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded ${
            isFallback
              ? "bg-amber-800/40 text-amber-400"
              : "bg-emerald-800/40 text-emerald-400"
          }`}
        >
          {aiSource}
        </span>
      </div>
    </div>
  );
}
