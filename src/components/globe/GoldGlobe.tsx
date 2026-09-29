'use client';

import { useEffect, useRef, useState } from 'react';
import { geoCentroid, geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import type { GeoPermissibleObjects } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { GLOBE_COLORS, GlobeEntry, entryFill } from '@/lib/globe';

interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: { name: string };
  geometry: GeoJSON.Geometry;
}

interface GoldGlobeProps {
  entries: GlobeEntry[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  spinning: boolean;
  // Bumped on every pick, so choosing the same country again turns the globe back to it.
  focusKey: number;
}

// Degrees per second of auto-rotation, and how long a click-to-focus turn takes.
const SPIN_SPEED = 6;
const FOCUS_MS = 900;
const MAX_SPIKE = 0.32;

type Rotation = [number, number];

function shortestTurn(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

export function GoldGlobe({ entries, selectedId, hoveredId, onHover, onSelect, spinning, focusKey }: GoldGlobeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countries, setCountries] = useState<CountryFeature[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Mutable animation state lives in refs so the render loop never restarts.
  const rotation = useRef<Rotation>([-45, -28]);
  const focus = useRef<{ from: Rotation; to: Rotation; start: number } | null>(null);
  const drag = useRef<{ x: number; y: number; rot: Rotation; moved: boolean } | null>(null);
  const size = useRef({ w: 0, h: 0, r: 0 });
  // Skip drawing while the globe is scrolled out of view.
  const onScreen = useRef(true);
  const props = useRef({ entries, selectedId, hoveredId, spinning });
  useEffect(() => {
    props.current = { entries, selectedId, hoveredId, spinning };
  }, [entries, selectedId, hoveredId, spinning]);

  useEffect(() => {
    let cancelled = false;
    import('world-atlas/countries-110m.json')
      .then((mod) => {
        if (cancelled) return;
        const topology = (mod.default ?? mod) as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
        const collection = feature(topology, topology.objects.countries);
        setCountries(collection.features as unknown as CountryFeature[]);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Where each entry's spike stands: explicit coordinates, else the country's centroid.
  const anchors = useRef(new Map<string, [number, number]>());
  useEffect(() => {
    if (!countries) return;
    const map = new Map<string, [number, number]>();
    for (const e of entries) {
      if (e.lonLat) map.set(e.id, e.lonLat);
      else {
        const c = countries.find((f) => f.id === e.id);
        if (c) map.set(e.id, geoCentroid(c as GeoPermissibleObjects) as [number, number]);
      }
    }
    anchors.current = map;
  }, [countries, entries]);

  // Turn the globe to face the selected country.
  useEffect(() => {
    if (!selectedId) return;
    const target = anchors.current.get(selectedId);
    if (!target) return;
    const from = [...rotation.current] as Rotation;
    // Aim a little south of the country so its spike leans up and stays visible.
    const to: Rotation = [from[0] + shortestTurn(from[0], -target[0]), Math.max(-60, Math.min(60, -target[1] + 22))];
    focus.current = { from, to, start: performance.now() };
  }, [selectedId, focusKey, countries]);

  // Canvas sizing.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      size.current = { w, h, r: Math.min(w, h) / 2 - 22 };
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting;
    });
    visibility.observe(wrap);
    return () => {
      observer.disconnect();
      visibility.disconnect();
    };
  }, []);

  // Render loop.
  useEffect(() => {
    if (!countries) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const graticule = geoGraticule10();
    let frame = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      if (!onScreen.current) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const { entries, selectedId, hoveredId, spinning } = props.current;
      const { w, h, r } = size.current;

      if (focus.current) {
        const t = Math.min((now - focus.current.start) / FOCUS_MS, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        const { from, to } = focus.current;
        rotation.current = [from[0] + (to[0] - from[0]) * ease, from[1] + (to[1] - from[1]) * ease];
        if (t >= 1) focus.current = null;
      } else if (spinning && !drag.current && !hoveredId && !reduceMotion) {
        rotation.current = [rotation.current[0] + SPIN_SPEED * dt, rotation.current[1]];
      }

      ctx.clearRect(0, 0, w, h);
      if (r <= 0) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const cx = w / 2;
      const cy = h / 2;
      const projection = geoOrthographic().rotate(rotation.current).scale(r).translate([cx, cy]).clipAngle(90);
      const path = geoPath(projection, ctx);

      // Halo.
      const halo = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.12);
      halo.addColorStop(0, GLOBE_COLORS.rim);
      halo.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.12, 0, Math.PI * 2);
      ctx.fill();

      // Ocean with a light source top-left.
      const ocean = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
      ocean.addColorStop(0, '#1c1c22');
      ocean.addColorStop(1, GLOBE_COLORS.ocean);
      ctx.fillStyle = ocean;
      ctx.beginPath();
      path({ type: 'Sphere' });
      ctx.fill();

      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = GLOBE_COLORS.graticule;
      ctx.lineWidth = 0.6;
      ctx.stroke();

      const byId = new Map(entries.map((e) => [e.id, e]));
      const maxAbs = Math.max(1, ...entries.map((e) => Math.abs(e.tonnes)));

      for (const c of countries) {
        const entry = byId.get(c.id);
        ctx.beginPath();
        path(c as GeoPermissibleObjects);
        ctx.fillStyle = entry ? entryFill(entry.tonnes, maxAbs) : GLOBE_COLORS.land;
        ctx.fill();
        const active = entry && (entry.id === hoveredId || entry.id === selectedId);
        ctx.strokeStyle = active ? '#ffffff' : GLOBE_COLORS.border;
        ctx.lineWidth = active ? 1.5 : 0.5;
        ctx.stroke();
      }

      // Spikes, drawn back to front so nearer ones overlap farther ones.
      const center: [number, number] = [-rotation.current[0], -rotation.current[1]];
      const visible = entries
        .map((e) => ({ e, at: anchors.current.get(e.id) }))
        .filter((x): x is { e: GlobeEntry; at: [number, number] } => !!x.at && geoDistance(x.at, center) < Math.PI / 2 - 0.05)
        .sort((a, b) => geoDistance(b.at, center) - geoDistance(a.at, center));

      for (const { e, at } of visible) {
        const height = 0.04 + MAX_SPIKE * Math.sqrt(Math.abs(e.tonnes) / maxAbs);
        const base = projection(at);
        const top = geoOrthographic().rotate(rotation.current).scale(r * (1 + height)).translate([cx, cy]).clipAngle(90)(at);
        if (!base || !top) continue;
        const color = e.tonnes >= 0 ? GLOBE_COLORS.buy : GLOBE_COLORS.sell;
        const active = e.id === hoveredId || e.id === selectedId;
        const gradient = ctx.createLinearGradient(base[0], base[1], top[0], top[1]);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, active ? '#ffffff' : color);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = active ? 4 : 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(base[0], base[1]);
        ctx.lineTo(top[0], top[1]);
        ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : color;
        ctx.beginPath();
        ctx.arc(top[0], top[1], active ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Terminator-style shading towards the rim.
      const shade = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
      shade.addColorStop(0, 'rgba(0,0,0,0)');
      shade.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = shade;
      ctx.beginPath();
      path({ type: 'Sphere' });
      ctx.fill();

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [countries]);

  /** Entry under a canvas point: a spike's tip or base, else the country polygon. */
  const entryAt = (clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !countries) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { w, h, r } = size.current;
    const cx = w / 2;
    const cy = h / 2;
    const projection = geoOrthographic().rotate(rotation.current).scale(r).translate([cx, cy]).clipAngle(90);
    const center: [number, number] = [-rotation.current[0], -rotation.current[1]];
    const maxAbs = Math.max(1, ...entries.map((e) => Math.abs(e.tonnes)));

    for (const e of entries) {
      const at = anchors.current.get(e.id);
      if (!at || geoDistance(at, center) >= Math.PI / 2 - 0.05) continue;
      const height = 0.04 + MAX_SPIKE * Math.sqrt(Math.abs(e.tonnes) / maxAbs);
      const base = projection(at);
      const top = geoOrthographic().rotate(rotation.current).scale(r * (1 + height)).translate([cx, cy]).clipAngle(90)(at);
      if (!base || !top) continue;
      // Distance from the point to the spike segment.
      const vx = top[0] - base[0];
      const vy = top[1] - base[1];
      const len2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((x - base[0]) * vx + (y - base[1]) * vy) / len2));
      const dx = x - (base[0] + t * vx);
      const dy = y - (base[1] + t * vy);
      if (dx * dx + dy * dy < 64) return e.id;
    }

    if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) return null;
    const lonLat = projection.invert?.([x, y]);
    if (!lonLat) return null;
    const ids = new Set(entries.map((e) => e.id));
    const hit = countries.find((c) => ids.has(c.id) && geoContains(c as GeoPermissibleObjects, lonLat));
    return hit?.id ?? null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, rot: [...rotation.current] as Rotation, moved: false };
    focus.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
      if (d.moved) {
        const k = 90 / Math.max(size.current.r, 1);
        rotation.current = [d.rot[0] + dx * k, Math.max(-60, Math.min(60, d.rot[1] - dy * k))];
        return;
      }
    }
    if (e.pointerType === 'mouse') onHover(entryAt(e.clientX, e.clientY));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (d && !d.moved) {
      const id = entryAt(e.clientX, e.clientY);
      if (id) onSelect(id);
    }
  };

  return (
    <div ref={wrapRef} className="relative aspect-square w-full max-h-[560px]">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Globe of central-bank gold buying and selling. The same figures are listed beside it."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => onHover(null)}
        className={`absolute inset-0 touch-none ${hoveredId ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
      />
      {!countries && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
          {failed ? 'The globe could not load.' : 'Loading globe…'}
        </div>
      )}
    </div>
  );
}
