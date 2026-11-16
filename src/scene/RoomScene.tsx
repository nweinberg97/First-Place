import { useRef, type ReactElement } from 'react';
import type { Product, Slot, Unit, Vibe } from '../types';
import { SLOTS } from '../types';
import { ROOM, OWNED, PLACEHOLDER, laneOf } from '../data/room';
import { normalize } from '../fit/units';
import { fmtLen } from '../fit/units';
import type { Receipt } from '../fit/score';
import { ProductArt, RugArt } from './ProductArt';

export const PX = 2; // px per cm. One coordinate system for room + products.
export const X0 = 40;
export const FLOOR_Y = 30 + ROOM.wallHeight * PX; // 550
export const BASE_Y = FLOOR_Y + 16; // where floor-standing pieces touch the floor
export const VIEW = { w: 1040, h: 740 };
export const X = (cm: number) => X0 + cm * PX;

interface Props {
  uid: string;
  vibe: Vibe;
  products: Partial<Record<Slot, Product>>;
  positions: Record<Slot, number>;
  receipts?: Partial<Record<Slot, Receipt>>;
  selectedSlot?: Slot | null;
  showMeasurements?: boolean;
  unit?: Unit;
  doorWidth?: number;
  interactive?: boolean;
  animateKey?: number;
  swapKey?: Partial<Record<Slot, number>>;
  viewBox?: string;
  onSelect?: (s: Slot | null) => void;
  onMove?: (s: Slot, xCm: number) => void;
  className?: string;
  title?: string;
  quickSwap?: { label: string; index: number; count: number; onPrev: () => void; onNext: () => void; onMore: () => void };
}

const NOUN: Record<Slot, string> = { rug: 'rug', chair: 'chair', lamp: 'lamp', 'side-table': 'side table', shelf: 'shelf', 'wall-art': 'art' };
const GHOST: Record<Slot, { x: number; w: number; h: number; wall?: boolean }> = {
  shelf: { x: 4, w: 70, h: 120 },
  'side-table': { x: 108, w: 42, h: 50 },
  lamp: { x: 366, w: 36, h: 150 },
  chair: { x: 400, w: 72, h: 80 },
  'wall-art': { x: 225, w: 70, h: 80, wall: true },
  rug: { x: 160, w: 200, h: 30 },
};

function dimsFor(p: Product) {
  return p.dimensions.source === 'missing' ? { ...PLACEHOLDER[p.slot], originalUnit: 'cm' as const } : normalize(p.dimensions);
}

export function itemBox(p: Product, x: number) {
  const d = dimsFor(p);
  const lane = laneOf(p);
  const w = d.width * PX;
  if (lane === 'wall') {
    const bottom = FLOOR_Y - (p.slot === 'shelf' ? ROOM.wallShelfBottom : ROOM.artBottom) * PX;
    const h = Math.max(8, d.height * PX);
    return { x: X(x), y: bottom - h, w, h, lane };
  }
  const h = d.height * PX;
  return { x: X(x), y: BASE_Y - h, w, h, lane };
}

