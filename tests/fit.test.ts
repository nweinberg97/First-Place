import { describe, expect, it } from 'vitest';
import { cmToIn, inToCm, normalize } from '../src/fit/units';
import { freeSpan } from '../src/fit/geometry';
import { budgetStatus, buildReceipt, overallVerdict, roomTotal, scoreDoorway, scoreRenter, scoreSpace, type PlacedItem } from '../src/fit/score';
import { PRODUCTS } from '../src/data/products';
import { vibeById } from '../src/data/vibes';
import type { Dimensions, Product } from '../src/types';

const byTitle = (t: string) => PRODUCTS.find((p) => p.title === t)!;
const withDims = (p: Product, d: Partial<Dimensions>): Product => ({ ...p, dimensions: { ...p.dimensions, ...d } });
const chair = (w: number, source: Dimensions['source'] = 'stated'): Product =>
  withDims(byTitle('Arlo Lounge Chair'), { width: w, depth: 70, height: 78, unit: 'cm', source });
const lamp = byTitle('Arc Reading Lamp'); // 36 cm wide, stated

describe('units', () => {
  it('converts inches to cm and back', () => {
    expect(inToCm(10)).toBeCloseTo(25.4);
    expect(cmToIn(25.4)).toBeCloseTo(10);
  });
  it('normalises to cm and preserves the original unit', () => {
    const n = normalize({ width: 30, depth: 31, height: 29, unit: 'in', source: 'stated' });
    expect(n.width).toBeCloseTo(76.2);
    expect(n.originalUnit).toBe('in');
  });
});

describe('space fit', () => {
  // Lamp at 366–402; right wall at 480 → a 78 cm gap for the chair.
  const lampAt: PlacedItem = { product: lamp, x: 366 };
  it('fits with room to spare', () => {
    const c = chair(68);
    expect(scoreSpace({ product: c, x: 476 - 68 }, [lampAt]).verdict).toBe('fits');
  });
  it('is tight with 5 cm or less', () => {
    const c = chair(74);
    expect(scoreSpace({ product: c, x: 476 - 74 }, [lampAt]).verdict).toBe('tight');
  });
  it("won't fit when wider than the gap", () => {
    const c = chair(88);
    expect(scoreSpace({ product: c, x: 388 }, [lampAt]).verdict).toBe('wont-fit');
  });
  it('flags overlap with the owned couch', () => {
    const c = chair(68);
    const r = scoreSpace({ product: c, x: 330 }, [lampAt]);
    expect(r.verdict).toBe('wont-fit');
    expect(r.overlapsWith).toBe('your couch');
  });
  it('flags overlap with another staged product', () => {
    const r = freeSpan({ id: 'a', label: 'a', x: 380, w: 60 }, [{ id: 'b', label: 'the lamp', x: 366, w: 36 }]);
    expect(r.overlapsWith).toBe('the lamp');
  });
});

describe('doorway', () => {
  it('passes through', () => {
    expect(scoreDoorway(byTitle('Arlo Lounge Chair'), 76).verdict).toBe('gets-through');
  });
  it('passes when rotated (a tall bookcase box goes in on its side)', () => {
    expect(scoreDoorway(byTitle('Glass Front Bookcase'), 76).verdict).toBe('gets-through');
  });
  it('is a tight squeeze', () => {
    expect(scoreDoorway(byTitle('Bubble Pouf Chair'), 72).verdict).toBe('tight');
  });
  it("can't pass", () => {
    expect(scoreDoorway(byTitle('Cognac Leather Club Chair'), 76).verdict).toBe('wont-get-through');
  });
  it('qualifies results without package dimensions as estimates', () => {
    const r = scoreDoorway(byTitle('Arc Reading Lamp'), 76);
    expect(r.usedPackage).toBe(false);
    expect(r.estimated).toBe(true);
  });
});

describe('confidence', () => {
  const ctx = { vibe: vibeById('modern'), doorWidth: 76, noDrilling: true, walkUp: true };
  const lampAt: PlacedItem = { product: lamp, x: 366 };
  it('stated + passing geometry → Fits', () => {
    expect(buildReceipt({ product: chair(68), x: 408 }, [lampAt], ctx).overall).toBe('Fits');
  });
  it('inferred dimensions never say a plain Fits', () => {
    expect(buildReceipt({ product: chair(60, 'inferred'), x: 410 }, [lampAt], ctx).overall).toBe('Probably fits');
  });
  it("missing dimensions → Can't tell", () => {
    const egg = byTitle('Mod Egg Chair');
    expect(buildReceipt({ product: egg, x: 406 }, [lampAt], ctx).overall).toBe("Can't tell");
  });
  it('a merchant answer upgrades missing → stated', () => {
    const egg = byTitle('Mod Egg Chair');
    const answered = { ...egg, dimensions: egg.merchantQuestionResponse!.dimensions };
    expect(answered.dimensions.source).toBe('stated');
    expect(buildReceipt({ product: answered, x: 410 }, [lampAt], ctx).overall).toBe('Fits');
  });
  it('overall verdict surfaces the worst geometric failure', () => {
    const space = scoreSpace({ product: chair(68), x: 408 }, [lampAt]);
    expect(overallVerdict(space, scoreDoorway(byTitle('Cognac Leather Club Chair'), 76))).toBe("Won't fit");
  });
});

describe('renter settings', () => {
  const shelf = byTitle('Float Oak Wall Shelf');
  it('drilling fails when no-drilling is on', () => {
    expect(scoreRenter(shelf, { noDrilling: true, walkUp: false }).some((f) => f.tone === 'bad')).toBe(true);
  });
  it('drilling is only a heads-up when no-drilling is off', () => {
    expect(scoreRenter(shelf, { noDrilling: false, walkUp: false }).some((f) => f.tone === 'bad')).toBe(false);
  });
  it('items over 30 kg warn for a walk-up', () => {
    const flags = scoreRenter(byTitle('Iron Pipe Bookcase'), { noDrilling: true, walkUp: true });
    expect(flags.some((f) => f.label.includes('walk-up'))).toBe(true);
  });
  it('shows flat-pack and foldable', () => {
    const flags = scoreRenter(byTitle('Canvas Sling Chair'), { noDrilling: true, walkUp: true }).map((f) => f.label);
    expect(flags).toContain('Ships flat-packed');
    expect(flags).toContain('Folds flat');
  });
});

describe('budget', () => {
  const lines = [{ price: 249, qty: 1 }, { price: 119, qty: 1 }, { price: 89, qty: 2 }];
  it('within budget', () => {
    expect(budgetStatus(roomTotal(lines), 1200).over).toBe(false);
  });
  it('over budget', () => {
    expect(budgetStatus(roomTotal(lines), 400)).toMatchObject({ over: true, remaining: -146 });
  });
  it('reacts to a budget change', () => {
    expect(budgetStatus(546, 600).remaining).toBe(54);
  });
  it('reacts to a swap and a removal', () => {
    const swapped = [{ price: 429, qty: 1 }, ...lines.slice(1)];
    expect(roomTotal(swapped)).toBe(726);
    expect(roomTotal(lines.slice(0, 2))).toBe(368);
  });
});

describe('catalog fixture', () => {
  it('has 60 products: 5 vibes × 6 slots × 2 options', () => {
    expect(PRODUCTS.length).toBe(60);
  });
  it('every product has explicit dimension provenance', () => {
    expect(PRODUCTS.every((p) => ['stated', 'inferred', 'missing'].includes(p.dimensions.source))).toBe(true);
  });
});
