import type { Product, Slot } from '../types';

/**
 * Application-level contracts modelled on Shopify's Global Catalog MCP
 * (search_catalog / lookup_catalog / get_product) and UCP Cart + Checkout.
 * These are NOT the official wire schemas. Verify tool names, fields, auth and
 * transport at https://shopify.dev/docs/agents before going live.
 */
export interface SearchCatalogRequest {
  query: string;
  filters?: {
    categories?: string[];
    price?: { max?: number; currency?: string };
    shipsTo?: { country: string; postalCode?: string };
    available?: boolean;
  };
  like?: { image?: string; productId?: string };
  limit?: number;
}

export interface ProductSummary {
  id: string;
  title: string;
  merchant: string;
  price: { amount: number; currency: string };
  slot: Slot;
}

export interface CatalogClient {
  searchCatalog(req: SearchCatalogRequest): Promise<ProductSummary[]>;
  lookupCatalog(ids: string[]): Promise<Product[]>;
  getProduct(id: string): Promise<Product>;
  askBusiness(merchantDomain: string, question: string, productId: string): Promise<{ answer: string; simulated: boolean }>;
}

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}
export interface Money {
  amount: number;
  currency: string;
}
export interface Cart {
  id: string;
  lines: CartLine[];
  currency: string;
  total: number;
}
export interface MerchantCheckout {
  merchant: string;
  continueUrl: string;
  total: Money;
  fulfillmentOptions: string[];
}
export interface UcpClient {
  createCart(lines: CartLine[]): Promise<Cart>;
  updateCart(cartId: string, lines: CartLine[]): Promise<Cart>;
  createCheckout(cartId: string): Promise<{ checkouts: MerchantCheckout[] }>;
}

export type Logger = (tool: string, request: unknown, response: unknown) => void;
