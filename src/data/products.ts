import type { Dimensions, DimensionSource, Merchant, Product, Slot, Unit, VibeId } from '../types';

/**
 * Simulated catalog: 60 products = 5 vibes × 6 slots × 2 options, from 10 invented
 * independent shops. Shaped like data an agent would assemble from Shopify's Global
 * Catalog (search_catalog → get_product). Fit verdicts are NEVER stored here; they are
 * computed from live room state by src/fit.
 */

export const MERCHANTS: Merchant[] = [
  { name: 'Juniper & Oak', domain: 'juniperandoak.shop' },
  { name: 'Second Story Supply', domain: 'secondstorysupply.shop' },
  { name: 'Lowtide Studio', domain: 'lowtidestudio.shop' },
  { name: 'Sunday Objects', domain: 'sundayobjects.shop' },
  { name: 'Little Elsewhere', domain: 'littleelsewhere.shop' },
  { name: 'Form & Found', domain: 'formandfound.shop' },
  { name: 'Soft Corner', domain: 'softcorner.shop' },
  { name: 'Good Measure', domain: 'goodmeasure.shop' },
  { name: 'House of Sunday', domain: 'houseofsunday.shop' },
  { name: 'Common Ground Goods', domain: 'commongroundgoods.shop' },
];

const CATEGORY: Record<Slot, string> = {
  rug: 'Home & Garden > Decor > Rugs',
  chair: 'Furniture > Chairs > Arm & Accent Chairs',
  lamp: 'Home & Garden > Lighting > Lamps > Floor Lamps',
  'side-table': 'Furniture > Tables > Accent Tables > End Tables',
  shelf: 'Furniture > Shelving > Bookcases & Standing Shelves',
  'wall-art': 'Home & Garden > Decor > Artwork > Posters, Prints & Visual Artwork',
};

const dims = (w: number, d: number, h: number, unit: Unit = 'cm', source: DimensionSource = 'stated'): Dimensions => ({
  width: w,
  depth: d,
  height: h,
  unit,
  source,
});
const MISSING: Dimensions = { width: 0, depth: 0, height: 0, unit: 'cm', source: 'missing' };

interface Row {
  vibe: VibeId;
  slot: Slot;
  option: 'A' | 'B';
  title: string;
  m: number;
  price: number;
  d: Dimensions;
  variant: string;
  colors: string[];
  tags: string[];
  pkg?: Dimensions;
  kg?: number;
  flat?: boolean;
  fold?: boolean;
  drill?: boolean;
  ask?: { answer: string; dimensions: Dimensions };
}

