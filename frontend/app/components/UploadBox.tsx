"use client";

import { useCallback, useState } from "react";

interface UploadBoxProps {
  onFileSelected: (file: File) => void;
}

export default function UploadBox({ onFileSelected }: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (JPEG, PNG, etc.).");
        return;
      }
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center
        transition-all duration-200 cursor-pointer
        ${
          dragActive
            ? "border-red-400 bg-red-500/10"
            : "border-gray-600 hover:border-gray-400 bg-gray-800/40"
        }
      `}
    >
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="pointer-events-none">
        <div className="text-4xl mb-3">📷</div>
        {fileName ? (
          <p className="text-sm text-emerald-400 font-medium">{fileName}</p>
        ) : (
          <>
            <p className="text-sm text-gray-300 font-medium">
              Drag &amp; drop a disaster image here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse · JPEG, PNG supported
            </p>
          </>
        )}
      </div>
    </div>
  );
}