import { useSyncExternalStore } from 'react';
import type { Product, ProtocolEvent, Slot, Unit, VibeId } from './types';
import { SLOTS } from './types';
import { PRODUCTS, productById } from './data/products';
import { vibeById } from './data/vibes';
import { ROOM } from './data/room';
import { defaultPositions, defaultX } from './fit/layout';
import { MockCatalogClient } from './catalog/MockCatalogClient';
import { MockUcpClient } from './catalog/MockUcpClient';
import type { CartLine, MerchantCheckout } from './catalog/types';

export type Panel = 'cart' | 'checkout' | 'ar' | 'share' | 'hood' | 'photo' | 'place' | null;

export interface State {
  vibe: VibeId;
  selection: Record<Slot, string | null>;
  positions: Record<Slot, number>;
  qty: Record<Slot, number>;
  answered: Record<string, true>;
  asking: Record<string, 'loading' | 'replied' | 'done'>;
  selectedSlot: Slot | null;
  budget: number;
  doorWidth: number;
  noDrilling: boolean;
  walkUp: boolean;
  unit: Unit;
  showMeasurements: boolean;
  query: string;
  panel: Panel;
  hoodOpen: boolean;
  events: ProtocolEvent[];
  toast: { id: number; text: string } | null;
  roll: number;
  swapKey: Record<Slot, number>;
  cartId: string | null;
  checkouts: MerchantCheckout[];
  pulse: number;
}

// ── tiny external store (zustand-style, zero deps) ──────────────────
type Listener = () => void;
const listeners = new Set<Listener>();
let state: State;
const get = () => state;
function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  listeners.forEach((l) => l());
}
const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export function useApp(): State {
  return useSyncExternalStore(subscribe, get, get);
}
export const getState = get;

// ── protocol event log (Under the hood) ─────────────────────────────
let eventSeq = 1;
function log(tool: string, request: unknown, response: unknown) {
  const ev: ProtocolEvent = { id: eventSeq++, at: new Date().toISOString().slice(11, 23), tool, status: 'simulated', request, response };
  set((s) => ({ events: [ev, ...s.events].slice(0, 200) }));
}
export const catalog = new MockCatalogClient(log);
export const ucp = new MockUcpClient(log);

// ── helpers ─────────────────────────────────────────────────────────
/** Product with any merchant answer applied (missing → stated). */
export function effective(id: string | null, answered: Record<string, true>): Product | undefined {
  if (!id) return undefined;
  const p = productById(id);
  if (!p) return undefined;
  if (answered[id] && p.merchantQuestionResponse) return { ...p, dimensions: p.merchantQuestionResponse.dimensions };
  return p;
}

export function vibeSet(vibe: VibeId): Record<Slot, string> {
  const out = {} as Record<Slot, string>;
  SLOTS.forEach((slot) => (out[slot] = PRODUCTS.find((p) => p.vibe === vibe && p.slot === slot && p.option === 'A')!.id));
  return out;
}

function productsOf(sel: Record<Slot, string | null>, answered: Record<string, true>) {
  const out: Partial<Record<Slot, Product>> = {};
  SLOTS.forEach((s) => (out[s] = effective(sel[s], answered)));
  return out;
}

const SLOT_NOUN: Record<Slot, string> = { rug: 'rug', chair: 'accent chair', lamp: 'floor lamp', 'side-table': 'side table', shelf: 'shelf', 'wall-art': 'wall art' };

let toastSeq = 1;
function toast(text: string) {
  const id = toastSeq++;
  set({ toast: { id, text } });
  setTimeout(() => {
    if (get().toast?.id === id) set({ toast: null });
  }, 2600);
}

function cartLines(s: State): CartLine[] {
  return SLOTS.filter((slot) => s.selection[slot]).map((slot) => {
    const p = productById(s.selection[slot]!)!;
    return { productId: p.id, variantId: p.variants[0].id, quantity: s.qty[slot] };
  });
}
function syncCart() {
  const s = get();
  if (s.cartId) ucp.updateCart(s.cartId, cartLines(s));
}

