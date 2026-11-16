import { useEffect, useMemo, useRef } from 'react';
import type { Slot } from '../types';
import { SLOTS } from '../types';
import { actions, catalog, useApp } from '../store';
import { PRODUCTS } from '../data/products';
import { vibeById } from '../data/vibes';
import { deriveRoom, rankedCandidates } from '../derive';
import { ProductThumb, VerdictPill } from './Bits';
import { money } from '../hooks';

const SLOT_TAB: Record<Slot, string> = { rug: 'Rugs', chair: 'Chairs', lamp: 'Lamps', 'side-table': 'Side tables', shelf: 'Shelves', 'wall-art': 'Art' };

export function Discover() {
  const s = useApp();
  const room = deriveRoom(s);
  const slot: Slot = s.selectedSlot ?? 'chair';
  const current = room.products[slot];
  const debounce = useRef<number | undefined>(undefined);
  const list = useRef<HTMLUListElement>(null);


  // Real discovery call (simulated data) when the shopper searches.
  useEffect(() => {
    if (!s.query.trim()) return;
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      catalog.searchCatalog({ query: `${s.query} ${SLOT_TAB[slot]}`, filters: { categories: [PRODUCTS.find((p) => p.slot === slot)!.category], price: { max: s.budget, currency: 'USD' } }, limit: 10 });
    }, 450);
    return () => window.clearTimeout(debounce.current);
  }, [s.query, slot, s.budget]);

  const results = useMemo(() => {
    const q = s.query.trim().toLowerCase();
    return rankedCandidates(slot, s).filter(({ p }) => !q || `${p.title} ${p.merchant.name} ${p.styleTags.join(' ')} ${vibeById(p.vibe).name}`.toLowerCase().includes(q));
  }, [s, slot]);

  useEffect(() => {
    const el = list.current?.querySelector('.in-room');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [current?.id, slot]);

  const shops = new Set(results.map((x) => x.p.merchant.name)).size;

  return (
    <section key={s.pulse} className={`discover ${s.selectedSlot ? 'live' : ''}`} id="discover" aria-label="Discover swaps">
      <div className="disc-bar">
        <div className="disc-title">
          <span className="eyebrow">Discover</span>
          <b>{current ? <>Swap your {SLOT_TAB[slot].toLowerCase().replace(/s$/, '')}</> : <>Add a {SLOT_TAB[slot].toLowerCase().replace(/s$/, '')}</>}</b>
          <span className="disc-count">{results.length} from {shops} shops</span>
        </div>
        <div className="slot-tabs" role="tablist">
          {SLOTS.map((sl) => (
            <button key={sl} role="tab" aria-selected={sl === slot} className={sl === slot ? 'on' : ''} onClick={() => actions.selectSlot(sl)}>
              {SLOT_TAB[sl]}
            </button>
          ))}
        </div>
        <label className="search">
          <span aria-hidden>⌕</span>
          <input value={s.query} onChange={(e) => actions.set({ query: e.target.value })} placeholder={`Search ${SLOT_TAB[slot].toLowerCase()}, shops, vibes…`} aria-label="Search the catalog" />
          {s.query && <button onClick={() => actions.set({ query: '' })} aria-label="Clear search">✕</button>}
        </label>
      </div>
      <ul className="results" ref={list}>
        {results.map(({ p, r, delta, inRoom }) => (
          <li key={p.id}>
            <button className={`result ${inRoom ? 'in-room' : ''}`} onClick={() => !inRoom && actions.swap(slot, p.id)} aria-label={`${inRoom ? 'In your room' : 'Swap in'} ${p.title} from ${p.merchant.name}, ${money(p.price.amount)}, ${r.overall}`}>
              <ProductThumb p={p} size={58} />
              <div className="res-main">
                <div className="res-title">{p.title}</div>
                <div className="res-meta">
                  <span className="vibe-dot" style={{ background: vibeById(p.vibe).swatches[0], borderColor: vibeById(p.vibe).swatches[2] }} title={vibeById(p.vibe).name} />
                  <span>{p.merchant.name}</span>
                </div>
                <div className="res-verdict">
                  <VerdictPill v={r.overall} small />
                  {r.renter.some((f) => f.tone === 'bad') && <span className="pill pill-sm v-bad">Drill</span>}
                </div>
              </div>
              <div className="res-price">
                <b>{money(p.price.amount)}</b>
                {inRoom ? <span className="in-room-tag">In room</span> : <span className={delta > 0 ? 'up' : 'down'}>{delta > 0 ? `+${money(delta)}` : delta < 0 ? `−${money(-delta)}` : '±$0'}</span>}
              </div>
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="muted empty">Nothing matches “{s.query}”. Try a shop name or a vibe like “retro”.</li>}
      </ul>
    </section>
  );
}
