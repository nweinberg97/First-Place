export type Slot = 'rug' | 'chair' | 'lamp' | 'side-table' | 'shelf' | 'wall-art';
export const SLOTS: Slot[] = ['rug', 'shelf', 'side-table', 'lamp', 'chair', 'wall-art'];

export type DimensionSource = 'stated' | 'inferred' | 'missing';
export type Unit = 'in' | 'cm';

export interface Dimensions {
  width: number;
  depth: number;
  height: number;
  unit: Unit;
  source: DimensionSource;
}

export type VibeId = 'modern' | 'retro' | 'classy' | 'den' | 'colorpop';

export interface Merchant {
  name: string;
  domain: string;
}

export interface Product {
  id: string;
  title: string;
  merchant: Merchant;
  price: { amount: number; currency: string };
  slot: Slot;
  category: string; // Shopify Standard Product Taxonomy-style path
  vibe: VibeId;
  option: 'A' | 'B';
  styleTags: string[];
  styleTagsSource: 'inferred';
  colors: string[];
  illustration: { variant: string };
  dimensions: Dimensions;
  packageDimensions?: Dimensions;
  weightKg?: number;
  flatPack: boolean;
  foldable: boolean;
  needsDrilling: boolean;
  variants: { id: string; title: string; available: boolean }[];
  checkoutUrl: string;
  merchantQuestionResponse?: { answer: string; dimensions: Dimensions };
}

export type Lane = 'floor' | 'wall' | 'rug';

export interface Vibe {
  id: VibeId;
  name: string;
  emoji: string;
  tagline: string;
  tags: string[];
  swatches: [string, string, string];
  palette: string[];
  wall: string;
  wallShade: string;
  trim: string;
  floor: string;
  floorLine: string;
  light: string;
  lightOpacity: number;
  ceilingLamp: 'pendant' | 'globe' | 'chandelier' | 'track' | 'disco';
  pattern: 'none' | 'sunburst' | 'panels' | 'brick' | 'arch';
  accent: 'plant' | 'record' | 'books' | 'chess' | 'tulips';
  sticker: { bg: string; fg: string; rotate: number };
}

export interface ProtocolEvent {
  id: number;
  at: string;
  tool: string;
  status: 'ok' | 'simulated' | 'error';
  request: unknown;
  response: unknown;
}
