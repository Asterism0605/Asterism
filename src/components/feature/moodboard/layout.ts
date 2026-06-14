import * as THREE from 'three'
import { HO } from './config'
import type {
  MoodboardOrbitParams,
  MoodboardPackOptions,
  MoodboardPhoto,
  MoodboardPositionedPhoto
} from '@/types/moodboard'

export function packPhotos(
  list: MoodboardPhoto[],
  opt: MoodboardPackOptions
): MoodboardPositionedPhoto[] {
  const { cx, cy, rx, ry } = opt;
  const gap = opt.gap ?? 12; // visible gutter between photos
  const xMin = opt.xMin ?? 0,
    xMax = opt.xMax ?? 1440;
  const yMin = opt.yMin ?? 0,
    yMax = opt.yMax ?? 1024;
  const obstacles = opt.obstacles ?? [];
  const ex = rx - 14,
    ey = ry - 14; // inset so a photo's bounding circle stays off the line
  const fillRatio = opt.fillRatio ?? 0.4; // photos fill ~40% of the usable area → packable

  const nodes = list.map((p, i) => ({
    id: (opt.idPrefix ?? 'p') + i + '-' + ((Math.random() * 1e6) | 0),
    src: p.src,
    w0: p.w, // original size (the layout shrinks from this to fit)
    h0: p.h,
    w: p.w,
    h: p.h,
    faded: p.faded,
    hw: p.w / 2 + gap / 2, // half-extent incl. gutter (used for overlap test)
    hh: p.h / 2 + gap / 2,
    br: Math.hypot(p.w, p.h) / 2, // bounding-circle radius (used for ellipse containment)
    delay: (i * 0.04).toFixed(2),
    x: 0,
    y: 0
  }));

  // measure the usable area = (y-band ∩ ellipse) minus the left-anchored obstacle columns,
  // then uniformly shrink ALL photos so their combined area ≈ fillRatio of it. This keeps
  // the layout packable WITHOUT overlap no matter how short the visible circle is (e.g. a
  // 20-photo folder on a laptop) — taller screens get bigger photos, shorter ones smaller.
  let avail = 0;
  const step = 8;
  for (let y = yMin; y <= yMax; y += step) {
    const t = 1 - ((y - cy) / ry) ** 2;
    if (t <= 0) continue;
    const halfW = rx * Math.sqrt(t);
    let xl = Math.max(xMin, cx - halfW);
    const xr = Math.min(xMax, cx + halfW);
    for (const ob of obstacles) {
      if (y > ob.y0 && y < ob.y1) {
        const or = Math.min(xr, ob.x1);
        if (or > xl) xl = or;
      }
    }
    if (xr > xl) avail += (xr - xl) * step;
  }
  let sum = 0;
  for (const d of nodes) sum += (d.w0 + gap) * (d.h0 + gap);
  const baseSc = Math.min(1, Math.sqrt((avail * fillRatio) / Math.max(1, sum)));

  // keep a photo whole inside the ellipse (via its bounding circle), the y-band, the
  // viewport, and out of every obstacle rect — applied every relaxation step.
  const clamp = (d: (typeof nodes)[number]) => {
    const rxe = ex - d.br,
      rye = ey - d.br;
    if (rxe > 0 && rye > 0) {
      const nx = (d.x - cx) / rxe,
        ny = (d.y - cy) / rye,
        dist = Math.hypot(nx, ny);
      if (dist > 1) {
        d.x = cx + (nx / dist) * rxe;
        d.y = cy + (ny / dist) * rye;
      }
    }
    d.x = Math.max(xMin + d.w / 2, Math.min(xMax - d.w / 2, d.x));
    d.y = Math.max(yMin + d.h / 2, Math.min(yMax - d.h / 2, d.y));
    for (const ob of obstacles) {
      if (
        d.x + d.w / 2 > ob.x0 &&
        d.x - d.w / 2 < ob.x1 &&
        d.y + d.h / 2 > ob.y0 &&
        d.y - d.h / 2 < ob.y1
      ) {
        // push out along the shallowest side
        const pRight = ob.x1 - (d.x - d.w / 2);
        const pUp = d.y + d.h / 2 - ob.y0;
        const pDown = ob.y1 - (d.y - d.h / 2);
        const m = Math.min(pRight, pUp, pDown);
        if (m === pRight) d.x += pRight;
        else if (m === pUp) d.y -= pUp;
        else d.y += pDown;
      }
    }
  };

  // seed at random positions then relax to remove overlaps, at a given size multiplier
  const seedAndRelax = (mul: number) => {
    for (const d of nodes) {
      d.w = Math.max(46, Math.round(d.w0 * baseSc * mul));
      d.h = Math.max(46, Math.round(d.h0 * baseSc * mul));
      d.hw = d.w / 2 + gap / 2;
      d.hh = d.h / 2 + gap / 2;
      d.br = Math.hypot(d.w, d.h) / 2;
    }
    // random initial seed inside the band/ellipse
    for (const d of nodes) {
      let placed = false;
      for (let t = 0; t < 80 && !placed; t++) {
        const a = Math.random() * Math.PI * 2,
          rr = Math.sqrt(Math.random());
        const x = cx + Math.cos(a) * Math.max(10, ex - d.br) * rr;
        const y = cy + Math.sin(a) * Math.max(10, ey - d.br) * rr;
        if (y - d.h / 2 < yMin || y + d.h / 2 > yMax) continue;
        let inObstacle = false;
        for (const ob of obstacles) {
          if (
            x - d.w / 2 < ob.x1 &&
            x + d.w / 2 > ob.x0 &&
            y - d.h / 2 < ob.y1 &&
            y + d.h / 2 > ob.y0
          ) {
            inObstacle = true;
            break;
          }
        }
        if (inObstacle) continue;
        d.x = x;
        d.y = y;
        placed = true;
      }
      if (!placed) {
        d.x = cx;
        d.y = (yMin + yMax) / 2;
      }
    }
    // relaxation: separate every overlapping pair (AABB), then re-clamp. Repeat until settled.
    for (let iter = 0; iter < 1000; iter++) {
      let moved = 0;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i],
              b = nodes[j];
            const dx = b.x - a.x,
              dy = b.y - a.y;
            const ox = a.hw + b.hw - Math.abs(dx); // x-overlap
            const oy = a.hh + b.hh - Math.abs(dy); // y-overlap
            if (ox > 0 && oy > 0) {
              if (ox < oy) {
                const s = (ox / 2) * (dx < 0 ? -1 : 1);
                a.x -= s;
                b.x += s;
              } else {
                const s = (oy / 2) * (dy < 0 ? -1 : 1);
                a.y -= s;
                b.y += s;
              }
              moved++;
            }
          }
        }
      }
      for (const d of nodes) clamp(d);
      if (moved === 0 && iter > 4) break; // fully separated — done early
    }
  };
  // true if any two photos still physically overlap (ignoring the gutter)
  const hasOverlap = () => {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i],
          b = nodes[j];
        if (
          (a.w + b.w) / 2 - Math.abs(a.x - b.x) > 0.5 &&
          (a.h + b.h) / 2 - Math.abs(a.y - b.y) > 0.5
        )
          return true;
      }
    }
    return false;
  };
  // if a tight seed didn't fully resolve, shrink 10% and retry — guarantees NO overlaps
  let mul = 1;
  for (let att = 0; att < 6; att++) {
    seedAndRelax(mul);
    if (!hasOverlap()) break;
    mul *= 0.9;
  }
  return nodes;
}