export function RoomScene(props: Props) {
  const { uid, vibe, products, positions, receipts = {}, selectedSlot, showMeasurements, unit = 'cm', interactive, animateKey = 0, swapKey = {}, onSelect, onMove } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ slot: Slot; offsetCm: number; moved: boolean } | null>(null);
  const dark = vibe.id === 'den' || vibe.id === 'classy';

  const toCm = (clientX: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = 0;
    const m = svg.getScreenCTM();
    if (!m) return 0;
    return (pt.matrixTransform(m.inverse()).x - X0) / PX;
  };

  const rug = products.rug;
  const order: Slot[] = ['shelf', 'wall-art', 'side-table', 'lamp', 'chair'];

  return (
    <svg
      ref={svgRef}
      viewBox={props.viewBox ?? `0 0 ${VIEW.w} ${VIEW.h}`}
      className={props.className}
      role="img"
      aria-label={props.title ?? `${vibe.name} room preview`}
      xmlns="http://www.w3.org/2000/svg"
      onPointerMove={(e) => {
        if (!drag.current || !onMove) return;
        drag.current.moved = true;
        onMove(drag.current.slot, toCm(e.clientX) - drag.current.offsetCm);
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
      onClick={(e) => {
        if (interactive && e.target === e.currentTarget) onSelect?.(null);
      }}
      style={{ touchAction: interactive ? 'none' : undefined }}
    >
      <Defs uid={uid} vibe={vibe} />
      <Architecture uid={uid} vibe={vibe} doorWidth={props.doorWidth ?? ROOM.defaultDoorWidth} unit={unit} onBg={() => interactive && onSelect?.(null)} />

      {/* rug (floor, in front of the couch) */}
      {rug && (
        <g key={`rug-${rug.id}-${animateKey}-${swapKey.rug ?? 0}`} className="pop-in" style={{ animationDelay: '0ms' }}>
          <RugLayer uid={uid} p={rug} x={positions.rug ?? 0} selected={selectedSlot === 'rug'} warn={receipts.rug?.space.verdict === 'wont-fit'} interactive={interactive} onSelect={() => onSelect?.('rug')} />
        </g>
      )}

      {interactive && SLOTS.filter((sl) => !products[sl]).map((sl) => <Ghost key={`ghost-${sl}`} slot={sl} selected={selectedSlot === sl} onSelect={() => onSelect?.(sl)} />)}

      {renderItems(['lamp'])}
      <OwnedCouch vibe={vibe} />
      {renderItems(order.filter((o) => o !== 'lamp'))}

      <CoffeeTable vibe={vibe} />

      {showMeasurements && <Measurements products={products} positions={positions} unit={unit} />}

      {interactive && props.quickSwap && selectedSlot && products[selectedSlot] && <QuickSwap box={selectedSlot === 'rug' ? { x: X(positions.rug ?? 0), y: 560, w: dimsFor(products.rug!).width * PX, h: 120 } : itemBox(products[selectedSlot]!, positions[selectedSlot] ?? 0)} slot={selectedSlot} q={props.quickSwap} />}

      <rect x={0} y={0} width={VIEW.w} height={VIEW.h} fill={`url(#${uid}-vignette)`} pointerEvents="none" />
    </svg>
  );

  function renderItems(slots: Slot[]) {
    return slots.map((slot) => {
        const i = order.indexOf(slot);
        const p = products[slot];
        if (!p) return null;
        const box = itemBox(p, positions[slot] ?? 0);
        const r = receipts[slot];
        const missing = p.dimensions.source === 'missing';
        const warn = r && (r.space.verdict === 'wont-fit' || r.door.verdict === 'wont-get-through');
        const sel = selectedSlot === slot;
        return (
          <g
            key={`${slot}-${p.id}-${animateKey}-${swapKey[slot] ?? 0}`}
            className="drop-in"
            style={{ animationDelay: `${60 * (i + 1)}ms` }}
          >
            <g
              className={interactive ? 'scene-item' : undefined}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? 'button' : undefined}
              aria-label={interactive ? `${p.title} from ${p.merchant.name}. ${r?.overall ?? ''}` : undefined}
              onPointerDown={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                onSelect?.(slot);
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                drag.current = { slot, offsetCm: toCm(e.clientX) - (positions[slot] ?? 0), moved: false };
              }}
              onKeyDown={(e) => {
                if (!interactive) return;
                if (e.key === 'Enter' || e.key === ' ') onSelect?.(slot);
                if (e.key === 'ArrowLeft') onMove?.(slot, (positions[slot] ?? 0) - 5);
                if (e.key === 'ArrowRight') onMove?.(slot, (positions[slot] ?? 0) + 5);
              }}
            >
              {box.lane === 'floor' && <ellipse cx={box.x + box.w / 2} cy={BASE_Y} rx={box.w * 0.58} ry={7} fill="#000" opacity={0.18} />}
              <g transform={`translate(${box.x} ${box.y})`} opacity={missing ? 0.55 : 1}>
                <ProductArt slot={slot} variant={p.illustration.variant} w={box.w} h={box.h} colors={p.colors} uid={uid} dark={dark} />
              </g>
              {missing && (
                <g>
                  <rect x={box.x - 4} y={box.y - 4} width={box.w + 8} height={box.h + 8} rx={10} fill="none" stroke="#5A31F4" strokeWidth={2} strokeDasharray="6 5" />
                  <circle cx={box.x + box.w / 2} cy={box.y + box.h / 2} r={15} fill="#5A31F4" />
                  <text x={box.x + box.w / 2} y={box.y + box.h / 2 + 6} textAnchor="middle" fontSize={18} fontWeight={800} fill="#fff" fontFamily="Inter, system-ui, sans-serif">?</text>
                </g>
              )}
              {(sel || warn) && (
                <rect
                  x={box.x - 6}
                  y={box.y - 6}
                  width={box.w + 12}
                  height={box.h + 12}
                  rx={10}
                  fill="none"
                  stroke={warn ? '#D72C0D' : '#008060'}
                  strokeWidth={sel ? 2.5 : 2}
                  strokeDasharray={warn ? '7 5' : undefined}
                  className={sel ? 'sel-ring' : undefined}
                />
              )}
              {/* generous invisible hit area */}
              <rect x={box.x - 8} y={box.y - (box.lane === 'wall' && slot === 'shelf' ? 64 : 8)} width={box.w + 16} height={box.h + (box.lane === 'wall' && slot === 'shelf' ? 80 : 16)} fill="transparent" />
            </g>
            {sel && r && <VerdictTag x={box.x + box.w / 2} y={box.y - 16} r={r} />}
          </g>
        );
      });
  }
}

