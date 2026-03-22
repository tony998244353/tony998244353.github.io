const COLORS = ['#1565C0', '#4CAF50', '#1565C0', '#4CAF50'];

export interface DragonRenderer {
  render(zoom: number, angleOffset: number): void;
  resize(w: number, h: number): void;
  dispose(): void;
}

export function createDragonRenderer(canvas: HTMLCanvasElement): DragonRenderer {
  const ctx = canvas.getContext('2d')!;

  // Pre-compute dragon curve geometry (baseLevel is fixed, never changes)
  const baseLevel = 16;
  let maxR = 0;
  const path0 = new Path2D();
  const path1 = new Path2D();
  {
    const pts0: number[] = [0, 0];
    dragon(pts0, 0, 0, 1, 0, 1, 0, baseLevel);
    path0.moveTo(pts0[0], pts0[1]);
    for (let i = 2; i < pts0.length; i += 2) path0.lineTo(pts0[i], pts0[i + 1]);

    const pts1: number[] = [0, 0];
    dragon(pts1, 0, 0, 1, 0, 1, 0, baseLevel + 1);
    path1.moveTo(pts1[0], pts1[1]);
    for (let i = 2; i < pts1.length; i += 2) path1.lineTo(pts1[i], pts1[i + 1]);

    for (let i = 0; i < pts1.length; i += 2) {
      maxR = Math.max(maxR, Math.abs(pts1[i]), Math.abs(pts1[i + 1]));
    }
  }

  return {
    render(zoom: number, angleOffset: number) {
      const w = canvas.width, h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      const margin = 40;
      const s = Math.min(w / 2 - margin, h / 2 - margin) / (maxR || 1) * 8 * zoom;
      const cx = w / 2, cy = h / 2;
      const baseAngle = -angleOffset * Math.PI / 4;

      // Crossfade between levels
      const t = Math.log2(zoom) * 2; // [0, 1)
      const layers: [Path2D, number][] = [[path0, Math.cos(t * Math.PI / 2)], [path1, Math.sin(t * Math.PI / 2)]];
      for (const [path, alpha] of layers) {
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 3 / s;
        for (let rot = 0; rot < 4; rot++) {
          const a = rot * Math.PI / 2 + baseAngle;
          const cos_a = Math.cos(a), sin_a = Math.sin(a);
          ctx.setTransform(cos_a * s, sin_a * s, -sin_a * s, cos_a * s, cx, cy);
          ctx.strokeStyle = COLORS[rot];
          ctx.stroke(path);
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
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