// ── actions ─────────────────────────────────────────────────────────
export const actions = {
  async setVibe(vibe: VibeId, quiet = false) {
    const v = vibeById(vibe);
    const selection = vibeSet(vibe);
    const s = get();
    const products = productsOf(selection, s.answered);
    set({
      vibe,
      selection,
      positions: defaultPositions(products),
      qty: { rug: 1, chair: 1, lamp: 1, 'side-table': 1, shelf: 1, 'wall-art': 1 },
      roll: s.roll + 1,
      selectedSlot: s.selectedSlot,
      query: '',
    });
    for (const slot of SLOTS) {
      await catalog.searchCatalog({
        query: `${v.tags[0]} ${SLOT_NOUN[slot]}`,
        filters: { categories: [products[slot]!.category], price: { max: get().budget, currency: 'USD' }, available: true },
        limit: 8,
      });
    }
    const shops = new Set(SLOTS.map((sl) => products[sl]!.merchant.name)).size;
    if (!quiet) toast(`${v.emoji} 6 sample pieces from ${shops} sample shops`);
    syncCart();
  },

  selectSlot(slot: Slot | null) {
    set((st) => ({ selectedSlot: slot, query: '', pulse: slot && slot !== st.selectedSlot ? st.pulse + 1 : st.pulse }));
    const id = slot ? get().selection[slot] : null;
    if (id) catalog.getProduct(id);
  },

  swap(slot: Slot, productId: string) {
    const s = get();
    const selection = { ...s.selection, [slot]: productId };
    const products = productsOf(selection, s.answered);
    set({
      selection,
      positions: { ...s.positions, [slot]: defaultX(slot, products) },
      swapKey: { ...s.swapKey, [slot]: (s.swapKey[slot] ?? 0) + 1 },
      selectedSlot: slot,
      qty: { ...s.qty, [slot]: s.qty[slot] || 1 },
    });
    catalog.getProduct(productId);
    syncCart();
  },

  remix() {
    const s = get();
    const selection = { ...s.selection };
    SLOTS.forEach((slot) => {
      const cur = selection[slot] ? productById(selection[slot]!) : undefined;
      const vibe = cur?.vibe ?? s.vibe;
      const want = cur?.option === 'A' ? 'B' : 'A';
      selection[slot] = PRODUCTS.find((p) => p.vibe === vibe && p.slot === slot && p.option === want)!.id;
    });
    const products = productsOf(selection, s.answered);
    set({ selection, positions: defaultPositions(products), roll: s.roll + 1 });
    toast('🎲 Remixed. Same vibe, different pieces.');
    syncCart();
  },

  buildOwn() {
    const s = get();
    set({ selection: { rug: null, chair: null, lamp: null, 'side-table': null, shelf: null, 'wall-art': null }, selectedSlot: 'chair', roll: s.roll + 1, pulse: s.pulse + 1, query: '' });
    toast('🎨 Blank canvas. Tap a + and pick from any shop, any vibe.');
    syncCart();
  },

  /** Flip to the previous/next candidate in the ranked list. */
  step(slot: Slot, ids: string[], dir: 1 | -1) {
    const cur = get().selection[slot];
    const i = cur ? ids.indexOf(cur) : -1;
    const next = ids[(i + dir + ids.length) % ids.length];
    if (next) actions.swap(slot, next);
  },

  move(slot: Slot, x: number) {
    set((s) => ({ positions: { ...s.positions, [slot]: Math.round(Math.max(-40, Math.min(ROOM.wallWidth + 40, x)) * 2) / 2 } }));
  },

  async ask(productId: string) {
    const p = productById(productId);
    if (!p) return;
    set((s) => ({ asking: { ...s.asking, [productId]: 'loading' } }));
    await catalog.askBusiness(p.merchant.domain, 'What are the exact dimensions, and how does it ship?', productId);
    await new Promise((r) => setTimeout(r, 750));
    // Show the simulated reply first; the verdict only changes when the shopper chooses to use it.
    set((s) => ({ asking: { ...s.asking, [productId]: 'replied' } }));
  },

  useAnswer(productId: string) {
    set((s) => ({ asking: { ...s.asking, [productId]: 'done' }, answered: { ...s.answered, [productId]: true } }));
  },

  remove(slot: Slot) {
    set((s) => ({ selection: { ...s.selection, [slot]: null }, selectedSlot: s.selectedSlot === slot ? null : s.selectedSlot }));
    syncCart();
  },

  setQty(slot: Slot, q: number) {
    set((s) => ({ qty: { ...s.qty, [slot]: Math.max(1, Math.min(9, q)) } }));
    syncCart();
  },

  async openCart() {
    const s = get();
    set({ panel: 'cart' });
    if (!s.cartId) {
      const cart = await ucp.createCart(cartLines(s));
      set({ cartId: cart.id });
    } else syncCart();
  },

  async checkout() {
    const s = get();
    let id = s.cartId;
    if (!id) id = (await ucp.createCart(cartLines(s))).id;
    const { checkouts } = await ucp.createCheckout(id);
    set({ cartId: id, checkouts, panel: 'checkout' });
  },

  set,
};

// ── initial state ───────────────────────────────────────────────────
const init = vibeSet('modern');
state = {
  vibe: 'modern',
  selection: init,
  positions: defaultPositions(productsOf(init, {})),
  qty: { rug: 1, chair: 1, lamp: 1, 'side-table': 1, shelf: 1, 'wall-art': 1 },
  answered: {},
  asking: {},
  selectedSlot: 'chair',
  budget: 1200,
  doorWidth: ROOM.defaultDoorWidth,
  noDrilling: true,
  walkUp: true,
  unit: 'cm',
  showMeasurements: false,
  query: '',
  panel: null,
  hoodOpen: false,
  events: [],
  toast: null,
  roll: 0,
  swapKey: {} as Record<Slot, number>,
  cartId: null,
  checkouts: [],
  pulse: 0,
};
// Seed the protocol log with the initial discovery calls.
actions.setVibe('modern', true);
