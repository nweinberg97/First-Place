import type { Product } from '../types';
import { normalize } from '../fit/units';
import { PLACEHOLDER } from '../data/room';
import { ProductArt, RugArt } from '../scene/ProductArt';
import type { Overall } from '../fit/score';

export function ProductThumb({ p, size = 56, bg = '#F4F1EC' }: { p: Product; size?: number; bg?: string }) {
  const d = p.dimensions.source === 'missing' ? PLACEHOLDER[p.slot] : normalize(p.dimensions);
  const uid = `th-${p.id.slice(-6)}`;
  if (p.slot === 'rug') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className="thumb" style={{ background: bg }} aria-hidden>
        <defs><linearGradient id={`${uid}-rugshade`}><stop offset="0" stopOpacity="0" /></linearGradient></defs>
        <g transform="translate(10 28)"><RugArt variant={p.illustration.variant} w={80} d={44} colors={p.colors} uid={uid} /></g>
      </svg>
    );
  }
  const w = Math.max(d.width, 10), h = Math.max(d.height, p.slot === 'shelf' && p.illustration.variant === 'floating' ? 30 : 10);
  const scale = 76 / Math.max(w, h);
  const W = w * scale, H = h * scale;
  const floating = p.slot === 'shelf' && p.illustration.variant === 'floating';
  const arcPad = p.slot === 'lamp' && p.illustration.variant === 'arc';
  return (
    <svg width={size} height={size} viewBox={arcPad ? '-60 0 160 100' : '0 0 100 100'} className="thumb" style={{ background: bg }} aria-hidden>
      <defs>
        <radialGradient id={`${uid}-glow`}><stop offset="0" stopColor="#FFF4DC" stopOpacity="0.8" /><stop offset="1" stopColor="#FFF4DC" stopOpacity="0" /></radialGradient>
        <filter id={`${uid}-neon`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g transform={`translate(${(100 - W) / 2} ${floating ? 70 : (100 - H) / 2 + (H < 60 ? 10 : 0)})`} opacity={p.dimensions.source === 'missing' ? 0.6 : 1}>
        <ProductArt slot={p.slot} variant={p.illustration.variant} w={W} h={floating ? 6 : H} colors={p.colors} uid={uid} />
      </g>
    </svg>
  );
}

const VERDICT_STYLE: Record<Overall, { cls: string; label: string }> = {
  Fits: { cls: 'v-good', label: 'Fits ✓' },
  'Probably fits': { cls: 'v-est', label: 'Probably fits' },
  Squeeze: { cls: 'v-warn', label: 'Squeeze' },
  "Won't fit": { cls: 'v-bad', label: "Won't fit" },
  "Can't tell": { cls: 'v-est', label: "Can't tell" },
};

export function VerdictPill({ v, small }: { v: Overall; small?: boolean }) {
  const s = VERDICT_STYLE[v];
  return <span className={`pill ${s.cls} ${small ? 'pill-sm' : ''}`}>{s.label}</span>;
}

export function SourceBadge({ source }: { source: Product['dimensions']['source'] }) {
  if (source === 'stated') return <span className="src src-stated">● Sample merchant dimensions</span>;
  if (source === 'inferred') return <span className="src src-inferred">◐ Estimated size (sample)</span>;
  return <span className="src src-missing">○ Dimensions unknown</span>;
}

export function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden>
      <path d="M22 36 L14 60 L24 54 L30 62 L32 38Z" fill="#5A31F4" />
      <path d="M42 36 L50 60 L40 54 L34 62 L32 38Z" fill="#7B5CFF" />
      <circle cx="32" cy="26" r="22" fill="#008060" />
      <circle cx="32" cy="26" r="16.5" fill="none" stroke="#95BF47" strokeWidth="3" strokeDasharray="3 3" />
      <text x="32" y="32.5" textAnchor="middle" fontFamily="Inter, Arial Black, sans-serif" fontWeight="900" fontSize="17" fill="#fff">1st</text>
    </svg>
  );
}
