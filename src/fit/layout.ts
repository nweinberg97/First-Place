import type { Product, Slot } from '../types';
import { PLACEHOLDER, laneOf } from '../data/room';
import { normalize } from './units';

/** Width used to draw/place an item: real if known, placeholder if the shop never said. */
export function drawWidth(p: Product): number {
  if (p.dimensions.source === 'missing') return PLACEHOLDER[p.slot].width;
  return normalize(p.dimensions).width;
}

/** Deterministic default arrangement for the Sample Studio. */
export function defaultX(slot: Slot, sel: Partial<Record<Slot, Product | undefined>>): number {
  const p = sel[slot];
  if (!p) return 0;
  const w = drawWidth(p);
  switch (slot) {
    case 'shelf':
      return laneOf(p) === 'wall' ? 20 : 4;
    case 'side-table':
      return 150 - w;
    case 'lamp':
      return 366;
    case 'chair':
      return 476 - w;
    case 'wall-art':
    case 'rug':
      return 260 - w / 2;
  }
}

export function defaultPositions(sel: Partial<Record<Slot, Product | undefined>>): Record<Slot, number> {
  const out = {} as Record<Slot, number>;
  (Object.keys(sel) as Slot[]).forEach((s) => (out[s] = defaultX(s, sel)));
  return out;
}
