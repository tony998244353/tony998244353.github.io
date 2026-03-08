import { useEffect, useRef, useCallback } from 'react';
import { createDragonRenderer } from '../lib/dragon-curve';

interface Props {
  scrollY: number;
}

const SCROLL_PER_LEVEL = 250; // px per √2x zoom

export function DragonCurveCanvas({ scrollY }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ReturnType<typeof createDragonRenderer> | null>(null);
  const rafRef = useRef(0);

  const draw = useCallback((sy: number) => {
    rafRef.current = 0;
    if (!rendererRef.current) return;

    // scrollY → zoom and angleOffset
    const levels = sy / SCROLL_PER_LEVEL; // fractional number of √2 steps
    const angleOffset = Math.floor(levels) % 8;
    const frac = levels - Math.floor(levels);
    const zoom = Math.pow(Math.SQRT2, frac); // [1, √2)

    rendererRef.current.render(zoom, (angleOffset + 8) % 8);
  }, []);

  const scrollYRef = useRef(scrollY);
  scrollYRef.current = scrollY;

  const requestDraw = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => draw(scrollYRef.current));
    }
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const renderer = createDragonRenderer(canvas);
    rendererRef.current = renderer;
    draw(scrollY);

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
  }, [draw, requestDraw, scrollY]);

  useEffect(() => {
    requestDraw();
  }, [scrollY, requestDraw]);

  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }} />
  );
}