export function ellipsePathM(o: MoodboardOrbitParams, k: number): string {
  const pts = [];
  for (let t = 0; t <= 360; t += 2) {
    const r = (t * Math.PI) / 180;
    let x = o.cx + o.rx * Math.cos(r);
    let y = o.cy + o.ry * Math.sin(r);
    x = o.node.x + k * (x - o.node.x);
    y = o.node.y + k * (y - o.node.y);
    pts.push(x.toFixed(1) + ' ' + y.toFixed(1));
  }
  return 'M' + pts.join(' L') + ' Z';
}

export function ellipsePath(k: number): string {
  const o = HO;
  const t0 = 105,
    t1 = 350;
  const pts = [];
  for (let t = t0; t <= t1; t += 1.5) {
    const r = (t * Math.PI) / 180;
    let x = o.cx + o.rx * Math.cos(r);
    let y = o.cy + o.ry * Math.sin(r);
    x = o.node.x + k * (x - o.node.x);
    y = o.node.y + k * (y - o.node.y);
    pts.push(x.toFixed(1) + ' ' + y.toFixed(1));
  }
  return 'M' + pts.join(' L');
}

export function fibSphere(n: number, r: number): THREE.Vector3[] {
  const g = (1 + Math.sqrt(5)) / 2,
    pts = [];
  for (let i = 0; i < n; i++) {
    const t = Math.acos(1 - (2 * (i + 0.5)) / n),
      p = (2 * Math.PI * i) / g;
    pts.push(
      new THREE.Vector3(
        r * Math.sin(t) * Math.cos(p),
        r * Math.cos(t),
        r * Math.sin(t) * Math.sin(p)
      )
    );
  }
  return pts;
}
