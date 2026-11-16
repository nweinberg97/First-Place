import type { Product, Slot, VibeId } from './types';
import { SLOTS } from './types';
import { vibeById } from './data/vibes';
import { buildReceipt, budgetStatus, roomTotal, type PlacedItem, type Receipt } from './fit/score';
import { defaultPositions } from './fit/layout';
import { effective, vibeSet, type State } from './store';

export interface RoomView {
  products: Partial<Record<Slot, Product>>;
  placed: Partial<Record<Slot, PlacedItem>>;
  receipts: Partial<Record<Slot, Receipt>>;
  total: number;
  budget: ReturnType<typeof budgetStatus>;
  shops: number;
  pieces: number;
  warnings: number;
  vibeMatch: number;
}

const cache = new WeakMap<State, RoomView>();

export function computeRoom(
  selection: Record<Slot, string | null>,
  positions: Record<Slot, number>,
  qty: Record<Slot, number>,
  s: Pick<State, 'answered' | 'vibe' | 'doorWidth' | 'noDrilling' | 'walkUp' | 'budget'>,
): RoomView {
  const vibe = vibeById(s.vibe);
  const products: RoomView['products'] = {};
  const placed: RoomView['placed'] = {};
  SLOTS.forEach((slot) => {
    const p = effective(selection[slot], s.answered);
    if (p) {
      products[slot] = p;
      placed[slot] = { product: p, x: positions[slot] ?? 0 };
    }
  });
  const staged = Object.values(placed) as PlacedItem[];
  const receipts: RoomView['receipts'] = {};
  SLOTS.forEach((slot) => {
    const it = placed[slot];
    if (it) receipts[slot] = buildReceipt(it, staged, { vibe, doorWidth: s.doorWidth, noDrilling: s.noDrilling, walkUp: s.walkUp });
  });
  const lines = SLOTS.filter((sl) => products[sl]).map((sl) => ({ price: products[sl]!.price.amount, qty: qty[sl] ?? 1 }));
  const total = roomTotal(lines);
  const rs = Object.values(receipts) as Receipt[];
  return {
    products,
    placed,
    receipts,
    total,
    budget: budgetStatus(total, s.budget),
    shops: new Set(Object.values(products).map((p) => p!.merchant.name)).size,
    pieces: lines.length,
    warnings: rs.filter((r) => r.hasWarning).length,
    vibeMatch: rs.length ? Math.round((rs.reduce((a, r) => a + r.compat.score, 0) / rs.length) * 100) : 0,
  };
}

export function deriveRoom(s: State): RoomView {
  const hit = cache.get(s);
  if (hit) return hit;
  const v = computeRoom(s.selection, s.positions, s.qty, s);
  cache.set(s, v);
  return v;
}

/** What a vibe would look like with its default picks: for the comparison strip. */
export function previewVibe(vibe: VibeId, s: State): RoomView {
  const selection = vibeSet(vibe);
  const products: Partial<Record<Slot, Product>> = {};
  SLOTS.forEach((sl) => (products[sl] = effective(selection[sl], s.answered)));
  const positions = defaultPositions(products);
  const qty = { rug: 1, chair: 1, lamp: 1, 'side-table': 1, shelf: 1, 'wall-art': 1 } as Record<Slot, number>;
  return computeRoom(selection, positions, qty, { ...s, vibe });
}

/** Receipt a candidate WOULD get if swapped into the room right now (used by Discover). */
export function candidateReceipt(slot: Slot, productId: string, s: State) {
  const selection = { ...s.selection, [slot]: productId };
  const products: Partial<Record<Slot, Product>> = {};
  SLOTS.forEach((sl) => (products[sl] = effective(selection[sl], s.answered)));
  const positions = { ...s.positions, [slot]: defaultPositions(products)[slot] };
  return computeRoom(selection, positions, s.qty, s);
}
