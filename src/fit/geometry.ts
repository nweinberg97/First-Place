import type { Lane } from '../types';
import { ROOM } from '../data/room';

export interface Interval {
  id: string;
  label: string;
  x: number;
  w: number;
}

export interface SpanResult {
  /** Free span between the nearest neighbours on either side of the item's centre. */
  left: number;
  right: number;
  span: number;
  spare: number;
  overlapsWith: string | null;
}

/** Fixed obstacles per lane (things the user can't move). */
export function fixedObstacles(lane: Lane): Interval[] {
  if (lane === 'floor') return [{ id: 'couch', label: 'your couch', x: 160, w: 200 }];
  if (lane === 'wall') return [{ id: 'window', label: 'the window', x: ROOM.window.x, w: ROOM.window.w }];
  return [];
}

/**
 * Finds the free span an item sits in, given the other objects in its lane.
 * Pure + deterministic: same inputs, same answer.
 */
export function freeSpan(item: Interval, others: Interval[], wallWidth = ROOM.wallWidth): SpanResult {
  const centre = item.x + item.w / 2;
  let left = 0;
  let right = wallWidth;
  let overlapsWith: string | null = null;
  for (const o of others) {
    const oc = o.x + o.w / 2;
    if (oc <= centre) left = Math.max(left, o.x + o.w);
    else right = Math.min(right, o.x);
    const overlap = item.x < o.x + o.w - 0.01 && item.x + item.w > o.x + 0.01;
    if (overlap && !overlapsWith) overlapsWith = o.label;
  }
  if (!overlapsWith && (item.x < -0.01 || item.x + item.w > wallWidth + 0.01)) overlapsWith = 'the wall edge';
  const span = Math.max(0, right - left);
  return { left, right, span, spare: span - item.w, overlapsWith };
}
