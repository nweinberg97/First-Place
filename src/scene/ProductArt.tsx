import type { Slot } from '../types';

/**
 * Flat editorial illustrations, one component per slot, 2–4 genuinely different
 * silhouettes each. Every drawing is normalised to its true bounding box (w × h px)
 * so scale is honest: a 88 cm chair is drawn 30% wider than a 68 cm one.
 */

export interface ArtProps {
  slot: Slot;
  variant: string;
  w: number;
  h: number;
  colors: string[];
  uid: string;
  dark?: boolean;
}

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

export function ProductArt(p: ArtProps) {
  switch (p.slot) {
    case 'chair':
      return <Chair {...p} />;
    case 'lamp':
      return <Lamp {...p} />;
    case 'side-table':
      return <SideTable {...p} />;
    case 'shelf':
      return <Shelf {...p} />;
    case 'wall-art':
      return <WallArt {...p} />;
    default:
      return null;
  }
}

function Chair({ variant, w, h, colors }: ArtProps) {
  const [c0, c1 = '#7a5a3a'] = colors;
  if (variant === 'midcentury') {
    return (
      <g>
        <path d={`M${w * 0.2} ${h * 0.64} L${w * 0.06} ${h} L${w * 0.13} ${h} L${w * 0.3} ${h * 0.64}Z`} fill={c1} />
        <path d={`M${w * 0.74} ${h * 0.64} L${w * 0.94} ${h} L${w * 0.87} ${h} L${w * 0.66} ${h * 0.64}Z`} fill={c1} />
        <path d={`M${w * 0.48} ${h * 0.64} L${w * 0.5} ${h * 0.96} L${w * 0.55} ${h * 0.96} L${w * 0.56} ${h * 0.64}Z`} fill={shade(c1, -0.12)} />
        <rect x={w * 0.16} y={h * 0.04} width={w * 0.66} height={h * 0.52} rx={Math.min(18, w * 0.18)} fill={shade(c0, -0.06)} transform={`rotate(-7 ${w * 0.5} ${h * 0.3})`} />
        <rect x={w * 0.21} y={h * 0.1} width={w * 0.56} height={h * 0.4} rx={Math.min(14, w * 0.14)} fill={c0} transform={`rotate(-7 ${w * 0.5} ${h * 0.3})`} />
        <rect x={w * 0.06} y={h * 0.5} width={w * 0.86} height={h * 0.15} rx={10} fill={c0} />
        <rect x={w * 0.06} y={h * 0.5} width={w * 0.86} height={h * 0.05} rx={6} fill={shade(c0, 0.06)} />
        <rect x={w * 0.02} y={h * 0.4} width={w * 0.96} height={6} rx={3} fill={c1} />
        <rect x={w * 0.05} y={h * 0.4} width={5} height={h * 0.24} fill={c1} />
        <rect x={w * 0.9} y={h * 0.4} width={5} height={h * 0.24} fill={c1} />
      </g>
    );
  }
  if (variant === 'round') {
    return (
      <g>
        <rect x={w * 0.46} y={h * 0.8} width={w * 0.08} height={h * 0.16} fill={shade(c1, -0.2)} />
        <ellipse cx={w * 0.5} cy={h * 0.97} rx={w * 0.3} ry={h * 0.03} fill={shade(c1, -0.25)} />
        <ellipse cx={w * 0.5} cy={h * 0.45} rx={w * 0.5} ry={h * 0.44} fill={c0} />
        <ellipse cx={w * 0.5} cy={h * 0.47} rx={w * 0.36} ry={h * 0.32} fill={shade(c0, -0.12)} />
        <ellipse cx={w * 0.5} cy={h * 0.62} rx={w * 0.34} ry={h * 0.12} fill={c1} />
        <ellipse cx={w * 0.5} cy={h * 0.4} rx={w * 0.22} ry={h * 0.16} fill={shade(c1, 0.08)} />
        <path d={`M${w * 0.12} ${h * 0.3} Q${w * 0.2} ${h * 0.08} ${w * 0.42} ${h * 0.05}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (variant === 'wingback') {
    return (
      <g>
        <path d={`M${w * 0.16} ${h * 0.82} q-4 ${h * 0.1} ${w * 0.02} ${h * 0.18} h4 q2 -${h * 0.1} 4 -${h * 0.18}z`} fill={c1} />
        <path d={`M${w * 0.84} ${h * 0.82} q4 ${h * 0.1} -${w * 0.02} ${h * 0.18} h-4 q-2 -${h * 0.1} -4 -${h * 0.18}z`} fill={c1} />
        <path d={`M${w * 0.14} ${h * 0.58} L${w * 0.12} ${h * 0.14} Q${w * 0.5} ${-h * 0.04} ${w * 0.88} ${h * 0.14} L${w * 0.86} ${h * 0.58}Z`} fill={shade(c0, -0.05)} />
        <path d={`M${w * 0.02} ${h * 0.6} L${w * 0.04} ${h * 0.22} Q${w * 0.12} ${h * 0.14} ${w * 0.2} ${h * 0.26} L${w * 0.22} ${h * 0.6}Z`} fill={c0} />
        <path d={`M${w * 0.98} ${h * 0.6} L${w * 0.96} ${h * 0.22} Q${w * 0.88} ${h * 0.14} ${w * 0.8} ${h * 0.26} L${w * 0.78} ${h * 0.6}Z`} fill={c0} />
        {[0.32, 0.5, 0.68].map((fx) => [0.22, 0.38].map((fy) => <circle key={`${fx}${fy}`} cx={w * fx} cy={h * fy} r={2.2} fill={shade(c0, -0.22)} />))}
        <rect x={w * 0.04} y={h * 0.56} width={w * 0.92} height={h * 0.14} rx={8} fill={c0} />
        <rect x={w * 0.04} y={h * 0.68} width={w * 0.92} height={h * 0.15} rx={4} fill={shade(c0, -0.1)} />
        <rect x={w * 0.04} y={h * 0.8} width={w * 0.92} height={4} fill={c1} />
      </g>
    );
  }
  // boxy club chair
  const tufted = parseInt(c0.slice(1), 16) < 0x999999;
  return (
    <g>
      <rect x={w * 0.08} y={h * 0.9} width={8} height={h * 0.1} fill={c1} />
      <rect x={w * 0.92 - 8} y={h * 0.9} width={8} height={h * 0.1} fill={c1} />
      <rect x={w * 0.1} y={h * 0.04} width={w * 0.8} height={h * 0.55} rx={14} fill={shade(c0, -0.08)} />
      {tufted && [0.3, 0.5, 0.7].map((fx) => <circle key={fx} cx={w * fx} cy={h * 0.25} r={2.2} fill={shade(c0, -0.25)} />)}
      <rect x={w * 0.02} y={h * 0.5} width={w * 0.96} height={h * 0.42} rx={12} fill={c0} />
      <rect x={0} y={h * 0.32} width={w * 0.22} height={h * 0.6} rx={14} fill={shade(c0, 0.04)} />
      <rect x={w * 0.78} y={h * 0.32} width={w * 0.22} height={h * 0.6} rx={14} fill={shade(c0, 0.04)} />
      <rect x={w * 0.2} y={h * 0.48} width={w * 0.6} height={h * 0.14} rx={8} fill={shade(c0, 0.1)} />
      <path d={`M${w * 0.06} ${h * 0.38} q${w * 0.06} -${h * 0.05} ${w * 0.12} 0`} stroke="#fff" strokeOpacity={0.3} strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Lamp({ variant, w, h, colors, uid, dark }: ArtProps) {
  const [c0, c1 = '#F3EDE3'] = colors;
  const glow = <ellipse cx={w / 2} cy={h * 0.24} rx={w * 1.6} ry={h * 0.2} fill={`url(#${uid}-glow)`} opacity={dark ? 0.9 : 0.55} />;
  if (variant === 'arc') {
    const sx = -w * 1.7;
    return (
      <g>
        <ellipse cx={sx} cy={h * 0.2} rx={w * 1.4} ry={h * 0.16} fill={`url(#${uid}-glow)`} opacity={dark ? 0.9 : 0.5} />
        <path d={`M${w * 0.5} ${h * 0.96} L${w * 0.5} ${h * 0.5} Q${w * 0.5} ${h * 0.0} ${sx} ${h * 0.06}`} stroke={c0} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d={`M${sx - 22} ${h * 0.17} Q${sx} ${h * 0.02} ${sx + 22} ${h * 0.17}Z`} fill={c0} />
        <ellipse cx={sx} cy={h * 0.17} rx={18} ry={4} fill={c1} />
        <rect x={0} y={h * 0.95} width={w} height={h * 0.05} rx={4} fill={shade(c0, 0.05)} />
      </g>
    );
  }
  if (variant === 'globe') {
    return (
      <g>
        {glow}
        <rect x={w / 2 - 2} y={h * 0.18} width={4} height={h * 0.8} fill={c0 === '#FFD23F' ? '#2EC4B6' : shade(c0, -0.3)} />
        <ellipse cx={w / 2} cy={h * 0.985} rx={w * 0.42} ry={h * 0.015 + 2} fill={shade(c0, -0.2)} />
        <path d={`M${-w * 0.05} ${h * 0.2} Q${w * 0.5} ${-h * 0.08} ${w * 1.05} ${h * 0.2}Z`} fill={c0} />
        <ellipse cx={w / 2} cy={h * 0.2} rx={w * 0.55} ry={5} fill={shade(c0, -0.15)} />
        <ellipse cx={w / 2} cy={h * 0.215} rx={w * 0.3} ry={3} fill={c1} />
        <path d={`M${w * 0.1} ${h * 0.12} Q${w * 0.3} ${h * 0.02} ${w * 0.52} ${h * 0.03}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (variant === 'brass') {
    return (
      <g>
        {glow}
        <rect x={w / 2 - 3} y={h * 0.26} width={6} height={h * 0.72} fill={shade(c0, -0.05)} />
        <rect x={w / 2 - 6} y={h * 0.55} width={12} height={8} rx={3} fill={shade(c0, 0.1)} />
        <ellipse cx={w / 2} cy={h * 0.985} rx={w * 0.4} ry={5} fill={shade(c0, -0.15)} />
        <path d={`M${w * 0.12} 0 L${w * 0.88} 0 L${w} ${h * 0.27} L0 ${h * 0.27}Z`} fill={c1} />
        {Array.from({ length: 9 }, (_, i) => <line key={i} x1={w * (0.12 + (0.76 * i) / 8)} y1={2} x2={w * (i / 8)} y2={h * 0.27 - 2} stroke={shade(c1, -0.08)} strokeWidth={1.2} />)}
        <rect x={0} y={h * 0.265} width={w} height={3} fill={c0} />
      </g>
    );
  }
  // tripod
  return (
    <g>
      {glow}
      <line x1={w / 2} y1={h * 0.34} x2={w * 0.02} y2={h} stroke={c0} strokeWidth={3.5} strokeLinecap="round" />
      <line x1={w / 2} y1={h * 0.34} x2={w * 0.98} y2={h} stroke={c0} strokeWidth={3.5} strokeLinecap="round" />
      <line x1={w / 2} y1={h * 0.34} x2={w * 0.55} y2={h * 0.98} stroke={shade(c0, 0.15)} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${w * 0.18} 0 L${w * 0.82} 0 L${w * 1.02} ${h * 0.3} L${-w * 0.02} ${h * 0.3}Z`} fill={c1} />
      <path d={`M${w * 0.18} 0 L${w * 0.82} 0 L${w * 1.02} ${h * 0.3} L${w * 0.7} ${h * 0.3}Z`} fill={shade(c1, -0.06)} />
    </g>
  );
}

function SideTable({ variant, w, h, colors }: ArtProps) {
  const [c0, c1 = c0, c2 = c1] = colors;
  if (variant === 'pedestal') {
    return (
      <g>
        <ellipse cx={w / 2} cy={h * 0.06} rx={w / 2} ry={h * 0.06 + 2} fill={shade(c0, 0.05)} />
        <rect x={0} y={h * 0.06} width={w} height={h * 0.07} fill={shade(c0, -0.08)} />
        <path d={`M${w * 0.38} ${h * 0.13} Q${w * 0.3} ${h * 0.6} ${w * 0.22} ${h * 0.96} L${w * 0.78} ${h * 0.96} Q${w * 0.7} ${h * 0.6} ${w * 0.62} ${h * 0.13}Z`} fill={c0} />
        <path d={`M${w * 0.55} ${h * 0.13} Q${w * 0.62} ${h * 0.6} ${w * 0.7} ${h * 0.96} L${w * 0.78} ${h * 0.96} Q${w * 0.7} ${h * 0.6} ${w * 0.62} ${h * 0.13}Z`} fill={shade(c0, -0.1)} />
        <rect x={w * 0.18} y={h * 0.95} width={w * 0.64} height={h * 0.05} rx={2} fill={c1} />
      </g>
    );
  }
  if (variant === 'tulip') {
    return (
      <g>
        <ellipse cx={w / 2} cy={h * 0.05} rx={w / 2} ry={h * 0.05 + 2} fill={c0} />
        <rect x={0} y={h * 0.05} width={w} height={h * 0.05} fill={shade(c0, -0.1)} />
        <path d={`M${w * 0.44} ${h * 0.1} L${w * 0.44} ${h * 0.7} Q${w * 0.44} ${h * 0.92} ${w * 0.16} ${h * 0.98} L${w * 0.84} ${h * 0.98} Q${w * 0.56} ${h * 0.92} ${w * 0.56} ${h * 0.7} L${w * 0.56} ${h * 0.1}Z`} fill={c1} />
      </g>
    );
  }
  if (variant === 'stack') {
    const rings = [c0, c1, c2, c0];
    const rh = h / rings.length;
    return (
      <g>
        {rings.map((c, i) => (
          <rect key={i} x={w * (i % 2 ? 0.08 : 0)} y={i * rh} width={w * (i % 2 ? 0.84 : 1)} height={rh - 1} rx={rh / 2} fill={c} />
        ))}
        <rect x={w * 0.1} y={2} width={w * 0.5} height={3} rx={1.5} fill="#fff" opacity={0.45} />
      </g>
    );
  }
  // block
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} rx={3} fill={c0} />
      <rect x={w * 0.68} y={0} width={w * 0.32} height={h} rx={3} fill={shade(c0, -0.1)} />
      <rect x={0} y={0} width={w} height={h * 0.08} fill={shade(c0, 0.08)} />
      {[0.3, 0.55, 0.78].map((f) => <path key={f} d={`M4 ${h * f} q${w * 0.3} -4 ${w * 0.6} 0`} stroke={shade(c1, -0.12)} strokeWidth={1} fill="none" opacity={0.6} />)}
    </g>
  );
}

function Books({ x, y, w, colors }: { x: number; y: number; w: number; colors: string[] }) {
  const out = [];
  let cx = x;
  let i = 0;
  while (cx < x + w - 6) {
    const bw = 5 + ((i * 7) % 5);
    const bh = 22 + ((i * 11) % 14);
    out.push(<rect key={i} x={cx} y={y - bh} width={bw} height={bh} rx={1} fill={colors[i % colors.length]} />);
    cx += bw + 1;
    i++;
  }
  return <g>{out}</g>;
}

function Plant({ x, y, s = 1, pot = '#E9E1D3' }: { x: number; y: number; s?: number; pot?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-8 0 L-6 -14 L6 -14 L8 0Z" fill={pot} />
      <path d="M0 -14 C-14 -24 -16 -38 -4 -44 C-2 -32 0 -24 0 -14Z" fill="#5E8B5A" />
      <path d="M0 -14 C12 -22 18 -36 8 -46 C2 -34 0 -24 0 -14Z" fill="#76A56E" />
      <path d="M0 -14 C-2 -26 2 -40 0 -52 C4 -40 4 -26 0 -14Z" fill="#4D7A4A" />
    </g>
  );
}

function Shelf({ variant, w, h, colors }: ArtProps) {
  const [c0, c1 = c0, c2 = c1] = colors;
  const bookColors = [c1, '#E8DCC8', shade(c0, 0.25), '#7A8F6E', c2, '#2B2B2B'];
  if (variant === 'floating') {
    return (
      <g>
        <Books x={w * 0.06} y={0} w={w * 0.45} colors={bookColors} />
        <Plant x={w * 0.75} y={0} s={0.9} pot={c1} />
        <rect x={0} y={0} width={w} height={Math.max(h, 7)} rx={2} fill={c0} />
        <rect x={0} y={Math.max(h, 7) - 2} width={w} height={2} fill={shade(c0, -0.2)} />
      </g>
    );
  }
  if (variant === 'ladder') {
    const shelves = 4;
    return (
      <g>
        <path d={`M${w * 0.06} ${h} L${w * 0.2} 0 L${w * 0.26} 0 L${w * 0.13} ${h}Z`} fill={c0} />
        <path d={`M${w * 0.94} ${h} L${w * 0.8} 0 L${w * 0.74} 0 L${w * 0.87} ${h}Z`} fill={c0} />
        {Array.from({ length: shelves }, (_, i) => {
          const y = h * (0.22 + i * 0.24);
          const inset = w * (0.18 - i * 0.035);
          return (
            <g key={i}>
              {i === 0 && <Plant x={w / 2} y={y} s={0.75} />}
              {i === 1 && <Books x={inset + 4} y={y} w={w - inset * 2 - 8} colors={bookColors} />}
              {i === 2 && <g><rect x={w * 0.3} y={y - 26} width={14} height={26} rx={7} fill={c1} /><circle cx={w * 0.66} cy={y - 10} r={10} fill="#E8DCC8" /></g>}
              {i === 3 && <Books x={inset + 4} y={y} w={(w - inset * 2) * 0.5} colors={bookColors.slice(2)} />}
              <rect x={inset} y={y} width={w - inset * 2} height={5} rx={1} fill={shade(c0, -0.1)} />
            </g>
          );
        })}
      </g>
    );
  }
  if (variant === 'cube') {
    const cols = 2, rows = Math.max(2, Math.round(h / 55));
    const cw = w / cols, ch = h / rows;
    const fills = [c0, c1, c2];
    return (
      <g>
        {Array.from({ length: rows * cols }, (_, i) => {
          const cx = (i % cols) * cw, cy = Math.floor(i / cols) * ch;
          return (
            <g key={i}>
              <rect x={cx + 1} y={cy + 1} width={cw - 2} height={ch - 2} rx={4} fill={fills[i % 3]} />
              <rect x={cx + 6} y={cy + 6} width={cw - 12} height={ch - 12} rx={3} fill="#000" opacity={0.12} />
              {i % 3 === 0 ? <Books x={cx + 10} y={cy + ch - 6} w={cw - 20} colors={['#fff', '#FFD23F', '#B8A2FF']} /> : i % 3 === 1 ? <circle cx={cx + cw / 2} cy={cy + ch / 2 + 4} r={Math.min(cw, ch) * 0.2} fill="#fff" opacity={0.85} /> : null}
            </g>
          );
        })}
      </g>
    );
  }
  // bookcase / cabinet
  const rows = Math.max(2, Math.round(h / 60));
  const rh = (h - 10) / rows;
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} rx={3} fill={c0} />
      {Array.from({ length: rows }, (_, i) => {
        const y = 6 + i * rh;
        return (
          <g key={i}>
            <rect x={6} y={y} width={w - 12} height={rh - 6} fill={shade(c0, -0.18)} />
            {i % 2 === 0 ? <Books x={10} y={y + rh - 6} w={w - 20} colors={bookColors} /> : <g><Books x={10} y={y + rh - 6} w={w * 0.4} colors={bookColors.slice(1)} /><circle cx={w * 0.72} cy={y + rh - 16} r={Math.min(10, rh * 0.25)} fill={c1} /></g>}
          </g>
        );
      })}
      <rect x={0} y={h - 6} width={w} height={6} fill={shade(c0, -0.1)} />
    </g>
  );
}

function WallArt({ variant, w, h, colors, uid }: ArtProps) {
  const [c0, c1 = c0] = colors;
  const frame = '#2A2420';
  if (variant === 'grid') {
    const n = 3, gap = 8, fw = (w - gap * (n - 1)) / n;
    return (
      <g>
        {Array.from({ length: n }, (_, i) => (
          <g key={i} transform={`translate(${i * (fw + gap)} 0)`}>
            <rect width={fw} height={h} fill={frame} />
            <rect x={4} y={4} width={fw - 8} height={h - 8} fill={c0} />
            {i === 1 ? <circle cx={fw / 2} cy={h / 2} r={Math.min(fw, h) * 0.24} fill={c1} /> : <path d={`M${fw / 2} ${h - 10} C${fw * 0.1} ${h * 0.6} ${fw * 0.2} ${h * 0.25} ${fw / 2} 10 C${fw * 0.8} ${h * 0.25} ${fw * 0.9} ${h * 0.6} ${fw / 2} ${h - 10}Z`} fill={c1} opacity={0.85} />}
          </g>
        ))}
      </g>
    );
  }
  if (variant === 'neon') {
    return (
      <g>
        <rect x={0} y={0} width={w} height={h} rx={10} fill="#000" opacity={0.18} />
        <g filter={`url(#${uid}-neon)`}>
          <path d={`M${w * 0.14} ${h * 0.45} Q${w * 0.5} ${h * 1.05} ${w * 0.86} ${h * 0.45}`} stroke={c0} strokeWidth={5} fill="none" strokeLinecap="round" />
          <circle cx={w * 0.3} cy={h * 0.28} r={4} fill={c0} />
          <circle cx={w * 0.7} cy={h * 0.28} r={4} fill={c0} />
        </g>
        <path d={`M${w * 0.06} ${h * 0.14} q${w * 0.1} -${h * 0.1} ${w * 0.2} 0`} stroke={c1} strokeWidth={3} fill="none" strokeLinecap="round" filter={`url(#${uid}-neon)`} />
      </g>
    );
  }
  if (variant === 'poster') {
    return (
      <g>
        <rect width={w} height={h} fill={frame} />
        <rect x={4} y={4} width={w - 8} height={h - 8} fill="#FBEFD6" />
        <clipPath id={`${uid}-poster`}><rect x={4} y={4} width={w - 8} height={h - 8} /></clipPath>
        <g clipPath={`url(#${uid}-poster)`}>
          {[0.62, 0.48, 0.34, 0.2].map((r, i) => <circle key={r} cx={w / 2} cy={h * 0.72} r={w * r} fill={[c0, c1, '#2E7D7A', '#FBEFD6'][i]} />)}
          <rect x={4} y={h * 0.72} width={w} height={h} fill="#2E7D7A" />
        </g>
      </g>
    );
  }
  if (variant === 'line') {
    return (
      <g>
        <rect width={w} height={h} fill={frame} />
        <rect x={4} y={4} width={w - 8} height={h - 8} fill={c0} />
        <path d={`M${w * 0.2} ${h * 0.8} C${w * 0.3} ${h * 0.5} ${w * 0.25} ${h * 0.25} ${w * 0.5} ${h * 0.22} C${w * 0.72} ${h * 0.2} ${w * 0.75} ${h * 0.5} ${w * 0.58} ${h * 0.55} C${w * 0.45} ${h * 0.58} ${w * 0.5} ${h * 0.4} ${w * 0.6} ${h * 0.42} M${w * 0.42} ${h * 0.4} q4 4 8 0 M${w * 0.5} ${h * 0.62} C${w * 0.6} ${h * 0.75} ${w * 0.75} ${h * 0.8} ${w * 0.82} ${h * 0.8}`} stroke={c1} strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  // abstract
  return (
    <g>
      <rect width={w} height={h} fill={frame} />
      <rect x={4} y={4} width={w - 8} height={h - 8} fill="#F6F1E8" />
      <circle cx={w * 0.62} cy={h * 0.36} r={Math.min(w, h) * 0.24} fill={c0} />
      <path d={`M${w * 0.12} ${h * 0.86} C${w * 0.2} ${h * 0.5} ${w * 0.5} ${h * 0.7} ${w * 0.55} ${h * 0.5} C${w * 0.62} ${h * 0.3} ${w * 0.9} ${h * 0.6} ${w * 0.88} ${h * 0.86}Z`} fill={c1} />
    </g>
  );
}

/** Rug drawn flat then squashed into floor perspective. */
export function RugArt({ variant, w, d, colors, uid }: { variant: string; w: number; d: number; colors: string[]; uid: string }) {
  const [c0, c1 = c0, c2 = c1] = colors;
  const inset = Math.min(w, d) * 0.08;
  return (
    <g>
      <rect width={w} height={d} rx={variant === 'shag' ? d * 0.35 : 4} fill={c0} />
      {variant === 'solid' && <rect x={inset} y={inset} width={w - inset * 2} height={d - inset * 2} fill="none" stroke={c1} strokeWidth={Math.max(3, inset * 0.35)} />}
      {variant === 'striped' && Array.from({ length: 9 }, (_, i) => <rect key={i} x={(w / 9) * i + w / 36} y={0} width={w / 22} height={d} fill={i % 3 === 1 ? c2 : c1} opacity={0.9} />)}
      {variant === 'geometric' && (
        <g>
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M${(w / 7) * i + w / 14} ${d * 0.2} l${w / 22} ${d * 0.3} l-${w / 22} ${d * 0.3} l-${w / 22} -${d * 0.3}z`} fill={i % 2 ? c1 : c2} />
          ))}
          <rect x={inset / 2} y={inset / 2} width={w - inset} height={d - inset} fill="none" stroke={c1} strokeWidth={3} />
        </g>
      )}
      {variant === 'persian' && (
        <g>
          <rect x={inset} y={inset} width={w - inset * 2} height={d - inset * 2} fill="none" stroke={c1} strokeWidth={inset * 0.5} />
          <rect x={inset * 1.8} y={inset * 1.8} width={w - inset * 3.6} height={d - inset * 3.6} fill="none" stroke="#1F2A44" strokeWidth={2} />
          <ellipse cx={w / 2} cy={d / 2} rx={w * 0.18} ry={d * 0.28} fill="#1F2A44" />
          <ellipse cx={w / 2} cy={d / 2} rx={w * 0.11} ry={d * 0.17} fill={c1} />
          {[0.18, 0.82].map((f) => <circle key={f} cx={w * f} cy={d / 2} r={d * 0.08} fill={c1} />)}
        </g>
      )}
      {variant === 'shag' && Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(w * ((i * 37) % 100)) / 100} cy={(d * ((i * 53) % 100)) / 100} r={Math.max(2, d * 0.03)} fill={i % 2 ? c1 : '#fff'} opacity={0.25} />)}
      <rect width={w} height={d} rx={variant === 'shag' ? d * 0.35 : 4} fill={`url(#${uid}-rugshade)`} />
    </g>
  );
}
