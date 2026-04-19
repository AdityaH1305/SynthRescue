"use client";

import { useEffect, useRef } from "react";

interface Box {
  label: string;
  confidence?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  tier?: string;
}

interface BoundingBoxOverlayProps {
  imageSrc: string;
  boxes: Box[];
  imageWidth: number;
  imageHeight: number;
}

const TIER_COLORS: Record<string, { stroke: string; fill: string }> = {
  strong: { stroke: "#22c55e", fill: "rgba(34, 197, 94, 0.15)" },
  weak: { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.10)" },
};

const DEFAULT_COLOR = { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.12)" };

export default function BoundingBoxOverlay({
  imageSrc,
  boxes,
  imageWidth,
  imageHeight,
}: BoundingBoxOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Match canvas to displayed image size
      const displayW = img.clientWidth;
      const displayH = img.clientHeight;
      canvas.width = displayW;
      canvas.height = displayH;

      // Scale factors from original image → displayed size
      const scaleX = imageWidth > 0 ? displayW / imageWidth : 1;
      const scaleY = imageHeight > 0 ? displayH / imageHeight : 1;

      ctx.clearRect(0, 0, displayW, displayH);

      for (const box of boxes) {
        const bx = box.x * scaleX;
        const by = box.y * scaleY;
        const bw = box.w * scaleX;
        const bh = box.h * scaleY;

        const colors = TIER_COLORS[box.tier ?? ""] ?? DEFAULT_COLOR;

        // Fill
        ctx.fillStyle = colors.fill;
        ctx.fillRect(bx, by, bw, bh);

        // Border
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Label
        const conf = box.confidence != null ? ` ${(box.confidence * 100).toFixed(0)}%` : "";
        const labelText = `${box.label}${conf}`;

        ctx.font = "bold 12px system-ui, sans-serif";
        const metrics = ctx.measureText(labelText);
        const labelH = 18;
        const labelW = metrics.width + 8;

        // Label background
        ctx.fillStyle = colors.stroke;
        ctx.fillRect(bx, by - labelH, labelW, labelH);

        // Label text
        ctx.fillStyle = "#fff";
        ctx.fillText(labelText, bx + 4, by - 5);
      }
    };

    // Draw after image loads (or immediately if cached)
    if (img.complete) {
      draw();
    } else {
      img.addEventListener("load", draw);
    }

    // Redraw on resize
    const observer = new ResizeObserver(draw);
    observer.observe(img);

    return () => {
      img.removeEventListener("load", draw);
      observer.disconnect();
    };
  }, [boxes, imageWidth, imageHeight, imageSrc]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-700">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Detection preview"
        className="w-full max-h-80 object-contain bg-black"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      {/* Legend */}
      {boxes.length > 0 && (
        <div className="absolute bottom-2 right-2 flex gap-2">
          <span className="text-[10px] bg-black/70 text-emerald-400 px-2 py-0.5 rounded">
            ● Strong ≥50%
          </span>
          <span className="text-[10px] bg-black/70 text-amber-400 px-2 py-0.5 rounded">
            ● Weak 30-50%
          </span>
        </div>
      )}
    </div>
  );
}
