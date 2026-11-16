import type { Lane, Product, Vibe } from '../types';
import { ROOM, OWNED, laneOf } from '../data/room';
import { freeSpan, fixedObstacles, type Interval } from './geometry';
import { normalize, type NormalizedDims } from './units';

export const TIGHT_CM = 5;

export type SpaceVerdict = 'fits' | 'tight' | 'wont-fit' | 'cant-tell';
export type DoorVerdict = 'gets-through' | 'tight' | 'wont-get-through' | 'cant-tell';
export type CompatVerdict = 'matches' | 'partial' | 'clashes';
export type Overall = 'Fits' | 'Probably fits' | 'Squeeze' | "Won't fit" | "Can't tell";

export interface SpaceScore {
  verdict: SpaceVerdict;
  estimated: boolean;
  spareCm: number | null;
  spanCm: number | null;
  overlapsWith: string | null;
  note: string;
}

export interface PlacedItem {
  product: Product;
  x: number;
}

/** Width/depth used for scoring, or null when the merchant never stated it. */
export function scoringDims(p: Product): NormalizedDims | null {
  if (p.dimensions.source === 'missing') return null;
  return normalize(p.dimensions);
}

export function scoreSpace(target: PlacedItem, staged: PlacedItem[]): SpaceScore {
  const d = scoringDims(target.product);
  if (!d) {
    return { verdict: 'cant-tell', estimated: false, spareCm: null, spanCm: null, overlapsWith: null, note: 'The shop never published dimensions.' };
  }
  const estimated = d.source === 'inferred';
  const lane = laneOf(target.product);

  if (lane === 'rug') {
    const spare = Math.min(ROOM.rugZone.w - d.width, ROOM.rugZone.d - d.depth);
    const verdict: SpaceVerdict = spare < 0 ? 'wont-fit' : spare <= TIGHT_CM ? 'tight' : 'fits';
    return { verdict, estimated, spareCm: spare, spanCm: ROOM.rugZone.w, overlapsWith: null, note: `Clear floor in front of the couch is ${ROOM.rugZone.w} × ${ROOM.rugZone.d} cm.` };
  }

  const others: Interval[] = [
    ...fixedObstacles(lane),
    ...staged
      .filter((s) => s.product.id !== target.product.id && laneOf(s.product) === lane)
      .map((s) => {
        const sd = scoringDims(s.product) ?? normalize(s.product.dimensions);
        return { id: s.product.id, label: `the ${s.product.title}`, x: s.x, w: sd.width || 60 };
      }),
  ];
  const r = freeSpan({ id: target.product.id, label: target.product.title, x: target.x, w: d.width }, others);
  let verdict: SpaceVerdict;
  let note: string;
  if (r.spare < 0) {
    verdict = 'wont-fit';
    note = `Needs ${Math.round(d.width)} cm but this gap is ${Math.round(r.span)} cm.`;
  } else if (r.overlapsWith) {
    verdict = 'wont-fit';
    note = `It overlaps ${r.overlapsWith}. Drag it into the free gap.`;
  } else if (r.spare <= TIGHT_CM) {
    verdict = 'tight';
    note = `Fits with only ${Math.round(r.spare)} cm to spare.`;
  } else {
    verdict = 'fits';
    note = `${Math.round(r.spare)} cm to spare in a ${Math.round(r.span)} cm gap.`;
  }
  return { verdict, estimated, spareCm: r.spare, spanCm: r.span, overlapsWith: r.overlapsWith, note };
}

export interface DoorScore {
  verdict: DoorVerdict;
  estimated: boolean;
  clearanceCm: number | null;
  usedPackage: boolean;
  note: string;
}

/** Can the box (or the item, if no box size is known) get through the front door? Rotation allowed. */
export function scoreDoorway(p: Product, doorWidth: number, doorHeight = ROOM.doorHeight): DoorScore {
  if (p.slot === 'rug' && p.dimensions.source !== 'missing') {
    return { verdict: 'gets-through', estimated: false, clearanceCm: null, usedPackage: false, note: 'Rugs ship rolled, so they go through any door.' };
  }
  const usedPackage = !!p.packageDimensions;
  const src = p.packageDimensions ?? p.dimensions;
  if (src.source === 'missing') {
    return { verdict: 'cant-tell', estimated: false, clearanceCm: null, usedPackage, note: 'No box or product size to check against your door.' };
  }
  const n = normalize(src);
  const [a, b] = [n.width, n.depth, n.height].sort((x, y) => x - y);
  // Smallest face must pass: shortest side through the door width, second-shortest under the door height.
  const clearance = doorWidth - a;
  const estimated = !usedPackage || n.source === 'inferred';
  let verdict: DoorVerdict;
  if (clearance < 0 || b > doorHeight) verdict = 'wont-get-through';
  else if (clearance <= TIGHT_CM) verdict = 'tight';
  else verdict = 'gets-through';
  const basis = usedPackage ? 'box' : 'item (no box size published)';
  const note =
    verdict === 'wont-get-through'
      ? `Its ${basis} is ${Math.round(a)} cm at its narrowest. Your door is ${Math.round(doorWidth)} cm.`
      : verdict === 'tight'
        ? `Tight squeeze through that door: ${Math.round(clearance)} cm to spare, turned on its side.`
        : `Its ${basis} clears your ${Math.round(doorWidth)} cm door by ${Math.round(clearance)} cm.`;
  return { verdict, estimated, clearanceCm: clearance, usedPackage, note };
}

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}
const saturation = (h: string) => {
  const [r, g, b] = hex(h).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
};

