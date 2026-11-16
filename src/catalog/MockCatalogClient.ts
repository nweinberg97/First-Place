import { PRODUCTS, productById } from '../data/products';
import type { Product } from '../types';
import type { CatalogClient, Logger, ProductSummary, SearchCatalogRequest } from './types';

const summary = (p: Product): ProductSummary => ({ id: p.id, title: p.title, merchant: p.merchant.name, price: p.price, slot: p.slot });

/** Real local filtering over the simulated catalog, so the discovery logic is genuine even though the data isn't. */
export function searchLocal(req: SearchCatalogRequest): Product[] {
  const terms = req.query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = PRODUCTS.filter((p) => {
    if (req.filters?.categories?.length && !req.filters.categories.includes(p.category)) return false;
    if (req.filters?.price?.max != null && p.price.amount > req.filters.price.max) return false;
    if (req.filters?.available && !p.variants.some((v) => v.available)) return false;
    return true;
  }).map((p) => {
    const hay = `${p.title} ${p.merchant.name} ${p.styleTags.join(' ')} ${p.vibe} ${p.category}`.toLowerCase();
    const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
    return { p, score };
  });
  return scored
    .filter((s) => terms.length === 0 || s.score > 0)
    .sort((a, b) => b.score - a.score || (a.p.option < b.p.option ? -1 : 1) || a.p.price.amount - b.p.price.amount)
    .slice(0, req.limit ?? 10)
    .map((s) => s.p);
}

export class MockCatalogClient implements CatalogClient {
  constructor(private log: Logger) {}

  async searchCatalog(req: SearchCatalogRequest) {
    const res = searchLocal(req).map(summary);
    this.log('search_catalog', req, { products: res, total: res.length });
    return res;
  }

  async lookupCatalog(ids: string[]) {
    const res = ids.map((id) => productById(id)).filter(Boolean) as Product[];
    this.log('lookup_catalog', { ids }, { products: res.map(summary) });
    return res;
  }

  async getProduct(id: string) {
    const p = productById(id)!;
    this.log('get_product', { id }, {
      id: p.id,
      title: p.title,
      shop: p.merchant,
      price: p.price,
      variants: p.variants,
      attributes: {
        dimensions: p.dimensions.source === 'missing' ? null : { ...p.dimensions },
        dimensions_source: p.dimensions.source,
        style: { values: p.styleTags, source: p.styleTagsSource },
        weight_kg: p.weightKg ?? null,
      },
      checkout_url: p.checkoutUrl,
    });
    return p;
  }

  async askBusiness(merchantDomain: string, question: string, productId: string) {
    const p = productById(productId);
    const answer = p?.merchantQuestionResponse?.answer ?? "We'll get back to you within a day.";
    this.log('ask_business', { shop: merchantDomain, product_id: productId, question }, { answer, simulated: true });
    return { answer, simulated: true };
  }
}
