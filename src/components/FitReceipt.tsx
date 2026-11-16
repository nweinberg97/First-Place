import { useState } from 'react';
import { actions, useApp } from '../store';
import { deriveRoom } from '../derive';
import { fmtDims, normalize } from '../fit/units';
import { SourceBadge } from './Bits';
import { money } from '../hooks';
import { vibeById } from '../data/vibes';

const SLOT_NAME: Record<string, string> = { rug: 'Rug', chair: 'Accent chair', lamp: 'Floor lamp', 'side-table': 'Side table', shelf: 'Shelf', 'wall-art': 'Wall art' };

const STAMP: Record<string, { text: string; cls: string }> = {
  Fits: { text: 'FITS ✓', cls: 'stamp-good' },
  'Probably fits': { text: 'PROBABLY FITS', cls: 'stamp-est' },
  Squeeze: { text: 'SQUEEZE', cls: 'stamp-warn' },
  "Won't fit": { text: "WON'T FIT", cls: 'stamp-bad' },
  "Can't tell": { text: "CAN'T TELL", cls: 'stamp-est' },
};

export function FitReceipt() {
  const s = useApp();
  const [open, setOpen] = useState(false);
  const room = deriveRoom(s);
  const slot = s.selectedSlot;
  const p = slot ? room.products[slot] : undefined;
  const r = slot ? room.receipts[slot] : undefined;

  if (!slot || !p || !r) {
    return (
      <section className="receipt receipt-empty" aria-label="Fit Receipt">
        <div className="receipt-head">FIT RECEIPT</div>
        <p className="muted">Tap anything in the room to see if it really fits: your space, your door, your stuff, your budget.</p>
      </section>
    );
  }

  const n = normalize(p.dimensions);
  const asking = s.asking[p.id];
  const answered = s.answered[p.id];
  const stamp = STAMP[r.overall];
  const spaceText = { fits: 'FITS', tight: 'TIGHT', 'wont-fit': "WON'T FIT HERE", 'cant-tell': "CAN'T TELL" }[r.space.verdict];
  const doorText = { 'gets-through': 'GETS THROUGH', tight: 'TIGHT SQUEEZE', 'wont-get-through': "WON'T GET THROUGH", 'cant-tell': "CAN'T TELL" }[r.door.verdict];
  const compatText = { matches: 'MATCHES', partial: 'PARTIAL', clashes: 'CLASHES' }[r.compat.verdict];
  const lineCls = (good: boolean, bad: boolean) => (bad ? 'bad' : good ? 'good' : 'warn');

  return (
    <section className="receipt" aria-label={`Fit Receipt for ${p.title}`} aria-live="polite">
      <div className="receipt-head">
        <span>{p.merchant.name.toUpperCase()}</span>
        <span className="indie">indie shop</span>
      </div>
      <div className="receipt-title">
        <div>
          <div className="r-slot">{SLOT_NAME[slot]}</div>
          <h3>{p.title}</h3>
        </div>
        <div className="r-price">{money(p.price.amount)}</div>
      </div>
      <div className="r-dims">
        <span>{fmtDims(n, s.unit)}</span>
        <SourceBadge source={p.dimensions.source} />
        {p.dimensions.unit === 'in' && s.unit === 'cm' && p.dimensions.source !== 'missing' && <span className="src">↺ Converted from inches</span>}
        {p.dimensions.unit === 'cm' && s.unit === 'in' && p.dimensions.source !== 'missing' && <span className="src">↺ Converted from cm</span>}
      </div>

      <div className="dots" />
      {!open && (
        <div className="r-compact">
          <span className={`pill pill-sm ${r.space.verdict === 'fits' ? (r.space.estimated ? 'v-est' : 'v-good') : r.space.verdict === 'wont-fit' ? 'v-bad' : r.space.verdict === 'tight' ? 'v-warn' : 'v-est'}`}>Space · {spaceText.toLowerCase()}</span>
          <span className={`pill pill-sm ${r.door.verdict === 'gets-through' ? 'v-good' : r.door.verdict === 'wont-get-through' ? 'v-bad' : r.door.verdict === 'tight' ? 'v-warn' : 'v-est'}`}>Door · {doorText.toLowerCase()}</span>
          <span className={`pill pill-sm ${r.compat.verdict === 'matches' ? 'v-good' : r.compat.verdict === 'clashes' ? 'v-bad' : 'v-warn'}`}>Vibe · {compatText.toLowerCase()}</span>
          {r.renter.filter((f) => f.tone !== 'good').map((f) => <span key={f.label} className={`pill pill-sm ${f.tone === 'bad' ? 'v-bad' : 'v-warn'}`}>{f.label}</span>)}
          <small className="r-why">{r.overall === "Won't fit" ? (r.door.verdict === 'wont-get-through' ? r.door.note : r.space.note) : r.space.note}</small>
        </div>
      )}
      {open && <ul className="r-lines">
        <li className={lineCls(r.space.verdict === 'fits', r.space.verdict === 'wont-fit')}>
          <span>01 SPACE</span><i /><b>{r.space.estimated && r.space.verdict !== 'wont-fit' ? 'PROBABLY ' : ''}{spaceText}</b>
          <small>{r.space.note}{r.space.estimated ? ' Based on an estimated size.' : ''}</small>
        </li>
        <li className={lineCls(r.door.verdict === 'gets-through', r.door.verdict === 'wont-get-through')}>
          <span>02 DOORWAY</span><i /><b>{doorText}</b>
          <small>{r.door.note}{r.door.estimated && r.door.verdict !== 'cant-tell' && p.slot !== 'rug' ? ' (estimate)' : ''}</small>
        </li>
        <li className={lineCls(r.compat.verdict === 'matches', r.compat.verdict === 'clashes')}>
          <span>03 GOES WITH YOUR STUFF</span><i /><b>{compatText}</b>
          <small>{r.compat.note} <em>Inferred from style + color.</em></small>
        </li>
        <li className={room.budget.over ? 'bad' : 'good'}>
          <span>04 BUDGET</span><i /><b>{room.budget.over ? 'OVER' : 'WITHIN'}</b>
          <small>Room total {money(room.total)} of {money(s.budget)}. {room.budget.label}.</small>
        </li>
        <li className={r.renter.some((f) => f.tone === 'bad') ? 'bad' : r.renter.some((f) => f.tone === 'warn') ? 'warn' : 'good'}>
          <span>05 RENTER CHECK</span><i /><b>{r.renter.some((f) => f.tone === 'bad') ? 'HEADS UP' : 'OK'}</b>
          <div className="chips">
            {r.renter.map((f) => <span key={f.label} className={`chip chip-${f.tone}`}>{f.tone === 'bad' ? '✕' : f.tone === 'warn' ? '!' : '✓'} {f.label}</span>)}
          </div>
        </li>
      </ul>}
      <button className="r-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Hide full receipt ▴' : 'Full receipt ▾'}</button>

      {p.dimensions.source === 'missing' || asking ? (
        <div className="ask">
          {asking === 'loading' && (
            <div className="bubble typing" aria-label="Merchant is typing"><span /><span /><span /></div>
          )}
          {answered && p.merchantQuestionResponse && (
            <div className="bubble from-shop">
              <b>{p.merchant.name}:</b> {p.merchantQuestionResponse.answer}
              <div className="sim">Simulated merchant response · ask_business</div>
            </div>
          )}
          {!asking && (
            <button className="btn btn-purple" onClick={() => actions.ask(p.id)}>💬 Ask the merchant for dimensions</button>
          )}
        </div>
      ) : null}

      <div className="receipt-foot">
        <div className="stamp-wrap">
          <div key={`${p.id}-${r.overall}-${answered ? 1 : 0}`} className={`stamp ${stamp.cls}`}>{stamp.text}</div>
          <span className="r-sample">in the sample studio</span>
        </div>
        <div className="r-actions">
          <button className="btn btn-purple" onClick={() => actions.set({ panel: 'ar' })}>📱 Try it in my room</button>
          <button className="btn btn-ghost" onClick={() => actions.remove(slot)} aria-label={`Remove ${p.title} from the room`}>✕</button>
        </div>
      </div>
      <div className="zigzag" />
      <span className="sr-only">Overall verdict: {r.overall}. Vibe {vibeById(s.vibe).name}.</span>
    </section>
  );
}