function Ghost({ slot, selected, onSelect }: { slot: Slot; selected: boolean; onSelect: () => void }) {
  const g = GHOST[slot];
  const x = X(g.x), w = g.w * PX;
  const h = slot === 'rug' ? 70 : g.h * PX;
  const y = slot === 'rug' ? 600 : g.wall ? FLOOR_Y - ROOM.artBottom * PX - h : BASE_Y - h;
  return (
    <g className="ghost" role="button" tabIndex={0} aria-label={`Add a ${NOUN[slot]}`} onPointerDown={(e) => { e.stopPropagation(); onSelect(); }} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={selected ? 'rgba(90,49,244,0.14)' : 'rgba(255,255,255,0.35)'} stroke="#5A31F4" strokeWidth={2} strokeDasharray="7 6" />
      <circle cx={x + w / 2} cy={y + h / 2 - 8} r={14} fill="#5A31F4" />
      <text x={x + w / 2} y={y + h / 2 - 2} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" fontFamily="Inter, system-ui, sans-serif">+</text>
      <text x={x + w / 2} y={y + h / 2 + 22} textAnchor="middle" fontSize={12} fontWeight={800} fill="#5A31F4" fontFamily="Inter, system-ui, sans-serif">Add {NOUN[slot]}</text>
    </g>
  );
}

function QuickSwap({ box, slot, q }: { box: { x: number; y: number; w: number; h: number }; slot: Slot; q: NonNullable<Props['quickSwap']> }) {
  const W = 290, H = 60;
  let x = box.x + box.w / 2 - W / 2;
  x = Math.max(8, Math.min(VIEW.w - W - 8, x));
  const below = slot === 'wall-art' || slot === 'shelf' ? box.y + box.h + 14 : Math.min(VIEW.h - H - 8, BASE_Y + 14);
  const y = slot === 'rug' ? VIEW.h - H - 10 : below;
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <foreignObject x={x} y={y} width={W} height={H} onPointerDown={stop} onClick={stop}>
      <div className="qswap">
        <button onClick={q.onPrev} aria-label={`Previous ${NOUN[slot]}`}>‹</button>
        <button className="qswap-mid" onClick={q.onMore} aria-label={`See all ${NOUN[slot]} options`}>
          <b>Swap {NOUN[slot]}</b>
          <span>{q.index + 1} of {q.count} · see all</span>
        </button>
        <button onClick={q.onNext} aria-label={`Next ${NOUN[slot]}`}>›</button>
      </div>
    </foreignObject>
  );
}

function VerdictTag({ x, y, r }: { x: number; y: number; r: Receipt }) {
  const map: Record<string, [string, string]> = {
    Fits: ['#008060', 'Fits ✓'],
    'Probably fits': ['#5A31F4', 'Probably fits'],
    Squeeze: ['#B7791F', 'Squeeze'],
    "Won't fit": ['#D72C0D', "Won't fit"],
    "Can't tell": ['#5A31F4', "Can't tell ?"],
  };
  const [bg, label] = map[r.overall];
  const w = label.length * 7.4 + 22;
  return (
    <g pointerEvents="none" className="tag-pop">
      <rect x={x - w / 2} y={y - 22} width={w} height={24} rx={12} fill={bg} />
      <path d={`M${x - 5} ${y + 1} L${x} ${y + 7} L${x + 5} ${y + 1}Z`} fill={bg} />
      <text x={x} y={y - 6} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#fff" fontFamily="Inter, system-ui, sans-serif">{label}</text>
    </g>
  );
}

