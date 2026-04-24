"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, Upload, CheckCircle } from "lucide-react";

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
    <motion.div
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
      animate={{
        borderColor: dragActive
          ? "rgba(0, 229, 255, 0.7)"
          : "rgba(0, 229, 255, 0.15)",
        boxShadow: dragActive
          ? "0 0 30px rgba(0, 229, 255, 0.15), inset 0 0 30px rgba(0, 229, 255, 0.05)"
          : "0 0 0px rgba(0, 229, 255, 0), inset 0 0 0px rgba(0, 229, 255, 0)",
      }}
      transition={{ duration: 0.3 }}
      className={`
        relative border-2 border-dashed rounded-none p-8 text-center
        cursor-pointer bg-slate-950/60
        ${dragActive ? "animate-borderPulse" : ""}
      `}
    >
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      {/* Scanning crosshair corners */}
      <div className="absolute top-2 left-2 w-5 h-5 border-t border-l border-cyan-glow/40" />
      <div className="absolute top-2 right-2 w-5 h-5 border-t border-r border-cyan-glow/40" />
      <div className="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-cyan-glow/40" />
      <div className="absolute bottom-2 right-2 w-5 h-5 border-b border-r border-cyan-glow/40" />

      <div className="pointer-events-none relative z-10">
        {fileName ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <p className="text-sm text-emerald-400 font-mono font-medium tracking-wide">
              {fileName}
            </p>
            <p className="text-[10px] text-cyan-glow/40 font-mono uppercase tracking-wider">
              FILE LOADED — READY FOR SCAN
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Crosshair className="w-10 h-10 text-cyan-glow/60 mx-auto mb-3" />
            </motion.div>
            <p className="text-sm text-slate-300 font-mono tracking-wide">
              DROP IMAGERY FOR ANALYSIS
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-wider">
              DRAG & DROP OR CLICK · JPEG / PNG ACCEPTED
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Upload className="w-3.5 h-3.5 text-cyan-glow/30" />
              <span className="text-[10px] font-mono text-cyan-glow/30 uppercase tracking-widest">
                Awaiting Input
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}