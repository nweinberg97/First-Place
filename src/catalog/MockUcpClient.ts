import { productById } from '../data/products';
import type { Cart, CartLine, Logger, MerchantCheckout, UcpClient } from './types';

/** Simulated UCP cart + checkout. Groups lines by merchant; each shop stays merchant of record. */
export class MockUcpClient implements UcpClient {
  private carts = new Map<string, Cart>();
  private seq = 1;
  constructor(private log: Logger) {}

  private price(lines: CartLine[]) {
    return lines.reduce((s, l) => s + (productById(l.productId)?.price.amount ?? 0) * l.quantity, 0);
  }

  async createCart(lines: CartLine[]) {
    const cart: Cart = { id: `gid://shopify/Cart/fp-${this.seq++}`, lines, currency: 'USD', total: this.price(lines) };
    this.carts.set(cart.id, cart);
    this.log('cart.create', { line_items: lines }, cart);
    return cart;
  }

  async updateCart(cartId: string, lines: CartLine[]) {
    const cart: Cart = { id: cartId, lines, currency: 'USD', total: this.price(lines) };
    this.carts.set(cartId, cart);
    this.log('cart.update', { id: cartId, line_items: lines }, cart);
    return cart;
  }

  async createCheckout(cartId: string) {
    const cart = this.carts.get(cartId);
    const byShop = new Map<string, { domain: string; total: number; handles: string[] }>();
    for (const l of cart?.lines ?? []) {
      const p = productById(l.productId)!;
      const g = byShop.get(p.merchant.name) ?? { domain: p.merchant.domain, total: 0, handles: [] };
      g.total += p.price.amount * l.quantity;
      g.handles.push(`${l.variantId.split('/').pop()}:${l.quantity}`);
      byShop.set(p.merchant.name, g);
    }
    const checkouts: MerchantCheckout[] = [...byShop.entries()].map(([merchant, g]) => ({
      merchant,
      continueUrl: `https://${g.domain}/cart/${g.handles.join(',')}`,
      total: { amount: g.total, currency: 'USD' },
      fulfillmentOptions: ['Standard delivery', 'Local pickup'],
    }));
    this.log('checkout.create', { cart_id: cartId }, { checkouts, note: 'Each shop remains merchant of record.' });
    return { checkouts };
  }
}