function Defs({ uid, vibe }: { uid: string; vibe: Vibe }) {
  return (
    <defs>
      <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={vibe.wallShade} />
        <stop offset="0.35" stopColor={vibe.wall} />
        <stop offset="1" stopColor={vibe.wall} />
      </linearGradient>
      <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={vibe.floor} />
        <stop offset="1" stopColor={vibe.floorLine} />
      </linearGradient>
      <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={vibe.id === 'den' ? '#2B3A55' : '#BFDDF2'} />
        <stop offset="1" stopColor={vibe.id === 'den' ? '#E39A5B' : '#F4F8FB'} />
      </linearGradient>
      <linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={vibe.light} stopOpacity={vibe.lightOpacity} />
        <stop offset="1" stopColor={vibe.light} stopOpacity={0} />
      </linearGradient>
      <radialGradient id={`${uid}-glow`}>
        <stop offset="0" stopColor={vibe.light} stopOpacity={0.9} />
        <stop offset="1" stopColor={vibe.light} stopOpacity={0} />
      </radialGradient>
      <radialGradient id={`${uid}-vignette`} cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.6" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={vibe.id === 'den' ? 0.35 : 0.14} />
      </radialGradient>
      <linearGradient id={`${uid}-rugshade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity={0.12} />
        <stop offset="1" stopColor="#000" stopOpacity={0} />
      </linearGradient>
      <filter id={`${uid}-neon`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <pattern id={`${uid}-brick`} width="64" height="28" patternUnits="userSpaceOnUse">
        <rect width="64" height="28" fill={vibe.wall} />
        <path d="M0 0.5H64M0 14.5H64M0.5 0V14M32.5 14V28" stroke={vibe.wallShade} strokeWidth="2" />
      </pattern>
      <pattern id={`${uid}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="11" cy="11" r="1.4" fill="#fff" opacity="0.5" />
      </pattern>
    </defs>
  );
}

function Architecture({ uid, vibe, doorWidth, unit, onBg }: { uid: string; vibe: Vibe; doorWidth: number; unit: Unit; onBg: () => void }) {
  const wx = X(ROOM.window.x), ww = ROOM.window.w * PX;
  const wy = FLOOR_Y - ROOM.window.top * PX, wh = (ROOM.window.top - ROOM.window.bottom) * PX;
  const planks = Array.from({ length: 15 }, (_, i) => X0 + (i * (VIEW.w - 2 * X0)) / 14);
  const vx = VIEW.w / 2;
  return (
    <g onClick={onBg}>
      {/* ceiling + side walls */}
      <rect x={0} y={0} width={VIEW.w} height={30} fill={vibe.trim} className="tx" />
      <rect x={X0} y={30} width={VIEW.w - 2 * X0} height={FLOOR_Y - 30} fill={vibe.wall} className="tx" style={{ fill: vibe.wall }} />
      <rect x={X0} y={30} width={VIEW.w - 2 * X0} height={FLOOR_Y - 30} fill={`url(#${uid}-wall)`} opacity={0.9} />
      {vibe.pattern === 'brick' && <rect x={X0} y={30} width={VIEW.w - 2 * X0} height={FLOOR_Y - 30} fill={`url(#${uid}-brick)`} opacity={0.9} />}
      {vibe.pattern === 'sunburst' && (
        <g opacity={0.35}>
          {Array.from({ length: 13 }, (_, i) => {
            const a0 = Math.PI + (i * Math.PI) / 13, a1 = a0 + Math.PI / 26;
            const cx = X(260), cy = FLOOR_Y - 20, R = 520;
            return <path key={i} d={`M${cx} ${cy} L${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} L${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}Z`} fill="#fff" />;
          })}
        </g>
      )}
      {vibe.pattern === 'panels' && (
        <g fill="none" stroke={vibe.trim} strokeOpacity={0.28} strokeWidth={3}>
          <line x1={X0} y1={FLOOR_Y - 190} x2={VIEW.w - X0} y2={FLOOR_Y - 190} strokeWidth={6} />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={X0 + 22 + i * 158} y={FLOOR_Y - 172} width={136} height={140} rx={2} />)}
          {[0, 1, 2].map((i) => <rect key={`u${i}`} x={X0 + 22 + i * 158} y={70} width={136} height={250} rx={2} />)}
        </g>
      )}
      {vibe.pattern === 'arch' && (
        <g>
          <path d={`M${X(150)} ${FLOOR_Y} L${X(150)} ${FLOOR_Y - 300} A${110 * PX} ${110 * PX} 0 0 1 ${X(370)} ${FLOOR_Y - 300} L${X(370)} ${FLOOR_Y}Z`} fill="#2EC4B6" opacity={0.9} />
          <rect x={X0} y={30} width={VIEW.w - 2 * X0} height={FLOOR_Y - 30} fill={`url(#${uid}-dots)`} />
          <path d={`M${X(10)} 90 q30 -24 60 0 t60 0 t60 0`} stroke="#FFD23F" strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      )}
      {/* left side wall with the front door */}
      <path d={`M0 0 L${X0} 30 L${X0} ${FLOOR_Y} L0 ${VIEW.h}Z`} fill={vibe.wallShade} />
      <path d={`M6 120 L${X0 - 6} 128 L${X0 - 6} ${FLOOR_Y - 4} L6 ${FLOOR_Y + 40}Z`} fill="#000" opacity={0.28} />
      <g>
        <rect x={2} y={96} width={92} height={24} rx={12} fill="#1A1A1A" opacity={0.82} />
        <text x={48} y={112} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#fff" fontFamily="Inter, system-ui, sans-serif">🚪 Door {fmtLen(doorWidth, unit)}</text>
      </g>
      <path d={`M${VIEW.w} 0 L${VIEW.w - X0} 30 L${VIEW.w - X0} ${FLOOR_Y} L${VIEW.w} ${VIEW.h}Z`} fill={vibe.wallShade} />

      {/* window + light */}
      <rect x={wx - 10} y={wy - 10} width={ww + 20} height={wh + 20} rx={4} fill={vibe.trim} />
      <rect x={wx} y={wy} width={ww} height={wh} fill={`url(#${uid}-sky)`} />
      {vibe.id === 'den' && [0.2, 0.5, 0.8].map((f, i) => <rect key={i} x={wx + ww * f - 8} y={wy + wh - 60 - i * 18} width={16} height={60 + i * 18} fill="#1E2433" />)}
      <path d={`M${wx + ww / 2} ${wy} V${wy + wh} M${wx} ${wy + wh / 2} H${wx + ww}`} stroke={vibe.trim} strokeWidth={6} />
      <rect x={wx - 16} y={wy + wh + 8} width={ww + 32} height={8} rx={2} fill={vibe.trim} />
      {(vibe.id === 'classy' || vibe.id === 'modern') && (
        <g opacity={0.9}>
          <path d={`M${wx - 30} ${wy - 26} q10 ${wh / 2} 0 ${wh + 40} h22 q-10 -${wh / 2} 0 -${wh + 40}z`} fill={vibe.id === 'classy' ? '#E9DFCF' : '#FFFFFF'} />
          <path d={`M${wx + ww + 8} ${wy - 26} q10 ${wh / 2} 0 ${wh + 40} h22 q-10 -${wh / 2} 0 -${wh + 40}z`} fill={vibe.id === 'classy' ? '#E9DFCF' : '#FFFFFF'} />
          <rect x={wx - 40} y={wy - 30} width={ww + 80} height={5} rx={2} fill={vibe.id === 'classy' ? '#C8A15A' : '#2B2B2B'} />
        </g>
      )}
      {/* outlet */}
      <rect x={X(118)} y={FLOOR_Y - 46} width={14} height={20} rx={3} fill={vibe.trim} stroke="#000" strokeOpacity={0.15} />

      {/* baseboard + floor */}
      <rect x={X0} y={FLOOR_Y - 12} width={VIEW.w - 2 * X0} height={12} fill={vibe.trim} />
      <path d={`M${X0} ${FLOOR_Y} L${VIEW.w - X0} ${FLOOR_Y} L${VIEW.w} ${VIEW.h} L0 ${VIEW.h}Z`} fill={vibe.floor} className="tx" style={{ fill: vibe.floor }} />
      <path d={`M${X0} ${FLOOR_Y} L${VIEW.w - X0} ${FLOOR_Y} L${VIEW.w} ${VIEW.h} L0 ${VIEW.h}Z`} fill={`url(#${uid}-floor)`} opacity={0.65} />
      <g stroke={vibe.floorLine} strokeWidth={1.4} opacity={0.55}>
        {planks.map((x, i) => <line key={i} x1={x} y1={FLOOR_Y} x2={vx + (x - vx) * 1.12} y2={VIEW.h} />)}
        {[600, 650, 700].map((y, i) => <line key={`h${i}`} x1={0} y1={y} x2={VIEW.w} y2={y} strokeOpacity={0.4} />)}
      </g>
      {/* sunlight beam from the window */}
      <path d={`M${wx} ${wy + wh} L${wx + ww} ${wy + wh} L${wx + ww - 60} ${VIEW.h} L${wx - 280} ${VIEW.h}Z`} fill={`url(#${uid}-beam)`} style={{ mixBlendMode: 'screen' }} />
      <path d={`M${wx} ${wy} L${wx + ww} ${wy} L${wx + ww - 120} ${FLOOR_Y} L${wx - 170} ${FLOOR_Y}Z`} fill={vibe.light} opacity={vibe.lightOpacity * 0.25} />

      <CeilingLamp vibe={vibe} />
    </g>
  );
}

