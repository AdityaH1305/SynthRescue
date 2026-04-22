"use client";

import { useState } from "react";
import UploadBox from "./components/UploadBox";
import ResultPanel, { PredictionResult } from "./components/ResultPanel";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Server error (${res.status})`);
      }

      const data: PredictionResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to the server.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* ─── Header ─── */}
      <header className="pt-10 pb-6 text-center">
        <h1
          id="app-title"
          className="text-4xl md:text-5xl font-extrabold tracking-tight"
        >
          <span className="text-red-500">🚨</span>{" "}
          <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            SynthRescue
          </span>
        </h1>
        <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
          AI-powered disaster response — upload a scene image and receive an
          instant emergency analysis report.
        </p>
      </header>

      {/* ─── Content ─── */}
      <div className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: Upload ── */}
        <section className="bg-gray-900/70 backdrop-blur rounded-2xl border border-gray-800 p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📤</span> Upload Disaster Image
          </h2>

          <UploadBox onFileSelected={handleFileSelected} />

          {/* Image preview (before analysis) */}
          {preview && !result && (
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Uploaded preview"
                className="w-full max-h-64 object-contain bg-black"
              />
            </div>
          )}

          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={!file || loading}
            className={`
              mt-5 w-full py-3 rounded-xl font-semibold text-sm tracking-wide
              transition-all duration-200
              ${!file || loading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-900/30"
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
                Analyzing…
              </span>
            ) : (
              "Analyze Image"
            )}
          </button>
        </section>

        {/* ── Right: Results ── */}
        <section className="bg-gray-900/70 backdrop-blur rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📋</span> Analysis Results
          </h2>

          {/* Error state */}
          {error && (
            <div
              id="error-banner"
              className="mb-4 p-4 rounded-xl bg-red-900/30 border border-red-700/50 text-sm text-red-300"
            >
              <p className="font-semibold mb-1">⚠️ Something went wrong</p>
              <p>{error}</p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-gray-800 rounded-full w-40 mx-auto" />
              <div className="h-48 bg-gray-800 rounded-xl" />
              <div className="h-32 bg-gray-800 rounded-xl" />
              <div className="h-48 bg-gray-800 rounded-xl" />
            </div>
          )}

          {/* Results */}
          {!loading && <ResultPanel result={result} previewSrc={preview} />}
        </section>
      </div>

      {/* ─── Footer ─── */}
      <footer className="text-center text-xs text-gray-600 pb-6">
        SynthRescue · Disaster Response AI · Built for impact
      </footer>
    </main>
  );
}