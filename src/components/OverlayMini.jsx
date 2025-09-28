import React, { useEffect, useRef, useState } from 'react';
import GestureController from './GestureController';

export default function OverlayMini() {
  const rawGestureRef = useRef({ label: '', confidence: 0 });
  const [uiGesture, setUiGesture] = useState({ label: '', confidence: 0 });

  // RAF updater for smooth UI
  useEffect(() => {
    let raf;
    const tick = () => {
      const g = rawGestureRef.current;
      setUiGesture(prev => {
        if (prev.label === g.label && Math.abs(prev.confidence - g.confidence) < 0.01) return prev;
        return { label: g.label || '', confidence: g.confidence || 0 };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateRows: '1fr auto', gap: 6 }}>
      <div style={{ position: 'relative', border: '4px solid #000', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
        {/* Minimal camera with overlays off; status is shown below */}
        <GestureController
          mode="pip"
          showOverlays={false}
          onStatusChange={(info) => {
            if (!info) { rawGestureRef.current = { label: '', confidence: 0 }; return; }
            rawGestureRef.current = { label: info.label || '', confidence: Math.max(0, Math.min(1, info.confidence || 0)) };
          }}
        />
      </div>
      <div style={{ display: 'grid', gap: 6 }} aria-live="polite" role="status" aria-label="Gesture status">
        <div style={{ fontWeight: 800, fontSize: 14 }}>{uiGesture.label || '—'}</div>
        <div style={{ height: 10, border: '4px solid #000', borderRadius: 6, background: '#eee', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.round(uiGesture.confidence * 100)}%`, background: '#10b981', transition: 'width 120ms linear' }} />
        </div>
      </div>
    </div>
  );
}