function CeilingLamp({ vibe }: { vibe: Vibe }) {
  const cx = X(260);
  switch (vibe.ceilingLamp) {
    case 'globe':
      return (
        <g>
          <line x1={cx} y1={30} x2={cx} y2={70} stroke="#2B1A0E" strokeWidth={2} />
          {[-34, -12, 12, 34].map((dx, i) => <g key={dx}><line x1={cx} y1={70} x2={cx + dx} y2={88 + (i % 2) * 14} stroke="#2B1A0E" strokeWidth={2} /><circle cx={cx + dx} cy={96 + (i % 2) * 14} r={11} fill="#FFF3D6" /></g>)}
        </g>
      );
    case 'chandelier':
      return (
        <g>
          <line x1={cx} y1={30} x2={cx} y2={60} stroke="#C8A15A" strokeWidth={2} />
          <path d={`M${cx - 54} 84 Q${cx} 112 ${cx + 54} 84`} stroke="#C8A15A" strokeWidth={3} fill="none" />
          <line x1={cx} y1={60} x2={cx} y2={98} stroke="#C8A15A" strokeWidth={3} />
          {[-54, -27, 0, 27, 54].map((dx) => <g key={dx}><rect x={cx + dx - 3} y={dx === 0 ? 86 : 70 + Math.abs(dx) / 3} width={6} height={14} fill="#F6EAD0" /><ellipse cx={cx + dx} cy={dx === 0 ? 82 : 66 + Math.abs(dx) / 3} rx={4} ry={7} fill="#FFD27A" /></g>)}
        </g>
      );
    case 'track':
      return (
        <g>
          <rect x={cx - 140} y={34} width={280} height={6} rx={3} fill="#111" />
          {[-110, -10, 100].map((dx) => <g key={dx}><path d={`M${cx + dx} 40 l-10 18 h20z`} fill="#222" /><path d={`M${cx + dx - 8} 58 L${cx + dx - 60} ${FLOOR_Y - 40} L${cx + dx + 60} ${FLOOR_Y - 40} L${cx + dx + 8} 58Z`} fill="#FF9E4A" opacity={0.08} /></g>)}
        </g>
      );
    case 'disco':
      return (
        <g className="spin-slow" style={{ transformOrigin: `${cx}px 96px` }}>
          <line x1={cx} y1={30} x2={cx} y2={72} stroke="#999" strokeWidth={2} />
          <circle cx={cx} cy={96} r={24} fill="#D9D9E3" />
          {Array.from({ length: 16 }, (_, i) => <rect key={i} x={cx - 22 + (i % 4) * 11} y={74 + Math.floor(i / 4) * 11} width={9} height={9} fill={['#fff', '#B8A2FF', '#FFB3D1', '#BFE9E5'][i % 4]} opacity={0.85} />)}
          <circle cx={cx} cy={96} r={24} fill="none" stroke="#fff" strokeWidth={2} />
          {[[-70, 40], [80, 70], [-120, 140], [140, 20]].map(([dx, dy], i) => <path key={i} d={`M${cx + dx} ${96 + dy} l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3z`} fill="#fff" opacity={0.8} />)}
        </g>
      );
    default:
      return (
        <g>
          <line x1={cx} y1={30} x2={cx} y2={86} stroke="#2B2B2B" strokeWidth={1.5} />
          <path d={`M${cx - 34} 112 Q${cx} 66 ${cx + 34} 112Z`} fill="#2B2B2B" />
          <ellipse cx={cx} cy={112} rx={16} ry={4} fill="#FFF4DC" />
        </g>
      );
  }
}

