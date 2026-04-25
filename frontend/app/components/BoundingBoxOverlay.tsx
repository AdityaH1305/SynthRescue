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
  // ADDED CODE START — Highlight selected box
  selectedDetectionId?: number | null;
  // ADDED CODE END
}

const TIER_COLORS: Record<string, { stroke: string; fill: string; glow: string }> = {
  strong: {
    stroke: "#00e5ff",
    fill: "rgba(0, 229, 255, 0.08)",
    glow: "rgba(0, 229, 255, 0.4)",
  },
  weak: {
    stroke: "#ffab00",
    fill: "rgba(255, 171, 0, 0.06)",
    glow: "rgba(255, 171, 0, 0.3)",
  },
};

const DEFAULT_COLOR = {
  stroke: "#00e5ff",
  fill: "rgba(0, 229, 255, 0.06)",
  glow: "rgba(0, 229, 255, 0.3)",
};

const CORNER_SIZE = 8;
const LINE_WIDTH = 1.5;

export default function BoundingBoxOverlay({
  imageSrc,
  boxes,
  imageWidth,
  imageHeight,
  // ADDED CODE START — Destructure highlight prop
  selectedDetectionId = null,
  // ADDED CODE END
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

      for (let boxIndex = 0; boxIndex < boxes.length; boxIndex++) {
        const box = boxes[boxIndex];
        const bx = box.x * scaleX;
        const by = box.y * scaleY;
        const bw = box.w * scaleX;
        const bh = box.h * scaleY;

        const colors = TIER_COLORS[box.tier ?? ""] ?? DEFAULT_COLOR;

        // ADDED CODE START — Check if this box is the highlighted one
        const isHighlighted = selectedDetectionId === boxIndex;
        // ADDED CODE END

        // Subtle fill
        // ADDED CODE START — Brighter fill when highlighted
        if (isHighlighted) {
          ctx.fillStyle = box.tier === "weak"
            ? "rgba(255, 171, 0, 0.18)"
            : "rgba(0, 229, 255, 0.18)";
        } else {
          ctx.fillStyle = colors.fill;
        }
        // ADDED CODE END
        ctx.fillRect(bx, by, bw, bh);

        // Thin targeting border
        ctx.strokeStyle = colors.stroke;
        // ADDED CODE START — Thicker border when highlighted
        ctx.lineWidth = isHighlighted ? 3 : LINE_WIDTH;
        // ADDED CODE END
        ctx.setLineDash(isHighlighted ? [] : [4, 3]);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.setLineDash([]);

        // ADDED CODE START — Extra glow on highlighted box
        if (isHighlighted) {
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = 16;
          ctx.strokeRect(bx, by, bw, bh);
          ctx.shadowBlur = 0;
        }
        // ADDED CODE END

        // Corner crosshairs — top-left
        ctx.lineWidth = 2;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 6;
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(bx, by + CORNER_SIZE);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + CORNER_SIZE, by);
        ctx.stroke();

        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(bx + bw - CORNER_SIZE, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + CORNER_SIZE);
        ctx.stroke();

        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - CORNER_SIZE);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + CORNER_SIZE, by + bh);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(bx + bw - CORNER_SIZE, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - CORNER_SIZE);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Small center crosshair
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy);
        ctx.lineTo(cx + 4, cy);
        ctx.moveTo(cx, cy - 4);
        ctx.lineTo(cx, cy + 4);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Label
        const conf = box.confidence != null ? ` ${(box.confidence * 100).toFixed(0)}%` : "";
        const labelText = `${box.label}${conf}`;

        ctx.font = "bold 10px 'Geist Mono', 'Courier New', monospace";
        const metrics = ctx.measureText(labelText);
        const labelH = 16;
        const labelW = metrics.width + 10;

        // Label background
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(bx, by - labelH - 2, labelW, labelH);

        // Label left accent bar
        ctx.fillStyle = colors.stroke;
        ctx.fillRect(bx, by - labelH - 2, 2, labelH);

        // Label text
        ctx.fillStyle = colors.stroke;
        ctx.fillText(labelText, bx + 6, by - 6);
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
  }, [boxes, imageWidth, imageHeight, imageSrc, selectedDetectionId]);

  return (
    <div className="relative rounded-none overflow-hidden border border-cyan-glow/20 bg-black">
      {/* Tactical corner marks */}
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyan-glow z-20" />
      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-glow z-20" />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-cyan-glow z-20" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-glow z-20" />

      {/* Feed label */}
      <div className="absolute top-2 left-7 z-20 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider">
          LIVE DETECTION FEED
        </span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Detection preview"
        className="w-full max-h-[50vh] object-contain bg-black"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Legend */}
      {boxes.length > 0 && (
        <div className="absolute bottom-2 right-7 flex gap-2 z-20">
          <span className="text-[9px] bg-black/80 text-cyan-glow px-2 py-0.5 rounded-none font-mono border border-cyan-glow/20">
            ■ CONFIRMED ≥50%
          </span>
          <span className="text-[9px] bg-black/80 text-amber-alert px-2 py-0.5 rounded-none font-mono border border-amber-alert/20">
            ■ POSSIBLE 30-50%
          </span>
        </div>
      )}
    </div>
  );
}
