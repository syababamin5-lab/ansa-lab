import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
  onSaveSignature: (base64Url: string) => void;
  onClearSignature?: () => void;
  height?: number;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSaveSignature,
  onClearSignature,
  height = 160
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#0f172a'; // dark slate
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw baseline
    drawGuideLine(ctx, rect.width, height);
  }, [height]);

  const drawGuideLine = (ctx: CanvasRenderingContext2D, width: number, h: number) => {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#cbd5e1'; // light slate
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, h - 25);
    ctx.lineTo(width - 15, h - 25);
    ctx.stroke();
    ctx.restore();
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSignature) setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && hasSignature) {
        onSaveSignature(canvas.toDataURL('image/png'));
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGuideLine(ctx, rect.width, height);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    setHasSignature(false);
    onSaveSignature('');
    if (onClearSignature) onClearSignature();
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-white shadow-2xs group focus-within:border-emerald-500 transition-colors">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ height: `${height}px` }}
          className="w-full touch-none cursor-crosshair block bg-transparent"
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1 select-none">
            <PenTool className="w-5 h-5 opacity-60 animate-bounce" />
            <span className="text-xs font-semibold">Goreskan Tanda Tangan Digital Anda Di Sini</span>
          </div>
        )}

        {hasSignature && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Tersetuju
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500 font-medium">
          Gunakan jari di HP atau mouse di komputer
        </span>
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasSignature}
          className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Hapus &amp; Ulangi</span>
        </button>
      </div>
    </div>
  );
};
