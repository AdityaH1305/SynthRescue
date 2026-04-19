"use client";

import { useState } from "react";
import UploadBox from "./components/UploadBox";
import ResultPanel from "./components/ResultPanel";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/predict", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">

      {/* Header */}
      <h1 className="text-4xl font-bold text-center text-red-500 mb-10">
        🚨 SynthRescue Dashboard
      </h1>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Upload Panel */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl mb-4 font-semibold">Upload Disaster Image</h2>

          <UploadBox setFile={setFile} />

          <button
            onClick={handleUpload}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 py-2 rounded font-semibold"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Results Panel */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl mb-4 font-semibold">Detection Output</h2>

          {loading && (
            <p className="text-gray-400">Processing image...</p>
          )}

          <ResultPanel result={result} />
        </div>

      </div>
    </main>
  );
}