function OwnedCouch({ vibe }: { vibe: Vibe }) {
  const c = OWNED[0];
  const x = X(c.x), w = c.width * PX, h = c.height * PX, y = BASE_Y - h;
  const grey = c.color;
  const pillow = vibe.swatches[2] === '#C9A57A' ? '#E6DCCB' : vibe.swatches[2];
  const pillow2 = vibe.swatches[1];
  return (
    <g aria-label="Your grey couch (staying)">
      <ellipse cx={x + w / 2} cy={BASE_Y} rx={w * 0.52} ry={9} fill="#000" opacity={0.2} />
      <rect x={x + 18} y={BASE_Y - 10} width={8} height={10} fill="#3A3A3A" />
      <rect x={x + w - 26} y={BASE_Y - 10} width={8} height={10} fill="#3A3A3A" />
      <rect x={x + 14} y={y} width={w - 28} height={h * 0.62} rx={18} fill="#7F8287" />
      <rect x={x + 26} y={y + 8} width={(w - 52) / 2 - 4} height={h * 0.5} rx={14} fill="#8C8F94" />
      <rect x={x + w / 2 + 4} y={y + 8} width={(w - 52) / 2 - 4} height={h * 0.5} rx={14} fill="#8C8F94" />
      <rect x={x} y={y + h * 0.48} width={w} height={h * 0.4} rx={14} fill={grey} />
      <rect x={x + 30} y={y + h * 0.46} width={w - 60} height={h * 0.14} rx={8} fill="#9A9DA2" />
      <rect x={x} y={y + h * 0.34} width={34} height={h * 0.54} rx={14} fill="#83868B" />
      <rect x={x + w - 34} y={y + h * 0.34} width={34} height={h * 0.54} rx={14} fill="#83868B" />
      <rect x={x + 44} y={y + h * 0.2} width={50} height={46} rx={12} fill={pillow} transform={`rotate(-8 ${x + 69} ${y + h * 0.2 + 23})`} />
      <rect x={x + w - 96} y={y + h * 0.22} width={48} height={44} rx={12} fill={pillow2} transform={`rotate(7 ${x + w - 72} ${y + h * 0.22 + 22})`} />
      <g transform={`translate(${x + w / 2} ${y - 14})`}>
        <rect x={-62} y={-12} width={124} height={22} rx={11} fill="#fff" opacity={0.92} />
        <text y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1A1A1A" fontFamily="Inter, system-ui, sans-serif">Your couch · staying</text>
      </g>
    </g>
  );
}

