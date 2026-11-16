import { actions, useApp } from '../store';
import { deriveRoom, previewVibe } from '../derive';
import { VIBES, vibeById } from '../data/vibes';
import { money, useCountUp } from '../hooks';
import { Logo } from './Bits';
import { RoomScene } from '../scene/RoomScene';
import { defaultPositions } from '../fit/layout';
import { ROOM } from '../data/room';
import { fmtLen } from '../fit/units';

export function TopBar() {
  const s = useApp();
  const room = deriveRoom(s);
  return (
    <header className="topbar">
      <div className="brand">
        <Logo />
        <div>
          <div className="wordmark">first place</div>
          <div className="tag">your first apartment, figured out</div>
        </div>
      </div>
      <div className="room-name">
        <b>My first place</b>
        <span>Studio · {fmtLen(ROOM.wallWidth, s.unit)} wall · {vibeById(s.vibe).emoji} {vibeById(s.vibe).name}</span>
      </div>
      <div className="top-actions">
        <span className="budget-pill">{money(s.budget)} budget</span>
        <button className="btn btn-ghost" onClick={() => actions.set({ panel: 'share' })}>↗ Share</button>
        <button className="btn btn-dark cart-btn" onClick={() => actions.openCart()} aria-label={`Open cart, ${room.pieces} items`}>
          🛒 Cart <span className="count">{room.pieces}</span>
        </button>
      </div>
    </header>
  );
}

export function LeftRail() {
  const s = useApp();
  return (
    <aside className="left-rail" aria-label="Your place">
      <section className="card">
        <div className="eyebrow">Your place</div>
        <div className="studio">
          <div className="studio-thumb" aria-hidden>
            <div className="studio-wall" />
            <div className="studio-door" />
          </div>
          <div>
            <b>Sample Studio</b>
            <div className="muted small">{fmtLen(ROOM.wallWidth, s.unit)} wall · {fmtLen(ROOM.wallHeight, s.unit)} ceiling</div>
          </div>
        </div>
        <button className="link" onClick={() => actions.set({ panel: 'photo' })}>📷 Try your own photo <span className="beta">beta</span></button>
      </section>

      <section className="card">
        <div className="eyebrow">What's staying</div>
        <div className="staying">
          <span className="chip chip-own"><i style={{ background: '#8E9196' }} /> Grey couch</span>
          <span className="chip chip-own"><i style={{ background: '#C49A6C' }} /> Oak coffee table</span>
        </div>
        <p className="quip">Your couch stays. Everything else is up for grabs.</p>
      </section>

      <section className="card">
        <div className="eyebrow">Your constraints</div>
        <label className="field">
          <span>Budget</span>
          <b>{money(s.budget)}</b>
        </label>
        <input type="range" min={500} max={2000} step={50} value={s.budget} onChange={(e) => actions.set({ budget: +e.target.value })} aria-label="Budget" />
        <label className="field">
          <span>Front door width</span>
          <span className="num">
            <input type="number" min={60} max={120} value={s.unit === 'in' ? Math.round(s.doorWidth / 2.54) : s.doorWidth} onChange={(e) => actions.set({ doorWidth: s.unit === 'in' ? +e.target.value * 2.54 : +e.target.value })} aria-label="Door width" />
            {s.unit}
          </span>
        </label>
        <Toggle label="No drilling (renter)" on={s.noDrilling} onChange={(v) => actions.set({ noDrilling: v })} />
        <Toggle label="Walk-up, no elevator" on={s.walkUp} onChange={(v) => actions.set({ walkUp: v })} />
        <div className="field">
          <span>Units</span>
          <div className="seg" role="group" aria-label="Units">
            {(['cm', 'in'] as const).map((u) => (
              <button key={u} className={s.unit === u ? 'on' : ''} onClick={() => actions.set({ unit: u })} aria-pressed={s.unit === u}>{u}</button>
            ))}
          </div>
        </div>
      </section>
    </aside>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="toggle" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span>{label}</span>
      <i className={on ? 'on' : ''} />
    </button>
  );
}

