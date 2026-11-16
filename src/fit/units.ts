import type { Dimensions, Unit } from '../types';

export const CM_PER_IN = 2.54;

export const inToCm = (inches: number) => inches * CM_PER_IN;
export const cmToIn = (cm: number) => cm / CM_PER_IN;

/** Normalised dimensions: always centimetres, original unit preserved for provenance. */
export interface NormalizedDims {
  width: number;
  depth: number;
  height: number;
  source: Dimensions['source'];
  originalUnit: Unit;
}

export function normalize(d: Dimensions): NormalizedDims {
  const f = d.unit === 'in' ? CM_PER_IN : 1;
  return {
    width: round1(d.width * f),
    depth: round1(d.depth * f),
    height: round1(d.height * f),
    source: d.source,
    originalUnit: d.unit,
  };
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function fmtLen(cm: number, unit: Unit): string {
  if (unit === 'in') return `${Math.round(cmToIn(cm))}″`;
  return `${Math.round(cm)} cm`;
}

export function fmtDims(n: NormalizedDims, unit: Unit): string {
  if (n.source === 'missing') return 'Not provided';
  const v = (cm: number) => (unit === 'in' ? Math.round(cmToIn(cm)) : Math.round(cm));
  const u = unit === 'in' ? 'in' : 'cm';
  return `${v(n.width)} × ${v(n.depth)} × ${v(n.height)} ${u}`;
}