function CoffeeTable({ vibe }: { vibe: Vibe }) {
  const c = OWNED[1];
  const x = X(c.x) - 10, w = c.width * PX + 20, top = 600, base = 680;
  return (
    <g aria-label="Your oak coffee table (staying)">
      <ellipse cx={x + w / 2} cy={base + 2} rx={w * 0.55} ry={8} fill="#000" opacity={0.2} />
      <rect x={x + 14} y={top + 10} width={10} height={base - top - 10} fill="#A67C52" />
      <rect x={x + w - 24} y={top + 10} width={10} height={base - top - 10} fill="#A67C52" />
      <rect x={x + 6} y={top + 44} width={w - 12} height={6} rx={2} fill="#B88A5E" />
      <rect x={x} y={top} width={w} height={14} rx={4} fill={c.color} />
      <rect x={x} y={top} width={w} height={4} rx={2} fill="#D7B285" />
      <Accent vibe={vibe} x={x + w * 0.62} y={top} />
      <g transform={`translate(${x + w * 0.24} ${top - 8})`}>
        <rect x={-6} y={-6} width={36} height={6} rx={2} fill="#F3EDE3" />
        <rect x={-4} y={-11} width={32} height={5} rx={2} fill={vibe.swatches[1]} />
      </g>
    </g>
  );
}

function Accent({ vibe, x, y }: { vibe: Vibe; x: number; y: number }) {
  switch (vibe.accent) {
    case 'record':
      return (
        <g>
          <rect x={x - 26} y={y - 16} width={52} height={16} rx={3} fill="#8A5A36" />
          <ellipse cx={x - 4} cy={y - 17} rx={18} ry={4} fill="#111" />
          <circle cx={x - 4} cy={y - 17} r={3} fill="#D9622B" />
          <line x1={x + 18} y1={y - 22} x2={x + 6} y2={y - 16} stroke="#ccc" strokeWidth={2} />
        </g>
      );
    case 'books':
      return (
        <g>
          <rect x={x - 22} y={y - 8} width={44} height={8} fill="#7A2E2E" />
          <rect x={x - 18} y={y - 15} width={38} height={7} fill="#EFE7DA" />
          <rect x={x + 6} y={y - 32} width={10} height={17} rx={2} fill="#F6EAD0" />
          <ellipse cx={x + 11} cy={y - 36} rx={3} ry={5} fill="#FFD27A" />
        </g>
      );
    case 'chess':
      return (
        <g>
          <rect x={x - 24} y={y - 6} width={48} height={6} fill="#E8DCC8" />
          {[-16, -4, 8].map((dx, i) => <path key={dx} d={`M${x + dx - 4} ${y - 6} h8 l-2 -${10 + i * 4} h-4z`} fill={i % 2 ? '#1E1E1E' : '#F3EDE3'} />)}
          <rect x={x + 14} y={y - 20} width={8} height={14} rx={2} fill="#C8A15A" opacity={0.8} />
        </g>
      );
    case 'tulips':
      return (
        <g>
          <path d={`M${x - 9} ${y} l-3 -22 h24 l-3 22z`} fill="#2EC4B6" />
          {[-8, 0, 8].map((dx, i) => <g key={dx}><line x1={x + dx} y1={y - 22} x2={x + dx * 1.6} y2={y - 46 - i * 4} stroke="#4D7A4A" strokeWidth={2} /><ellipse cx={x + dx * 1.6} cy={y - 50 - i * 4} rx={6} ry={8} fill={['#FF5DA2', '#FFD23F', '#FF8C42'][i]} /></g>)}
        </g>
      );
    default:
      return <Plant x={x} y={y} />;
  }
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-10 0 L-8 -18 L8 -18 L10 0Z" fill="#E9E1D3" />
      <path d="M0 -18 C-16 -28 -20 -46 -6 -54 C-2 -40 0 -30 0 -18Z" fill="#5E8B5A" />
      <path d="M0 -18 C14 -26 22 -44 10 -58 C3 -42 0 -30 0 -18Z" fill="#76A56E" />
    </g>
  );
}

