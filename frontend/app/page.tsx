"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Radio,
  AlertTriangle,
  Activity,
  Satellite,
  Clock,
  History,
} from "lucide-react";
import UploadBox from "./components/UploadBox";
import ResultPanel, { PredictionResult } from "./components/ResultPanel";

// ADDED CODE START — Scan status type
type ScanStatus = "idle" | "uploading" | "detecting" | "reporting" | "completed";

const STATUS_LABELS: Record<ScanStatus, string> = {
  idle: "",
  uploading: "Uploading...",
  detecting: "Running detection...",
  reporting: "Generating report...",
  completed: "Completed",
};

interface HistoryEntry {
  fileName: string;
  result: PredictionResult | null;
  preview: string | null;
  timestamp: string;
}
// ADDED CODE END

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ADDED CODE START — Feature 1: Scan status
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  // ADDED CODE END

  // ADDED CODE START — Feature 2: Click-to-highlight
  const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);
  const handleSelectDetection = useCallback((id: number | null) => {
    setSelectedDetectionId((prev) => (prev === id ? null : id));
  }, []);
  // ADDED CODE END

  // ADDED CODE START — Feature 4: Upload history
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // ADDED CODE END

  // ADDED CODE START — Feature 5: Scan timing
  const [scanDuration, setScanDuration] = useState<number | null>(null);
  const [scanTimestamp, setScanTimestamp] = useState<string | null>(null);
  // ADDED CODE END

  const handleFileSelected = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
    // ADDED CODE START — Reset on new file
    setScanStatus("idle");
    setSelectedDetectionId(null);
    setScanDuration(null);
    setScanTimestamp(null);
    // ADDED CODE END
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    // ADDED CODE START — Reset states for new scan
    setScanStatus("uploading");
    setSelectedDetectionId(null);
    setScanDuration(null);
    setScanTimestamp(null);
    const scanStartTime = performance.now();
    // ADDED CODE END

    try {
      const formData = new FormData();
      formData.append("file", file);
      // ADDED CODE START — Update status to detecting
      setScanStatus("detecting");
      // ADDED CODE END

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Server error (${res.status})`);
      }

      // ADDED CODE START — Update status to reporting
      setScanStatus("reporting");
      // ADDED CODE END
      const data: PredictionResult = await res.json();
      setResult(data);
      // ADDED CODE START — Mark completed, record timing & history
      setScanStatus("completed");
      const elapsed = (performance.now() - scanStartTime) / 1000;
      setScanDuration(parseFloat(elapsed.toFixed(2)));
      const now = new Date();
      const ts = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setScanTimestamp(ts);
      // Add to history (keep last 3)
      setHistory((prev) => {
        const entry: HistoryEntry = {
          fileName: file.name,
          result: data,
          preview: preview,
          timestamp: ts,
        };
        return [entry, ...prev.filter((h) => h.fileName !== file.name)].slice(0, 3);
      });
      // ADDED CODE END
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to the server.";
      setError(message);
      // ADDED CODE START — Reset status on error
      setScanStatus("idle");
      // ADDED CODE END
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen tactical-grid radar-glow scanline-overlay overflow-hidden">
      {/* ─── Top status bar ─── */}
      <div className="border-b border-cyan-glow/10 bg-[#0a0c10]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-glow/50">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyan-glow rounded-full animate-pulse" />
              SYSTEM ONLINE
            </span>
            <span className="text-cyan-glow/20">|</span>
            <span>FREQ 142.8 MHz</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-glow/40">
            <Activity className="w-3 h-3" />
            <span>TACTICAL UPLINK ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 pt-8 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-red-critical" />
            <h1
              id="app-title"
              className="text-3xl md:text-4xl font-extrabold tracking-tight font-mono uppercase"
            >
              <span className="text-red-critical">SYNTH</span>
              <span className="text-cyan-glow">RESCUE</span>
            </h1>
            <Shield className="w-8 h-8 text-red-critical" />
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-glow/40">
            <Radio className="w-3 h-3" />
            AI-POWERED DISASTER RESPONSE COMMAND
            <Radio className="w-3 h-3" />
          </div>
        </motion.div>
      </header>

      {/* ─── Main Grid ─── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── Left: Upload Panel ── */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-5 glass-panel corner-brackets rounded-none p-5 flex flex-col gap-6"
        >
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-glow/60 flex items-center gap-2 border-b border-cyan-glow/10 pb-3">
            <Satellite className="w-4 h-4" />
            IMAGERY UPLOAD TERMINAL
          </h2>

          <div>
            <UploadBox onFileSelected={handleFileSelected} />

            {/* Image preview (before analysis) */}
            <AnimatePresence>
            {preview && !result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="mt-4 rounded-none overflow-hidden border border-cyan-glow/20 relative"
              >
                {/* Corner targeting marks */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-glow z-10" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-glow z-10" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-glow z-10" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-glow z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Uploaded preview"
                  className="w-full max-h-[50vh] object-contain bg-black"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-8" />
                <span className="absolute bottom-1 left-2 text-[9px] font-mono text-cyan-glow/50 uppercase">
                  RAW FEED — AWAITING ANALYSIS
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          <motion.button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={!file || loading}
            whileHover={!file || loading ? {} : { scale: 1.01 }}
            whileTap={!file || loading ? {} : { scale: 0.98 }}
            className={`
              w-full py-3 rounded-none font-mono font-bold text-sm tracking-[0.15em] uppercase
              transition-all duration-200 border
              ${!file || loading
                ? "bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed"
                : "bg-red-critical/10 text-red-critical border-red-critical/40 hover:bg-red-critical/20 hover:border-red-critical/70 hover:shadow-[0_0_20px_rgba(255,23,68,0.15)]"
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                PROCESSING IMAGERY…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                INITIATE SCAN
              </span>
            )}
          </motion.button>

          {/* ADDED CODE START — Feature 1: Scan status indicator */}
          {scanStatus !== "idle" && (
            <div className="mt-3 flex items-center justify-center gap-2">
              {scanStatus !== "completed" && (
                <span className="w-1.5 h-1.5 bg-cyan-glow rounded-full animate-pulse" />
              )}
              {scanStatus === "completed" && (
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              )}
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.15em] ${
                  scanStatus === "completed" ? "text-emerald-400" : "text-cyan-glow/70"
                }`}
              >
                {STATUS_LABELS[scanStatus]}
              </span>
            </div>
          )}
          {/* ADDED CODE END */}

          {/* ADDED CODE START — Feature 4: Recent Scans */}
          {history.length > 0 && (
            <div className="mt-5 pt-4 border-t border-cyan-glow/10">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-glow/40 mb-3 flex items-center gap-2">
                <History className="w-3 h-3" />
                RECENT SCANS
              </h3>
              <div className="flex flex-col gap-1.5">
                {history.map((entry, idx) => (
                  <button
                    key={`${entry.fileName}-${idx}`}
                    onClick={() => {
                      if (entry.result) {
                        setResult(entry.result);
                        if (entry.preview) setPreview(entry.preview);
                        setScanStatus("completed");
                        setSelectedDetectionId(null);
                      }
                    }}
                    className="w-full text-left px-3 py-2 bg-slate-950/60 border border-slate-800/50 hover:border-cyan-glow/30 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-glow truncate max-w-[70%]">
                      {entry.fileName}
                    </span>
                    <span className="text-[9px] font-mono text-slate-600">
                      {entry.timestamp}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* ADDED CODE END */}
        </motion.section>

        {/* ── Right: Results Panel ── */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-7 glass-panel corner-brackets rounded-none p-5"
        >
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-glow/60 mb-4 flex items-center gap-2 border-b border-cyan-glow/10 pb-3">
            <Activity className="w-4 h-4" />
            THREAT ANALYSIS OUTPUT
          </h2>

          {/* Error state */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                id="error-banner"
                className="mb-4 p-4 rounded-none bg-red-critical/10 border border-red-critical/30 text-sm text-red-400 font-mono"
              >
                <p className="font-bold mb-1 flex items-center gap-2 uppercase text-xs tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  SYSTEM ERROR
                </p>
                <p className="text-red-400/80">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-slate-800/60 rounded-none w-36" />
              <div className="h-52 bg-slate-800/40 rounded-none border border-cyan-glow/5" />
              <div className="h-28 bg-slate-800/40 rounded-none border border-cyan-glow/5" />
              <div className="h-40 bg-slate-800/40 rounded-none border border-cyan-glow/5" />
            </div>
          )}

          {/* Results */}
          {!loading && (
            <ResultPanel
              result={result}
              previewSrc={preview}
              // ADDED CODE START — Pass new props
              selectedDetectionId={selectedDetectionId}
              onSelectDetection={handleSelectDetection}
              scanDuration={scanDuration}
              scanTimestamp={scanTimestamp}
              // ADDED CODE END
            />
          )}
        </motion.section>
      </div>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-glow/20 pb-6 border-t border-cyan-glow/5 pt-4 mt-auto">
        SYNTHRESCUE v2.0 · TACTICAL AI RESPONSE · CLASSIFICATION: UNCLASSIFIED
      </footer>
    </main>
  );
}