export interface CompatScore {
  verdict: CompatVerdict;
  score: number; // 0..1
  note: string;
}

/** Inferred: style tags vs the vibe, and colour vs the vibe palette + what you already own. */
export function scoreCompat(p: Product, vibe: Vibe): CompatScore {
  const overlap = p.styleTags.filter((t) => vibe.tags.includes(t)).length;
  const paletteHit = p.colors.some((c) => vibe.palette.some((v) => colorDistance(c, v) < 70));
  const neutral = p.colors.every((c) => saturation(c) < 0.25);
  const points = Math.min(overlap, 2) / 2 * 0.6 + (paletteHit ? 0.3 : neutral ? 0.2 : 0) + 0.1;
  const verdict: CompatVerdict = points >= 0.7 ? 'matches' : points >= 0.4 ? 'partial' : 'clashes';
  const owned = OWNED[p.slot === 'side-table' || p.slot === 'rug' ? 1 : 0];
  const note =
    verdict === 'matches'
      ? `Looks good with your ${owned.label.toLowerCase()} and the ${vibe.name} vibe.`
      : verdict === 'partial'
        ? `Works, but it's a bit off-vibe for ${vibe.name}.`
        : `Fights the ${vibe.name} palette. It's bold, but intentional?`;
  return { verdict, score: points, note };
}

export interface RenterFlag {
  label: string;
  tone: 'bad' | 'warn' | 'good';
}

export function scoreRenter(p: Product, opts: { noDrilling: boolean; walkUp: boolean }): RenterFlag[] {
  const flags: RenterFlag[] = [];
  if (p.needsDrilling) flags.push(opts.noDrilling ? { label: 'Needs drilling. Not lease-friendly', tone: 'bad' } : { label: 'Needs drilling', tone: 'warn' });
  if ((p.weightKg ?? 0) > 30) flags.push(opts.walkUp ? { label: `Heavy (${p.weightKg} kg) for a walk-up`, tone: 'warn' } : { label: `Heavy (${p.weightKg} kg)`, tone: 'warn' });
  if (p.flatPack) flags.push({ label: 'Ships flat-packed', tone: 'good' });
  if (p.foldable) flags.push({ label: p.slot === 'rug' ? 'Rolls up' : 'Folds flat', tone: 'good' });
  if (!p.needsDrilling) flags.push({ label: 'No tools on walls', tone: 'good' });
  return flags;
}

export function overallVerdict(space: SpaceScore, door: DoorScore): Overall {
  if (space.verdict === 'cant-tell') return "Can't tell";
  if (space.verdict === 'wont-fit' || door.verdict === 'wont-get-through') return "Won't fit";
  if (space.verdict === 'tight' || door.verdict === 'tight') return 'Squeeze';
  if (space.estimated) return 'Probably fits';
  return 'Fits';
}

export interface Receipt {
  space: SpaceScore;
  door: DoorScore;
  compat: CompatScore;
  renter: RenterFlag[];
  overall: Overall;
  hasWarning: boolean;
}

export function buildReceipt(
  target: PlacedItem,
  staged: PlacedItem[],
  ctx: { vibe: Vibe; doorWidth: number; noDrilling: boolean; walkUp: boolean },
): Receipt {
  const space = scoreSpace(target, staged);
  const door = scoreDoorway(target.product, ctx.doorWidth);
  const compat = scoreCompat(target.product, ctx.vibe);
  const renter = scoreRenter(target.product, ctx);
  const overall = overallVerdict(space, door);
  const hasWarning = space.verdict === 'wont-fit' || door.verdict === 'wont-get-through' || renter.some((f) => f.tone === 'bad');
  return { space, door, compat, renter, overall, hasWarning };
}

export interface BudgetLine {
  price: number;
  qty: number;
}
export function roomTotal(lines: BudgetLine[]): number {
  return lines.reduce((s, l) => s + l.price * l.qty, 0);
}
export function budgetStatus(total: number, budget: number) {
  const remaining = budget - total;
  return { total, remaining, over: remaining < 0, label: remaining < 0 ? `Over by $${Math.abs(remaining).toLocaleString()}` : `$${remaining.toLocaleString()} left` };
}

export type { Lane };
