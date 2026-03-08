const COLORS = ['#FFFFFF', '#97BE0D', '#799C13', '#FFEC00'];

export interface DragonRenderer {
  render(zoom: number, angleOffset: number): void;
  resize(w: number, h: number): void;
  dispose(): void;
}

export function createDragonRenderer(canvas: HTMLCanvasElement): DragonRenderer {
  const ctx = canvas.getContext('2d')!;

  return {
    render(zoom: number, angleOffset: number) {
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#0A1026';
      ctx.fillRect(0, 0, w, h);

      // Level is fixed (zoom wraps at √2, so levelOffset is always 0)
      const baseLevel = 16;

      // Generate dragon curves for current level and next level
      const pts0: number[] = [0, 0];
      dragon(pts0, 0, 0, 1, 0, 1, 0, baseLevel);
      const pts1: number[] = [0, 0];
      dragon(pts1, 0, 0, 1, 0, 1, 0, baseLevel + 1);

      // Compute max extent (symmetric for all rotations)
      let maxR = 0;
      for (let i = 0; i < pts1.length; i += 2) {
        maxR = Math.max(maxR, Math.abs(pts1[i]), Math.abs(pts1[i + 1]));
      }

      // Auto-fit to canvas with (0,0) at center
      const margin = 40;
      const s = Math.min(w / 2 - margin, h / 2 - margin) / (maxR || 1) * 8 * zoom;
      const cx = w / 2, cy = h / 2;
      const baseAngle = -angleOffset * Math.PI / 4;

      // Draw both levels, each with 4 rotations
      const layers = [pts0, pts1];
      for (const pts of layers) {
        ctx.lineWidth = 1;
        for (let rot = 0; rot < 4; rot++) {
          const a = rot * Math.PI / 2 + baseAngle;
          const c = Math.cos(a), sn = Math.sin(a);
          ctx.strokeStyle = COLORS[rot];
          ctx.beginPath();
          ctx.moveTo(pts[0] * c * s - pts[1] * sn * s + cx, pts[0] * sn * s + pts[1] * c * s + cy);
          for (let i = 2; i < pts.length; i += 2) {
            const x = pts[i], y = pts[i + 1];
            ctx.lineTo(x * c * s - y * sn * s + cx, x * sn * s + y * c * s + cy);
          }
          ctx.stroke();
        }
      }
    },

    resize(w: number, h: number) { canvas.width = w; canvas.height = h; },
    dispose() {},
  };
}

function dragon(
  pts: number[], ax: number, ay: number, bx: number, by: number,
  sign: number, lv: number, target: number,
) {
  if (lv >= target) { pts.push(bx, by); return; }
  const mx = (ax + bx) / 2 + sign * (by - ay) / 2;
  const my = (ay + by) / 2 - sign * (bx - ax) / 2;
  dragon(pts, ax, ay, mx, my, 1, lv + 1, target);
  dragon(pts, mx, my, bx, by, -1, lv + 1, target);
}
