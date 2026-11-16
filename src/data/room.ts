import type { Dimensions, Lane, Product, Slot } from '../types';

/** Sample Studio. All geometry in centimetres; the scene renders at 2 px per cm. */
export const ROOM = {
  name: 'My first place',
  wallWidth: 480,
  wallHeight: 260,
  doorHeight: 203,
  defaultDoorWidth: 76,
  window: { x: 340, w: 120, bottom: 95, top: 215 },
  rugZone: { w: 320, d: 240 },
  artBottom: 112,
  wallShelfBottom: 138,
};

export interface OwnedItem {
  id: string;
  label: string;
  color: string;
  x: number;
  width: number;
  depth: number;
  height: number;
  lane: Lane | 'front';
}

export const OWNED: OwnedItem[] = [
  { id: 'couch', label: 'Grey couch', color: '#8E9196', x: 160, width: 200, depth: 88, height: 82, lane: 'floor' },
  { id: 'coffee-table', label: 'Oak coffee table', color: '#C49A6C', x: 210, width: 100, depth: 55, height: 42, lane: 'front' },
];

/** Placeholder footprint drawn (dashed) when a merchant hasn't published dimensions. Never used for scoring. */
export const PLACEHOLDER: Record<Slot, Dimensions> = {
  rug: { width: 200, depth: 140, height: 1, unit: 'cm', source: 'missing' },
  chair: { width: 70, depth: 75, height: 80, unit: 'cm', source: 'missing' },
  lamp: { width: 36, depth: 36, height: 150, unit: 'cm', source: 'missing' },
  'side-table': { width: 42, depth: 42, height: 50, unit: 'cm', source: 'missing' },
  shelf: { width: 70, depth: 30, height: 120, unit: 'cm', source: 'missing' },
  'wall-art': { width: 60, depth: 2, height: 80, unit: 'cm', source: 'missing' },
};

export function laneOf(p: Product): Lane {
  if (p.slot === 'rug') return 'rug';
  if (p.slot === 'wall-art') return 'wall';
  if (p.slot === 'shelf' && p.illustration.variant === 'floating') return 'wall';
  return 'floor';
}
