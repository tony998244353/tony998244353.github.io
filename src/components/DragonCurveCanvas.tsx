import { useEffect, useRef, useCallback } from 'react';
import { createDragonRenderer } from '../lib/dragon-curve';

export function DragonCurveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ReturnType<typeof createDragonRenderer> | null>(null);
  const zoomRef = useRef(1);
  const angleOffsetRef = useRef(0);
  const rafRef = useRef(0);

  const draw = useCallback(() => {
    rafRef.current = 0;
    rendererRef.current?.render(zoomRef.current, angleOffsetRef.current);
  }, []);

  const requestDraw = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const renderer = createDragonRenderer(canvas);
    rendererRef.current = renderer;
    draw();

    const onResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
      requestDraw();
    };
    window.addEventListener('resize', onResize);
    return () => {
      renderer.dispose();
      rendererRef.current = null;
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw, requestDraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = Math.min(Math.abs(e.deltaY), 100) / 100 * 0.32;
      zoomRef.current *= e.deltaY > 0 ? 1 / (1 + step) : 1 + step;
      // Wrap: zoom cycles with period √2x, rotate 45° each wrap
      while (zoomRef.current >= Math.SQRT2) {
        zoomRef.current /= Math.SQRT2;
        angleOffsetRef.current = (angleOffsetRef.current + 1) % 8;
      }
      while (zoomRef.current < 1) {
        zoomRef.current *= Math.SQRT2;
        angleOffsetRef.current = (angleOffsetRef.current + 7) % 8; // -1 mod 8
      }
      requestDraw();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [requestDraw]);

  return (
    <canvas ref={canvasRef} style={{ display: 'block', width: '100vw', height: '100vh' }} />
  );
}
