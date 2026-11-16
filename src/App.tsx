import { actions, useApp } from './store';
import { deriveRoom, rankedCandidates } from './derive';
import { vibeById } from './data/vibes';
import { RoomScene } from './scene/RoomScene';
import { BudgetDock, PlacePanel, TopBar, VibeBar, StageTools, LeftRail } from './components/Panels';
import { FitReceipt } from './components/FitReceipt';
import { Discover } from './components/Discover';
import { ARPreview, CartDrawer, Checkout, PhotoCalibration, SharePreview, Toast, UnderTheHood } from './components/Overlays';

export default function App() {
  const s = useApp();
  const room = deriveRoom(s);
  const vibe = vibeById(s.vibe);
  const sel = s.selectedSlot;
  const ranked = sel && room.products[sel] ? rankedCandidates(sel, s) : [];
  const ids = ranked.map((c) => c.p.id);
  const quickSwap = sel && room.products[sel]
    ? {
        label: sel,
        index: Math.max(0, ids.indexOf(room.products[sel]!.id)),
        count: ids.length,
        onPrev: () => actions.step(sel, ids, -1),
        onNext: () => actions.step(sel, ids, 1),
        onMore: () => {
          actions.set({ pulse: s.pulse + 1 });
          setTimeout(() => (document.querySelector('#discover input') as HTMLInputElement | null)?.focus({ preventScroll: true }), 50);
        },
      }
    : undefined;
  return (
    <div className={`app vibe-${vibe.id}`}>
      <TopBar />
      <main className="layout">
        <LeftRail />
        <section className="center" aria-label="Your room">
          <VibeBar />
          <div className="stage">
            <RoomScene
              uid="main"
              vibe={vibe}
              products={room.products}
              positions={s.positions}
              receipts={room.receipts}
              selectedSlot={s.selectedSlot}
              showMeasurements={s.showMeasurements}
              unit={s.unit}
              doorWidth={s.doorWidth}
              interactive
              animateKey={s.roll}
              swapKey={s.swapKey}
              onSelect={(sl) => actions.selectSlot(sl)}
              onMove={(sl, x) => actions.move(sl, x)}
              quickSwap={quickSwap}
              className="room"
              title={`${vibe.name} studio with ${room.pieces} pieces from ${room.shops} shops`}
            />
            <div className="stage-badges">
              <span className="badge sample">Sample studio · a preview, not your apartment · drawn to scale</span>
            </div>
            <StageTools />
            <Toast />
          </div>
          <Discover />
        </section>
        <aside className="right-rail" aria-label="Fit and discovery">
          <div className="right-scroll">
            <FitReceipt />
          </div>
          <BudgetDock />
        </aside>
      </main>
      <button className="hood-pill" onClick={() => actions.set({ hoodOpen: !s.hoodOpen })} aria-expanded={s.hoodOpen}>
        &lt;/&gt; Under the hood <span>{s.events.length}</span>
      </button>
      <UnderTheHood />
      {s.panel === 'cart' && <CartDrawer />}
      {s.panel === 'checkout' && <Checkout />}
      {s.panel === 'ar' && <ARPreview />}
      {s.panel === 'share' && <SharePreview />}
      {s.panel === 'photo' && <PhotoCalibration />}
      {s.panel === 'place' && <PlacePanel />}
    </div>
  );
}