export function VibeBar() {
  const s = useApp();
  const views = Object.fromEntries(VIBES.map((v) => [v.id, previewVibe(v.id, s)]));
  return (
    <div className="vibe-bar">
      <div className="stickers" role="radiogroup" aria-label="Pick a vibe">
        <span className="vibe-check">vibe check →</span>
        {VIBES.map((v) => (
          <button
            key={v.id}
            role="radio"
            aria-checked={s.vibe === v.id}
            className={`sticker ${s.vibe === v.id ? 'on' : ''}`}
            style={{ background: v.sticker.bg, color: v.sticker.fg, ['--rot' as string]: `${v.sticker.rotate}deg` }}
            onClick={() => s.vibe !== v.id && actions.setVibe(v.id)}
          >
            <span className="emo">{v.emoji}</span>
            <span className="st-text">
              <span className="st-name">{v.name}<span className="sw">{v.swatches.map((c) => <i key={c} style={{ background: c }} />)}</span></span>
              <span className={`st-total ${views[v.id].budget.over ? 'over' : ''}`}>{money(views[v.id].total)}{views[v.id].budget.over ? ' · over' : ''}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function StageTools() {
  const s = useApp();
  return (
    <div className="scene-tools">
      <button className="btn btn-ghost" onClick={() => actions.remix()} title="Swap every piece for its sibling in the same vibe">🎲 Remix</button>
      <button className={`btn btn-ghost ${s.showMeasurements ? 'active' : ''}`} onClick={() => actions.set({ showMeasurements: !s.showMeasurements })} aria-pressed={s.showMeasurements}>📏 Measurements</button>
    </div>
  );
}

export function BudgetDock() {
  const s = useApp();
  const room = deriveRoom(s);
  const total = useCountUp(room.total);
  const pct = Math.min(100, (room.total / s.budget) * 100);
  return (
    <section className={`dock ${room.budget.over ? 'over' : ''}`} aria-label="Room budget">
      <div className="dock-row">
        <div>
          <div className="eyebrow light">Room total</div>
          <div className="dock-total" aria-live="polite">{money(total)}</div>
        </div>
        <label className="dock-budget">
          <span>of</span>
          <span className="dollar">$</span>
          <input type="number" min={100} step={50} value={s.budget} onChange={(e) => actions.set({ budget: Math.max(0, +e.target.value || 0) })} aria-label="Your budget" />
        </label>
      </div>
      <div className="meter"><i style={{ width: `${pct}%` }} /></div>
      <div className="dock-stats">
        <span className={room.budget.over ? 'neg' : 'pos'}>{room.budget.label}</span>
        <span>{room.pieces} pieces · {room.shops} indie shops</span>
        <span>Vibe match {room.vibeMatch}%</span>
      </div>
      <button className="btn btn-green big" onClick={() => actions.openCart()} disabled={room.pieces === 0}>Buy this room →</button>
    </section>
  );
}

export function ComparisonStrip() {
  const s = useApp();
  return (
    <div className="compare" aria-label="Compare vibes">
      {VIBES.map((v) => {
        const view = previewVibe(v.id, s);
        const isOn = s.vibe === v.id;
        return (
          <button key={v.id} className={`cmp ${isOn ? 'on' : ''}`} onClick={() => !isOn && actions.setVibe(v.id)} aria-label={`${v.name}: ${money(view.total)}, ${view.budget.label}, ${view.shops} shops, ${view.warnings} fit warnings`}>
            <RoomScene uid={`mini-${v.id}`} vibe={v} products={view.products} positions={defaultPositions(view.products)} className="cmp-scene" />
            <div className="cmp-info">
              <b>{v.emoji} {v.name}</b>
              <span className="cmp-total">{money(view.total)}</span>
              <span className={view.budget.over ? 'neg' : 'pos'}>{view.budget.label}</span>
              <span className="muted">{view.shops} shops · {view.warnings ? `⚠ ${view.warnings}` : '✓ 0'} warnings</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
