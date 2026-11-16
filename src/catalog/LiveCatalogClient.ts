import type { CatalogClient, UcpClient } from './types';

/**
 * Live integration boundary. NOT IMPLEMENTED and makes no network calls.
 *
 * Intended endpoint: Shopify Global Catalog MCP, https://catalog.shopify.com/api/ucp/mcp
 * (UCP Catalog capability). Tools: search_catalog, lookup_catalog, get_product.
 * Merchant questions: ask_business, where the shop supports it.
 * Cart / checkout: UCP Cart + Checkout MCP. Checkout completion needs a signed
 * agent profile with a high enough trust tier; otherwise hand off via continue_url.
 *
 * TODO before going live:
 *  1. Verify exact tool names, request fields and response schemas at shopify.dev/docs/agents.
 *  2. Register an agent profile (well-known URL) and confirm auth + rate limits.
 *  3. Map live product responses into src/types Product. Dimensions may be merchant-stated,
 *     Shopify-inferred or absent: preserve that provenance, never fabricate.
 *  4. Respect usage rules: cache price/availability ≤ 10 min, metadata ≤ 24 h; keep attribution params.
 */
export class LiveCatalogClient implements CatalogClient {
  readonly endpoint = 'https://catalog.shopify.com/api/ucp/mcp';
  searchCatalog(): never { throw new Error('LiveCatalogClient.searchCatalog: not implemented in the prototype'); }
  lookupCatalog(): never { throw new Error('LiveCatalogClient.lookupCatalog: not implemented in the prototype'); }
  getProduct(): never { throw new Error('LiveCatalogClient.getProduct: not implemented in the prototype'); }
  askBusiness(): never { throw new Error('LiveCatalogClient.askBusiness: not implemented in the prototype'); }
}

export class LiveUcpClient implements UcpClient {
  createCart(): never { throw new Error('LiveUcpClient.createCart: not implemented in the prototype'); }
  updateCart(): never { throw new Error('LiveUcpClient.updateCart: not implemented in the prototype'); }
  createCheckout(): never { throw new Error('LiveUcpClient.createCheckout: not implemented in the prototype'); }
}
