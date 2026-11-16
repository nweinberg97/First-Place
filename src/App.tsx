import { actions, useApp } from './store';
import { deriveRoom } from './derive';
import { vibeById } from './data/vibes';
import { RoomScene } from './scene/RoomScene';
import { BudgetDock, LeftRail, TopBar, VibeBar, StageTools } from './components/Panels';
import { FitReceipt } from './components/FitReceipt';
import { Discover } from './components/Discover';
import { ARPreview, CartDrawer, Checkout, PhotoCalibration, SharePreview, Toast, UnderTheHood } from './components/Overlays';

export default function App() {
  const s = useApp();
  const room = deriveRoom(s);
  const vibe = vibeById(s.vibe);
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
              className="room"
              title={`${vibe.name} studio with ${room.pieces} pieces from ${room.shops} shops`}
            />
            <div className="stage-badges">
              <span className="badge">✏️ Illustrated to scale</span>
              <span className="badge">drag pieces · tap for the Fit Receipt</span>
            </div>
            <div className="stage-vibe">
              <b>{vibe.emoji} {vibe.name}</b>
              <span>{vibe.tagline}</span>
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
    </div>
  );
}