function RugLayer({ uid, p, x, selected, warn, interactive, onSelect }: { uid: string; p: Product; x: number; selected: boolean; warn: boolean; interactive?: boolean; onSelect: () => void }) {
  const d = dimsFor(p);
  const w = d.width * PX;
  const depth = d.depth * PX * 0.42; // floor foreshortening
  const left = X(x);
  const top = 612 - depth / 2;
  const missing = p.dimensions.source === 'missing';
  return (
    <g
      className={interactive ? 'scene-item' : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      aria-label={interactive ? `${p.title} rug` : undefined}
      onPointerDown={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onSelect();
      }}
      opacity={missing ? 0.6 : 1}
    >
      <clipPath id={`${uid}-rugclip`}>
        <path d={`M${left + w * 0.07} ${top} L${left + w * 0.93} ${top} L${left + w} ${top + depth} L${left} ${top + depth}Z`} />
      </clipPath>
      <g clipPath={`url(#${uid}-rugclip)`}>
        <g transform={`translate(${left} ${top})`}>
          <RugArt variant={p.illustration.variant} w={w} d={depth} colors={p.colors} uid={uid} />
        </g>
      </g>
      {(selected || warn || missing) && (
        <path
          d={`M${left + w * 0.07 - 6} ${top - 6} L${left + w * 0.93 + 6} ${top - 6} L${left + w + 8} ${top + depth + 6} L${left - 8} ${top + depth + 6}Z`}
          fill="none"
          stroke={warn ? '#D72C0D' : missing ? '#5A31F4' : '#008060'}
          strokeWidth={2.5}
          strokeDasharray={warn || missing ? '7 5' : undefined}
        />
      )}
    </g>
  );
}

function Measurements({ products, positions, unit }: { products: Partial<Record<Slot, Product>>; positions: Record<Slot, number>; unit: Unit }) {
  const floor: { x: number; w: number; label: string }[] = [{ x: 160, w: 200, label: 'couch' }];
  const lines: ReactElement[] = [];
  SLOTS.forEach((slot) => {
    const p = products[slot];
    if (!p || slot === 'rug') return;
    const box = itemBox(p, positions[slot] ?? 0);
    const d = dimsFor(p);
    const known = p.dimensions.source !== 'missing';
    const y = box.lane === 'wall' ? box.y - 10 : BASE_Y + 22;
    lines.push(
      <g key={slot} className="measure">
        <line x1={box.x} y1={y} x2={box.x + box.w} y2={y} />
        <line x1={box.x} y1={y - 5} x2={box.x} y2={y + 5} />
        <line x1={box.x + box.w} y1={y - 5} x2={box.x + box.w} y2={y + 5} />
        <rect x={box.x + box.w / 2 - 26} y={y - 9} width={52} height={18} rx={9} className="measure-chip" />
        <text x={box.x + box.w / 2} y={y + 4} textAnchor="middle">{known ? fmtLen(d.width, unit) : '? cm'}</text>
        {box.lane === 'floor' && box.h > 60 && (
          <g>
            <line x1={box.x + box.w + 8} y1={box.y} x2={box.x + box.w + 8} y2={BASE_Y} />
            <text x={box.x + box.w + 12} y={box.y + 14} textAnchor="start">{known ? fmtLen(d.height, unit) : ''}</text>
          </g>
        )}
      </g>,
    );
    if (box.lane === 'floor' && slot !== 'lamp') floor.push({ x: positions[slot] ?? 0, w: d.width, label: slot });
  });
  // free gaps along the floor
  const sorted = floor.sort((a, b) => a.x - b.x);
  let cursor = 0;
  const gaps: ReactElement[] = [];
  [...sorted, { x: ROOM.wallWidth, w: 0, label: 'wall' }].forEach((it, i) => {
    const gap = it.x - cursor;
    if (gap > 2) {
      const y = BASE_Y + 46;
      gaps.push(
        <g key={`g${i}`} className="measure gap">
          <line x1={X(cursor)} y1={y} x2={X(it.x)} y2={y} strokeDasharray="4 4" />
          <text x={(X(cursor) + X(it.x)) / 2} y={y + 15} textAnchor="middle">{fmtLen(gap, unit)} free</text>
        </g>,
      );
    }
    cursor = Math.max(cursor, it.x + it.w);
  });
  return (
    <g pointerEvents="none">
      <g className="measure">
        <line x1={X0} y1={44} x2={VIEW.w - X0} y2={44} />
        <rect x={VIEW.w / 2 - 56} y={35} width={112} height={18} rx={9} className="measure-chip" />
        <text x={VIEW.w / 2} y={48} textAnchor="middle">wall {fmtLen(ROOM.wallWidth, unit)}</text>
      </g>
      {lines}
      {gaps}
    </g>
  );
}