const ROWS: Row[] = [
  // ── MODERN ──────────────────────────────────────────────
  { vibe: 'modern', slot: 'rug', option: 'A', title: 'Oat Loop Wool Rug', m: 6, price: 189, d: dims(240, 170, 1), variant: 'solid', colors: ['#E6DCCB', '#CDBFA8'], tags: ['minimal', 'neutral', 'natural'], kg: 9, fold: true },
  { vibe: 'modern', slot: 'rug', option: 'B', title: 'Linear Stripe Flatweave', m: 9, price: 159, d: dims(96, 60, 0.4, 'in'), variant: 'striped', colors: ['#E4DFD6', '#3A3A3A'], tags: ['modern', 'minimal'], kg: 6, fold: true },
  { vibe: 'modern', slot: 'chair', option: 'A', title: 'Arlo Lounge Chair', m: 5, price: 249, d: dims(68, 76, 78), variant: 'midcentury', colors: ['#D8CFC2', '#9C7A54'], tags: ['modern', 'minimal', 'natural'], pkg: dims(70, 72, 50), kg: 14 },
  { vibe: 'modern', slot: 'chair', option: 'B', title: 'Bouclé Cloud Chair', m: 4, price: 299, d: dims(30, 31, 29, 'in'), variant: 'round', colors: ['#F1ECE4', '#E2D9CC'], tags: ['modern', 'neutral'], pkg: dims(32, 32, 30, 'in'), kg: 19 },
  { vibe: 'modern', slot: 'lamp', option: 'A', title: 'Halo Tripod Lamp', m: 3, price: 119, d: dims(40, 40, 150, 'cm', 'inferred'), variant: 'tripod', colors: ['#2B2B2B', '#F3EDE3'], tags: ['modern', 'minimal'], kg: 4, flat: true },
  { vibe: 'modern', slot: 'lamp', option: 'B', title: 'Arc Reading Lamp', m: 7, price: 149, d: dims(36, 30, 180), variant: 'arc', colors: ['#2B2B2B', '#F3EDE3'], tags: ['modern'], kg: 7, flat: true },
  { vibe: 'modern', slot: 'side-table', option: 'A', title: 'Plinth Side Table', m: 0, price: 79, d: dims(40, 40, 50), variant: 'block', colors: ['#C9A57A', '#B08A5E'], tags: ['minimal', 'natural'], kg: 6, flat: true },
  { vibe: 'modern', slot: 'side-table', option: 'B', title: 'Travertine Drum Table', m: 8, price: 99, d: dims(16, 16, 20, 'in'), variant: 'pedestal', colors: ['#DCCFBF', '#C7B8A4'], tags: ['modern', 'natural'], kg: 22 },
  { vibe: 'modern', slot: 'shelf', option: 'A', title: 'Float Oak Wall Shelf', m: 0, price: 89, d: dims(80, 22, 4), variant: 'floating', colors: ['#C9A57A', '#B08A5E'], tags: ['minimal', 'natural'], kg: 4, flat: true, drill: true },
  { vibe: 'modern', slot: 'shelf', option: 'B', title: 'Lean Ladder Shelf', m: 5, price: 129, d: dims(60, 35, 180), variant: 'ladder', colors: ['#C9A57A', '#8F7254'], tags: ['modern', 'natural'], kg: 11, flat: true },
  { vibe: 'modern', slot: 'wall-art', option: 'A', title: 'Soft Horizon Print', m: 2, price: 65, d: dims(24, 1, 32, 'in'), variant: 'abstract', colors: ['#E8C9A9', '#9AA59A'], tags: ['minimal', 'neutral'], kg: 2 },
  { vibe: 'modern', slot: 'wall-art', option: 'B', title: 'One Line Portrait', m: 4, price: 85, d: dims(50, 2, 70, 'cm', 'inferred'), variant: 'line', colors: ['#F5F1EA', '#1A1A1A'], tags: ['modern', 'minimal'], kg: 2 },

  // ── RETRO ───────────────────────────────────────────────
  { vibe: 'retro', slot: 'rug', option: 'A', title: 'Sunburst Shag Rug', m: 1, price: 169, d: dims(200, 140, 3), variant: 'shag', colors: ['#D9622B', '#E8B04B'], tags: ['retro', 'warm', 'playful'], kg: 8, fold: true },
  { vibe: 'retro', slot: 'rug', option: 'B', title: 'Groovy Geo Rug', m: 8, price: 199, d: dims(96, 60, 0.5, 'in'), variant: 'geometric', colors: ['#2E7D7A', '#E8B04B', '#D9622B'], tags: ['retro', 'mid-century'], kg: 7, fold: true },
  {
    vibe: 'retro', slot: 'chair', option: 'A', title: 'Mod Egg Chair', m: 1, price: 279, d: MISSING, variant: 'round', colors: ['#D9622B', '#F5E6C8'], tags: ['retro', 'mid-century', 'playful'], kg: 16,
    ask: { answer: '66 × 72 × 80 cm. The legs screw off, so the box is only 66 cm wide.', dimensions: dims(66, 72, 80) },
  },
  { vibe: 'retro', slot: 'chair', option: 'B', title: 'Walnut Sling Chair', m: 5, price: 239, d: dims(26, 29, 30, 'in'), variant: 'midcentury', colors: ['#D9622B', '#8A5A36'], tags: ['retro', 'mid-century'], pkg: dims(27, 12, 31, 'in'), kg: 11, flat: true },
  { vibe: 'retro', slot: 'lamp', option: 'A', title: 'Mushroom Floor Lamp', m: 3, price: 139, d: dims(38, 38, 150), variant: 'globe', colors: ['#E8B04B', '#F5E6C8'], tags: ['retro', 'playful'], kg: 6 },
  { vibe: 'retro', slot: 'lamp', option: 'B', title: 'Atomic Arc Lamp', m: 7, price: 159, d: dims(15, 12, 70, 'in', 'inferred'), variant: 'arc', colors: ['#2E7D7A', '#C8A15A'], tags: ['retro', 'mid-century'], kg: 8, flat: true },
  { vibe: 'retro', slot: 'side-table', option: 'A', title: 'Tulip Side Table', m: 4, price: 89, d: dims(45, 45, 52), variant: 'tulip', colors: ['#F5E6C8', '#D9622B'], tags: ['retro', 'mid-century'], kg: 9 },
  { vibe: 'retro', slot: 'side-table', option: 'B', title: 'Teak Nesting Tables', m: 0, price: 109, d: dims(18, 14, 20, 'in'), variant: 'block', colors: ['#8A5A36', '#6E4528'], tags: ['mid-century', 'warm'], kg: 10 },
  { vibe: 'retro', slot: 'shelf', option: 'A', title: 'Walnut Record Cabinet', m: 1, price: 149, d: dims(80, 40, 90), variant: 'bookcase', colors: ['#8A5A36', '#E8B04B'], tags: ['retro', 'mid-century', 'warm'], pkg: dims(84, 44, 30), kg: 28, flat: true },
  { vibe: 'retro', slot: 'shelf', option: 'B', title: 'Space Age Wall Shelf', m: 8, price: 79, d: dims(70, 20, 30), variant: 'floating', colors: ['#2E7D7A', '#E8B04B'], tags: ['retro', 'playful'], kg: 5, drill: true, flat: true },
  { vibe: 'retro', slot: 'wall-art', option: 'A', title: '70s Sunset Poster', m: 2, price: 59, d: dims(50, 2, 70), variant: 'poster', colors: ['#D9622B', '#E8B04B'], tags: ['retro', 'warm', 'playful'], kg: 1 },
  { vibe: 'retro', slot: 'wall-art', option: 'B', title: 'Vinyl Grid Trio', m: 9, price: 89, d: dims(120, 3, 40), variant: 'grid', colors: ['#2E7D7A', '#D9622B'], tags: ['retro', 'mid-century'], kg: 3 },

  // ── CLASSY ──────────────────────────────────────────────
  { vibe: 'classy', slot: 'rug', option: 'A', title: 'Heirloom Medallion Rug', m: 8, price: 349, d: dims(120, 96, 0.6, 'in'), variant: 'persian', colors: ['#7A2E2E', '#C8A15A'], tags: ['traditional', 'classic', 'elegant'], kg: 14, fold: true },
  {
    vibe: 'classy', slot: 'rug', option: 'B', title: 'Ivory Border Wool Rug', m: 6, price: 279, d: MISSING, variant: 'solid', colors: ['#EFE7DA', '#2F4A3E'], tags: ['classic', 'elegant'], kg: 12, fold: true,
    ask: { answer: '230 × 160 cm, 1.2 cm pile. It ships rolled.', dimensions: dims(230, 160, 1.2) },
  },
  { vibe: 'classy', slot: 'chair', option: 'A', title: 'Velvet Wingback Chair', m: 7, price: 429, d: dims(88, 84, 104), variant: 'wingback', colors: ['#3F6B57', '#C8A15A'], tags: ['classic', 'traditional', 'elegant'], pkg: dims(90, 86, 106), kg: 32 },
  { vibe: 'classy', slot: 'chair', option: 'B', title: 'Slipper Accent Chair', m: 0, price: 319, d: dims(27, 30, 33, 'in'), variant: 'boxy', colors: ['#E9DFCF', '#C8A15A'], tags: ['classic', 'elegant'], pkg: dims(28, 31, 34, 'in'), kg: 17 },
  { vibe: 'classy', slot: 'lamp', option: 'A', title: 'Brass Column Lamp', m: 3, price: 189, d: dims(36, 36, 160), variant: 'brass', colors: ['#C8A15A', '#F3EDE3'], tags: ['classic', 'brass', 'elegant'], kg: 9 },
  { vibe: 'classy', slot: 'lamp', option: 'B', title: 'Pleated Shade Lamp', m: 4, price: 169, d: dims(40, 40, 155, 'cm', 'inferred'), variant: 'brass', colors: ['#2F4A3E', '#EFE7DA'], tags: ['traditional', 'elegant'], kg: 8 },
  { vibe: 'classy', slot: 'side-table', option: 'A', title: 'Marble Pedestal Table', m: 8, price: 159, d: dims(45, 45, 55), variant: 'pedestal', colors: ['#EDE8E1', '#C8A15A'], tags: ['classic', 'elegant'], kg: 26 },
  { vibe: 'classy', slot: 'side-table', option: 'B', title: 'Brass Tray Table', m: 7, price: 129, d: dims(18, 18, 22, 'in'), variant: 'tulip', colors: ['#C8A15A', '#2B2B2B'], tags: ['brass', 'classic'], kg: 7, fold: true },
  { vibe: 'classy', slot: 'shelf', option: 'A', title: 'Brass Bar Wall Shelf', m: 0, price: 129, d: dims(90, 25, 6), variant: 'floating', colors: ['#3A2A1E', '#C8A15A'], tags: ['classic', 'brass'], kg: 6, drill: true },
  { vibe: 'classy', slot: 'shelf', option: 'B', title: 'Glass Front Bookcase', m: 5, price: 249, d: dims(80, 35, 180), variant: 'bookcase', colors: ['#3A2A1E', '#C8A15A'], tags: ['traditional', 'classic'], pkg: dims(182, 40, 30), kg: 31, flat: true },
  { vibe: 'classy', slot: 'wall-art', option: 'A', title: 'Gallery Botanical Set', m: 2, price: 149, d: dims(150, 3, 60), variant: 'grid', colors: ['#EFE7DA', '#3F6B57'], tags: ['classic', 'elegant'], kg: 4 },
  { vibe: 'classy', slot: 'wall-art', option: 'B', title: 'Gilded Landscape', m: 9, price: 189, d: dims(36, 2, 26, 'in', 'inferred'), variant: 'abstract', colors: ['#7A8F6E', '#C8A15A'], tags: ['traditional', 'brass'], kg: 4 },

  // ── DEN ─────────────────────────────────────────────────
  { vibe: 'den', slot: 'rug', option: 'A', title: 'Charcoal Kilim Rug', m: 1, price: 199, d: dims(230, 160, 1), variant: 'geometric', colors: ['#3A3A3A', '#B5652B', '#C8A15A'], tags: ['industrial', 'moody'], kg: 10, fold: true },
  { vibe: 'den', slot: 'rug', option: 'B', title: 'Cowhide-Look Rug', m: 9, price: 159, d: dims(72, 60, 0.4, 'in'), variant: 'shag', colors: ['#5A3E2B', '#E8DCC8'], tags: ['leather', 'moody'], kg: 5, fold: true },
  { vibe: 'den', slot: 'chair', option: 'A', title: 'Cognac Leather Club Chair', m: 7, price: 389, d: dims(74, 86, 80), variant: 'boxy', colors: ['#8B4A24', '#3A2A1E'], tags: ['leather', 'moody', 'industrial'], pkg: dims(81, 88, 84), kg: 38 },
  {
    vibe: 'den', slot: 'chair', option: 'B', title: 'Canvas Sling Chair', m: 5, price: 229, d: MISSING, variant: 'midcentury', colors: ['#5B5B45', '#8A5A36'], tags: ['industrial'], kg: 9, flat: true, fold: true,
    ask: { answer: '64 × 70 × 75 cm. It folds flat to 12 cm.', dimensions: dims(64, 70, 75) },
  },
  { vibe: 'den', slot: 'lamp', option: 'A', title: 'Industrial Tripod Lamp', m: 3, price: 129, d: dims(14, 14, 60, 'in'), variant: 'tripod', colors: ['#1E1E1E', '#C8A15A'], tags: ['industrial', 'dark'], kg: 5, flat: true },
  { vibe: 'den', slot: 'lamp', option: 'B', title: 'Edison Arc Lamp', m: 4, price: 149, d: dims(40, 35, 175, 'cm', 'inferred'), variant: 'arc', colors: ['#1E1E1E', '#C8A15A'], tags: ['industrial', 'moody'], kg: 8, flat: true },
  { vibe: 'den', slot: 'side-table', option: 'A', title: 'Steel Crate Side Table', m: 0, price: 119, d: dims(42, 42, 50), variant: 'block', colors: ['#3A3A3A', '#7B3F1F'], tags: ['industrial', 'dark'], kg: 12 },
  { vibe: 'den', slot: 'side-table', option: 'B', title: 'Stump Side Table', m: 1, price: 99, d: dims(38, 38, 45, 'cm', 'inferred'), variant: 'pedestal', colors: ['#6E4528', '#4A3326'], tags: ['moody', 'natural'], kg: 18 },
  { vibe: 'den', slot: 'shelf', option: 'A', title: 'Iron Pipe Bookcase', m: 7, price: 179, d: dims(32, 14, 70, 'in'), variant: 'bookcase', colors: ['#2B2B2B', '#7B3F1F'], tags: ['industrial', 'dark'], pkg: dims(180, 38, 22), kg: 34, flat: true },
  { vibe: 'den', slot: 'shelf', option: 'B', title: 'Floating Ledge Shelf', m: 9, price: 89, d: dims(90, 15, 5), variant: 'floating', colors: ['#4A3326', '#2B2B2B'], tags: ['industrial'], kg: 5, drill: true },
  { vibe: 'den', slot: 'wall-art', option: 'A', title: 'Neon Night Sign', m: 2, price: 79, d: dims(60, 5, 30), variant: 'neon', colors: ['#FF9E4A', '#FF5DA2'], tags: ['moody', 'industrial'], kg: 2 },
  { vibe: 'den', slot: 'wall-art', option: 'B', title: 'Vintage Map Print', m: 8, price: 99, d: dims(90, 3, 60), variant: 'line', colors: ['#E8DCC8', '#4A3326'], tags: ['moody'], kg: 3 },

  // ── COLOR POP ───────────────────────────────────────────
  { vibe: 'colorpop', slot: 'rug', option: 'A', title: 'Squiggle Tufted Rug', m: 4, price: 139, d: dims(180, 120, 2), variant: 'geometric', colors: ['#FF5DA2', '#2EC4B6', '#FFD23F'], tags: ['colorful', 'playful', 'bold'], kg: 6, fold: true },
  {
    vibe: 'colorpop', slot: 'rug', option: 'B', title: 'Checker Party Rug', m: 1, price: 159, d: MISSING, variant: 'striped', colors: ['#B8A2FF', '#FFD23F'], tags: ['colorful', 'playful'], kg: 6, fold: true,
    ask: { answer: '183 × 122 cm (that is 6 × 4 ft). It rolls into a 30 cm tube.', dimensions: dims(72, 48, 0.6, 'in') },
  },
  { vibe: 'colorpop', slot: 'chair', option: 'A', title: 'Bubble Pouf Chair', m: 6, price: 199, d: dims(66, 70, 70), variant: 'round', colors: ['#FF5DA2', '#FFB3D1'], tags: ['colorful', 'playful', 'bold'], pkg: dims(68, 72, 72), kg: 12 },
  { vibe: 'colorpop', slot: 'chair', option: 'B', title: 'Candy Stripe Chair', m: 8, price: 229, d: dims(28, 30, 31, 'in', 'inferred'), variant: 'boxy', colors: ['#2EC4B6', '#FFD23F'], tags: ['colorful', 'bold'], kg: 15 },
  { vibe: 'colorpop', slot: 'lamp', option: 'A', title: 'Gumball Floor Lamp', m: 3, price: 99, d: dims(34, 34, 140), variant: 'globe', colors: ['#FFD23F', '#FF5DA2'], tags: ['colorful', 'playful'], kg: 5 },
  { vibe: 'colorpop', slot: 'lamp', option: 'B', title: 'Wiggle Arc Lamp', m: 2, price: 129, d: dims(30, 30, 150, 'cm', 'inferred'), variant: 'arc', colors: ['#2EC4B6', '#FF5DA2'], tags: ['colorful', 'bold'], kg: 6, flat: true },
  { vibe: 'colorpop', slot: 'side-table', option: 'A', title: 'Stacked Ring Table', m: 4, price: 69, d: dims(40, 40, 45), variant: 'stack', colors: ['#2EC4B6', '#FF5DA2', '#FFD23F'], tags: ['colorful', 'playful'], kg: 5 },
  { vibe: 'colorpop', slot: 'side-table', option: 'B', title: 'Lacquer Cube Table', m: 5, price: 89, d: dims(16, 16, 18, 'in'), variant: 'block', colors: ['#FFD23F', '#FF8C42'], tags: ['colorful', 'bold'], kg: 7 },
  { vibe: 'colorpop', slot: 'shelf', option: 'A', title: 'Wavy Wall Shelf', m: 9, price: 89, d: dims(70, 18, 25), variant: 'floating', colors: ['#FF5DA2', '#2EC4B6'], tags: ['colorful', 'playful'], kg: 4, drill: true, flat: true },
  { vibe: 'colorpop', slot: 'shelf', option: 'B', title: 'Color Block Cube Shelf', m: 7, price: 119, d: dims(70, 30, 110), variant: 'cube', colors: ['#2EC4B6', '#FFD23F', '#FF5DA2'], tags: ['colorful', 'bold'], kg: 15, flat: true },
  { vibe: 'colorpop', slot: 'wall-art', option: 'A', title: 'Happy Blob Print', m: 2, price: 45, d: dims(50, 2, 70), variant: 'abstract', colors: ['#FF5DA2', '#FFD23F'], tags: ['colorful', 'playful'], kg: 1 },
  { vibe: 'colorpop', slot: 'wall-art', option: 'B', title: 'Smile Neon Sign', m: 0, price: 89, d: dims(50, 5, 35), variant: 'neon', colors: ['#FFD23F', '#B8A2FF'], tags: ['colorful', 'playful', 'bold'], kg: 2 },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const PRODUCTS: Product[] = ROWS.map((r, i) => {
  const id = `gid://shopify/Product/${8_820_000_000 + i * 7919}`;
  const merchant = MERCHANTS[r.m];
  return {
    id,
    title: r.title,
    merchant,
    price: { amount: r.price, currency: 'USD' },
    slot: r.slot,
    category: CATEGORY[r.slot],
    vibe: r.vibe,
    option: r.option,
    styleTags: r.tags,
    styleTagsSource: 'inferred',
    colors: r.colors,
    illustration: { variant: r.variant },
    dimensions: r.d,
    packageDimensions: r.pkg,
    weightKg: r.kg,
    flatPack: !!r.flat,
    foldable: !!r.fold,
    needsDrilling: !!r.drill,
    variants: [{ id: `gid://shopify/ProductVariant/${4_410_000_000 + i * 104_729}`, title: 'Default', available: true }],
    checkoutUrl: `https://${merchant.domain}/cart/${slug(r.title)}:1`,
    merchantQuestionResponse: r.ask,
  };
});

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
