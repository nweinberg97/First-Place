import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import type { Slot } from '../types';
import { SLOTS } from '../types';
import { actions, useApp } from '../store';
import { deriveRoom } from '../derive';
import { vibeById } from '../data/vibes';
import { money } from '../hooks';
import { ProductThumb, VerdictPill, Logo } from './Bits';
import { RoomScene, itemBox, VIEW } from '../scene/RoomScene';
import { fmtLen, normalize } from '../fit/units';
import { PLACEHOLDER } from '../data/room';
import { ProductArt } from '../scene/ProductArt';

function useEscape(close: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [close]);
}
const close = () => actions.set({ panel: null });

function Modal({ children, label, className = '' }: { children: ReactNode; label: string; className?: string }) {
  useEscape(close);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="scrim" onClick={close}>
      <div ref={ref} tabIndex={-1} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close} aria-label="Close">✕</button>
        {children}
      </div>
    </div>
  );
}

// ── Cart ────────────────────────────────────────────────────────────
export function CartDrawer() {
  const s = useApp();
  useEscape(close);
  const room = deriveRoom(s);
  const slots = SLOTS.filter((sl) => room.products[sl]);
  const groups = new Map<string, Slot[]>();
  slots.forEach((sl) => {
    const m = room.products[sl]!.merchant.name;
    groups.set(m, [...(groups.get(m) ?? []), sl]);
  });
  const beforeYouBuy: string[] = ['Fit was checked in the sample studio, not your apartment. Measure your space and the whole delivery route before ordering.'];
  slots.forEach((sl) => {
    const p = room.products[sl]!, r = room.receipts[sl]!;
    if (p.dimensions.source === 'inferred') beforeYouBuy.push(`${p.title}: size is estimated by Shopify, not stated by the shop.`);
    if (p.dimensions.source === 'missing') beforeYouBuy.push(`${p.title}: no dimensions yet. Ask the merchant first.`);
    if (r.space.verdict === 'wont-fit') beforeYouBuy.push(`${p.title}: won't fit where it's placed.`);
    if (r.door.verdict === 'wont-get-through') beforeYouBuy.push(`${p.title}: the box won't get through your ${Math.round(s.doorWidth)} cm door.`);
    if (r.door.verdict === 'tight' || r.space.verdict === 'tight') beforeYouBuy.push(`${p.title}: tight squeeze. Measure twice.`);
    r.renter.filter((f) => f.tone !== 'good').forEach((f) => beforeYouBuy.push(`${p.title}: ${f.label.toLowerCase()}.`));
  });
  return (
    <div className="scrim right" onClick={close}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your room cart" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">Your room</div>
            <h2>{room.pieces} pieces · {groups.size} sample shops</h2>
          </div>
          <button className="x static" onClick={close} aria-label="Close cart">✕</button>
        </div>
        <div className="drawer-body">
          {[...groups.entries()].map(([shop, sls]) => (
            <section key={shop} className="shop-group">
              <div className="shop-head">
                <b>{shop}</b>
                <span className="indie-tag">Sample independent shop</span>
              </div>
              {sls.map((sl) => {
                const p = room.products[sl]!;
                return (
                  <div key={sl} className="line">
                    <ProductThumb p={p} size={48} />
                    <div className="line-main">
                      <div>{p.title}</div>
                      <VerdictPill v={room.receipts[sl]!.overall} small />
                    </div>
                    <div className="qty" aria-label={`Quantity for ${p.title}`}>
                      <button onClick={() => actions.setQty(sl, s.qty[sl] - 1)} aria-label="Decrease">−</button>
                      <span>{s.qty[sl]}</span>
                      <button onClick={() => actions.setQty(sl, s.qty[sl] + 1)} aria-label="Increase">+</button>
                    </div>
                    <div className="line-price">{money(p.price.amount * s.qty[sl])}</div>
                    <button className="rm" onClick={() => actions.remove(sl)} aria-label={`Remove ${p.title}`}>✕</button>
                  </div>
                );
              })}
              <div className="subtotal">Shop subtotal <b>{money(sls.reduce((a, sl) => a + room.products[sl]!.price.amount * s.qty[sl], 0))}</b></div>
            </section>
          ))}
          {room.pieces === 0 && <p className="muted">Your room is empty. Pick a vibe to fill it.</p>}
          {beforeYouBuy.length > 0 && (
            <section className="byb">
              <b>Before you buy</b>
              <ul>{beforeYouBuy.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          )}
        </div>
        <div className="drawer-foot">
          <div className="row"><span>Delivery</span><span>Set by each shop at checkout</span></div>
          <div className="row total"><span>Room total</span><b>{money(room.total)}</b></div>
          <div className={`row ${room.budget.over ? 'neg' : 'pos'}`}><span>Budget {money(s.budget)}</span><span>{room.budget.label}</span></div>
          <button className="btn btn-green big" disabled={room.pieces === 0} onClick={() => actions.checkout()}>Check out {groups.size} shops →</button>
          <p className="fine">One room, one tap. Each shop checks out separately and stays the merchant of record. Pay with Shop Pay.</p>
        </div>
      </aside>
    </div>
  );
}

// ── Checkout handoff ────────────────────────────────────────────────
export function Checkout() {
  const s = useApp();
  useEscape(close);
  const room = deriveRoom(s);
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="checkout" role="dialog" aria-modal="true" aria-label="Checkout handoff">
      <Confetti />
      <div className="co-inner">
        <span className="sim-label">Simulated checkout handoff · UCP checkout.create</span>
        <h1>Your room is ready. 🎉</h1>
        <p className="lead">In the real flow, your furniture would come from {s.checkouts.length} independent shops, each handling its own order and delivery. These are sample shops; nothing is ordered.</p>
        <div className="co-grid">
          {s.checkouts.map((c) => {
            const items = SLOTS.filter((sl) => room.products[sl]?.merchant.name === c.merchant).map((sl) => room.products[sl]!);
            return (
              <div key={c.merchant} className="co-card">
                <div className="co-shop">{c.merchant}</div>
                <div className="co-items">{items.map((p) => <ProductThumb key={p.id} p={p} size={44} bg="#fff" />)}</div>
                <div className="muted small">{items.map((p) => p.title).join(' · ')}</div>
                <div className="co-total">{money(c.total.amount)}</div>
                <button className="btn btn-green" onClick={() => setOpened(c.continueUrl)}>Continue to {c.merchant} checkout (simulated) →</button>
              </div>
            );
          })}
        </div>
        {opened && <p className="url-note">Simulated: in a live build this would open the shop's own checkout (<code>{opened}</code>). No order was placed.</p>}
        <div className="co-foot">
          <span>🛡 Each shop stays the merchant of record.</span>
          <span className="shoppay">Pay with <b>Shop</b><i>Pay</i></span>
        </div>
        <button className="btn btn-ghost" onClick={close}>← Back to my room</button>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#008060', '#95BF47', '#5A31F4', '#FF5DA2', '#FFD23F', '#2EC4B6'];
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 90 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 15) * 60}ms`, animationDuration: `${1600 + ((i * 53) % 1400)}ms`, transform: `rotate(${(i * 47) % 360}deg)` }} />
      ))}
    </div>
  );
}

// ── AR preview ──────────────────────────────────────────────────────
export function ARPreview() {
  const s = useApp();
  const room = deriveRoom(s);
  const slot = s.selectedSlot ?? 'chair';
  const p = room.products[slot];
  const r = room.receipts[slot];
  const [phase, setPhase] = useState<'scan' | 'ready' | 'placed'>('scan');
  useEffect(() => {
    if (phase !== 'scan') return;
    const t = setTimeout(() => setPhase('ready'), 1700);
    return () => clearTimeout(t);
  }, [phase]);
  if (!p || !r) return <Modal label="AR preview"><p>Pick something in the room first.</p></Modal>;
  const box = slot === 'rug' ? { x: 200, y: 560, w: 640, h: 110 } : itemBox(p, s.positions[slot] ?? 0);
  const vx = Math.max(0, Math.min(VIEW.w - 460, box.x + box.w / 2 - 230)), vy = Math.max(0, Math.min(VIEW.h - 620, box.y - 140));
  const n = p.dimensions.source === 'missing' ? PLACEHOLDER[p.slot] : normalize(p.dimensions);
  const pct = { left: `${((box.x - vx - 10) / 460) * 100}%`, top: `${((box.y - vy - 10) / 620) * 100}%`, width: `${((box.w + 20) / 460) * 100}%`, height: `${((box.h + 20) / 620) * 100}%` };
  const shown = phase === 'placed' ? room.products : { ...room.products, [slot]: undefined };
  const good = r.overall === 'Fits' || r.overall === 'Probably fits';
  const status = good ? `${r.overall} · ${Math.round(Math.max(0, r.space.spareCm ?? 0))} cm to spare` : r.overall;
  const steps = [
    ['Scan your floor', 'Move your phone slowly so it can find the floor.'],
    ['Tap to place', `Drop the ${p.title.toLowerCase()} on the spot you picked.`],
    ['Check the fit', 'See its real size and whether it fits, then walk around it.'],
  ];
  const idx = phase === 'scan' ? 0 : phase === 'ready' ? 1 : 2;
  return (
    <Modal label="AR preview" className="ar-modal">
      <div className="ar-wrap">
        <div className="phone">
          <div className="notch" />
          <div className="phone-screen">
            <RoomScene uid="ar" vibe={vibeById(s.vibe)} products={shown} positions={s.positions} viewBox={`${vx} ${vy} 460 620`} className="ar-scene" />
            <div className="grain" />
            {phase === 'scan' && <div className="scan" />}
            {phase === 'scan' && <div className="ar-hint">Finding the floor…<br /><span style={{ fontWeight: 500, opacity: 0.8 }}>move your phone slowly</span></div>}
            {phase === 'ready' && <div className="ghost-target" style={pct} />}
            {phase === 'ready' && <div className="ar-hint" style={{ top: '22%' }}>Floor found ✓<br />Tap the button to place it here</div>}
            {phase === 'placed' && (
              <div className="brackets" style={pct}>
                <i /><i /><i /><i />
                <span className="ar-dim w">{fmtLen(n.width, s.unit)}</span>
                {slot !== 'rug' && <span className="ar-dim h">{fmtLen(n.height, s.unit)}</span>}
              </div>
            )}
            {phase === 'placed' && <div className={`ar-status ${good ? '' : 'bad'}`}>{status}</div>}
            <button className={`shutter ${phase === 'placed' ? 'done' : phase === 'ready' ? 'ready' : ''}`} disabled={phase === 'scan'} onClick={() => setPhase(phase === 'placed' ? 'scan' : 'placed')} aria-label={phase === 'placed' ? 'Place again' : 'Place item'}>{phase === 'placed' ? '↺' : ''}</button>
          </div>
        </div>
        <div className="ar-copy">
          <span className="sim-label">Simulated AR · not real device AR</span>
          <h2>Simulated AR preview: {p.title}</h2>
          <p className="muted">{p.merchant.name} · {money(p.price.amount)} · {fmtLen(n.width, s.unit)} wide</p>
          <ol className="ar-steps">
            {steps.map(([t, d], i) => (
              <li key={t} className={i === idx ? 'on' : i < idx ? 'done' : ''}>
                <b>{i < idx ? '✓' : i + 1}</b>
                <span><strong>{t}</strong><br /><span className="small">{d}</span></span>
              </li>
            ))}
          </ol>
          {phase === 'placed' && <p className="small">{r.space.note} {good ? 'Looks right? Add it to your cart from the room.' : 'Try a smaller one: tap ‹ › under it in the room.'}</p>}
          <p className="muted small">This is a mock-up drawn from the sample studio, not your camera. A real version would use the merchant's 3D model (WebXR / AR Quick Look).</p>
        </div>
      </div>
    </Modal>
  );
}

// ── Share story card ────────────────────────────────────────────────
export function SharePreview() {
  const s = useApp();
  const room = deriveRoom(s);
  const vibe = vibeById(s.vibe);
  const svgRef = useRef<SVGSVGElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 1080;
        c.height = 1920;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 1080, 1920);
        try {
          setUrl(c.toDataURL('image/png'));
        } catch {
          setErr('Your browser blocked the image export. Screenshot the preview instead.');
        }
      };
      img.onerror = () => setErr('Image export is not supported in this browser. Screenshot the preview instead.');
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    } catch {
      setErr('Image export failed. Screenshot the preview instead.');
    }
  }, []);

  return (
    <Modal label="Share my room" className="share-modal">
      <div className="share-wrap">
        <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" className="story" fontFamily="Inter, system-ui, sans-serif">
          <rect width="1080" height="1920" fill={vibe.id === 'den' ? '#141518' : '#FAF8F5'} />
          <rect x="0" y="0" width="1080" height="560" fill={vibe.sticker.bg} />
          <text x="80" y="130" fontSize="60" fontWeight="900" fill={vibe.sticker.fg} letterSpacing="-2">my first place</text>
          <text x="80" y="310" fontSize="150" fontWeight="900" fill={vibe.sticker.fg} letterSpacing="-6">{money(room.total)}</text>
          <text x="80" y="395" fontSize="44" fontWeight="700" fill={vibe.sticker.fg} opacity="0.85">{room.pieces} pieces from {room.shops} shops</text>
          <g transform="translate(700 420) rotate(-6)">
            <rect x="0" y="0" width="300" height="96" rx="20" fill="#5A31F4" />
            <text x="150" y="62" textAnchor="middle" fontSize="44" fontWeight="900" fill="#fff">{vibe.emoji} {vibe.name}</text>
          </g>
          <g transform="translate(40 600)">
            <rect width="1000" height="712" rx="36" fill="#000" opacity="0.08" />
            <svg x="0" y="0" width="1000" height="712" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}>
              <RoomScene uid="story" vibe={vibe} products={room.products} positions={s.positions} />
            </svg>
          </g>
          <g transform="translate(80 1395)">
            {SLOTS.filter((sl) => room.products[sl]).slice(0, 6).map((sl, i) => {
              const p = room.products[sl]!;
              return (
                <g key={sl} transform={`translate(0 ${i * 47})`}>
                  <text x="0" y="0" fontSize="32" fill={vibe.id === 'den' ? '#eee' : '#1A1A1A'}>{p.title}</text>
                  <text x="920" y="0" fontSize="32" fontWeight="800" textAnchor="end" fill={vibe.id === 'den' ? '#eee' : '#1A1A1A'}>{money(p.price.amount)}</text>
                </g>
              );
            })}
          </g>
          <rect x="80" y="1700" width="920" height="120" rx="60" fill="#008060" />
          <text x="540" y="1776" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff">Made with First Place (demo)</text>
        </svg>
        <div className="share-copy">
          <h2>Flex your first place</h2>
          <p className="muted">A 9:16 story card of your actual room: total, shops and vibe. Made for IG, TikTok and the group chat.</p>
          {url ? (
            <>
              <a className="btn btn-green big" href={url} download={`first-place-${vibe.id}.png`}>⬇ Download PNG</a>
              <img src={url} alt="Your story card" className="story-png" />
              <p className="muted small">Download blocked? Right-click (or long-press) the image above to save it.</p>
            </>
          ) : err ? (
            <p className="neg small">{err}</p>
          ) : (
            <p className="muted small">Rendering…</p>
          )}
          <p className="muted small">Every share links back to the shops in the room. That's free reach for indie merchants.</p>
        </div>
      </div>
    </Modal>
  );
}

// ── Try your own photo (beta) ───────────────────────────────────────
export function PhotoCalibration() {
  const s = useApp();
  const room = deriveRoom(s);
  const [src, setSrc] = useState<string | null>(null);
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const [len, setLen] = useState(80);
  const [floorY, setFloorY] = useState<number | null>(null);
  const [lenUnit, setLenUnit] = useState<'cm' | 'in'>('cm');
  const imgRef = useRef<HTMLDivElement>(null);
  const step = !src ? 0 : pts.length < 2 ? 1 : floorY == null ? 2 : 3;
  const pxPerCm = pts.length === 2 ? Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) / (lenUnit === 'in' ? len * 2.54 : len) : 0;

  const click = (e: ReactMouseEvent) => {
    const r = imgRef.current!.getBoundingClientRect();
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (step === 1) setPts((p) => [...p, pt]);
    else if (step === 2) setFloorY(pt.y);
  };

  let cursor = 20;
  const floorItems = SLOTS.filter((sl) => room.products[sl] && sl !== 'rug' && sl !== 'wall-art');
  return (
    <Modal label="Try your own photo" className="photo-modal">
      <span className="sim-label">Beta · calibrated photo preview</span>
      <h2>Try your own photo</h2>
      <ol className="steps">
        <li className={step === 0 ? 'on' : step > 0 ? 'done' : ''}>Upload a straight-on photo of a wall</li>
        <li className={step === 1 ? 'on' : step > 1 ? 'done' : ''}>Click both ends of something you know the size of</li>
        <li className={step === 2 ? 'on' : step > 2 ? 'done' : ''}>Click where the wall meets the floor</li>
      </ol>
      {!src ? (
        <label className="upload">
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setSrc(URL.createObjectURL(f)); }} />
          <span>📷 Choose a photo</span>
          <small>It stays on your device. Nothing is uploaded.</small>
        </label>
      ) : (
        <>
          {pts.length === 2 && (
            <div className="len-row">
              That line is <input type="number" value={len} onChange={(e) => setLen(+e.target.value || 1)} aria-label="Known length" />
              <div className="seg">{(['cm', 'in'] as const).map((u) => <button key={u} className={lenUnit === u ? 'on' : ''} onClick={() => setLenUnit(u)}>{u}</button>)}</div>
              <span className="muted small">→ {pxPerCm.toFixed(2)} px per cm</span>
              <button className="link" onClick={() => { setPts([]); setFloorY(null); }}>Redo</button>
            </div>
          )}
          <div ref={imgRef} className="photo-stage" onClick={click}>
            <img src={src} alt="Your room" draggable={false} />
            <svg className="photo-overlay">
              {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={6} fill="#5A31F4" stroke="#fff" strokeWidth={2} />)}
              {pts.length === 2 && <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke="#5A31F4" strokeWidth={3} strokeDasharray="6 4" />}
              {floorY != null && <line x1={0} x2="100%" y1={floorY} y2={floorY} stroke="#008060" strokeWidth={2} strokeDasharray="8 6" />}
              {step === 3 && floorItems.map((sl) => {
                const p = room.products[sl]!;
                const d = p.dimensions.source === 'missing' ? PLACEHOLDER[p.slot] : normalize(p.dimensions);
                const w = d.width * pxPerCm, h = Math.max(6, d.height * pxPerCm);
                const x = cursor;
                cursor += w + 16;
                const wall = sl === 'shelf' && p.illustration.variant === 'floating';
                return (
                  <g key={sl} transform={`translate(${x} ${wall ? floorY! - 140 * pxPerCm - h : floorY! - h})`}>
                    <ProductArt slot={sl} variant={p.illustration.variant} w={w} h={h} colors={p.colors} uid="photo" />
                  </g>
                );
              })}
            </svg>
          </div>
          {step === 3 && <p className="muted small">Pieces drawn at {pxPerCm.toFixed(2)} px/cm from merchant dimensions. Next: drag-to-place and taste matching with catalog.like on this photo.</p>}
        </>
      )}
      <button className="btn btn-ghost" onClick={close}>← Back to the Sample Studio</button>
    </Modal>
  );
}

// ── Under the hood ──────────────────────────────────────────────────
function Json({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2) ?? 'null';
  const html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/("(?:\\.|[^"\\])*")(\s*:)?/g, (_m, str, colon) => (colon ? `<span class="j-key">${str}</span>${colon}` : `<span class="j-str">${str}</span>`))
    .replace(/\b(true|false|null)\b/g, '<span class="j-bool">$1</span>')
    .replace(/(?<![\w"#])(-?\d+(?:\.\d+)?)(?![\w"])/g, '<span class="j-num">$1</span>');
  return <pre className="json" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function UnderTheHood() {
  const s = useApp();
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div className={`hood ${s.hoodOpen ? 'open' : ''}`} aria-hidden={!s.hoodOpen}>
      <div className="hood-head">
        <div>
          <b>&lt;/&gt; Under the hood</b>
          <span className="muted small"> Demo mode: every call below runs in your browser against sample products. It shows the intended flow (discovery via Shopify Global Catalog, cart and checkout via UCP). No live Shopify requests are made.</span>
        </div>
        <div className="hood-actions">
          <span className="muted small">{s.events.length} calls</span>
          <button className="btn btn-ghost sm" onClick={() => actions.set({ events: [] })}>Clear</button>
          <button className="btn btn-ghost sm" onClick={() => actions.set({ hoodOpen: false })} aria-label="Close under the hood">✕</button>
        </div>
      </div>
      <ul className="hood-list">
        {s.events.map((e, i) => (
          <li key={e.id} className={i === 0 ? 'newest' : ''}>
            <button className="ev" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}>
              <span className="t">{e.at}</span>
              <span className={`tool tool-${e.tool.split(/[._]/)[0]}`}>{e.tool}</span>
              <span className="summary">{summarize(e.request)}</span>
              <span className="status">● simulated · intended: {/^(cart|checkout)/.test(e.tool) ? 'UCP' : 'Global Catalog'}</span>
            </button>
            {open === e.id && (
              <div className="ev-body">
                <div><div className="ev-label">request</div><Json value={e.request} /></div>
                <div><div className="ev-label">response</div><Json value={e.response} /></div>
                <button className="btn btn-ghost sm" onClick={() => { navigator.clipboard?.writeText(JSON.stringify({ tool: e.tool, request: e.request, response: e.response }, null, 2)); setCopied(e.id); }}>{copied === e.id ? 'Copied ✓' : 'Copy JSON'}</button>
              </div>
            )}
          </li>
        ))}
        {s.events.length === 0 && <li className="muted small" style={{ padding: 16 }}>No calls yet. Flip a vibe.</li>}
      </ul>
    </div>
  );
}

function summarize(req: unknown): string {
  const r = req as Record<string, unknown>;
  if (r?.query) return `"${r.query}"`;
  if (r?.id) return String(r.id).replace('gid://shopify/', '');
  if (r?.question) return `${r.shop}: "${r.question}"`;
  if (r?.line_items) return `${(r.line_items as unknown[]).length} line items`;
  if (r?.cart_id) return String(r.cart_id).replace('gid://shopify/', '');
  return '';
}

export function Toast() {
  const s = useApp();
  if (!s.toast) return null;
  return <div key={s.toast.id} className="toast" role="status">{s.toast.text}</div>;
}

export { Logo };
