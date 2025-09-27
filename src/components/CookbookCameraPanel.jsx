import React, { useEffect, useRef, useState } from 'react';
import GestureController from './GestureController';

// CookbookCameraPanel: right-side panel hosting the live camera with gesture status and controls
// - defers heavy ML load until user enables detection
// - shows live-updating label + confidence below camera (independent of action cooldown)
// - exposes minimal controls: Enable Detection, Hide/Show overlays toggle (optional later), Minimize
export default function CookbookCameraPanel({
  initiallyActive = false,
}) {
  const [active, setActive] = useState(() => {
    try {
      const saved = localStorage.getItem('cookbook_camera_active');
      return saved ? saved === '1' : initiallyActive;
    } catch { return initiallyActive; }
  });
  const [minimized, setMinimized] = useState(false);
  const [showOverlays, setShowOverlays] = useState(false);

  // Raw gesture info updated by high-frequency onStatusChange
  const rawGestureRef = useRef({ label: '', confidence: 0 });
  const [uiGesture, setUiGesture] = useState({ label: '', confidence: 0 });

  useEffect(() => {
    try { localStorage.setItem('cookbook_camera_active', active ? '1' : '0'); } catch {}
  }, [active]);

  // Throttled UI state updates via RAF to avoid "stuck label" issues
  useEffect(() => {
    let rafId;
    const update = () => {
      const g = rawGestureRef.current;
      setUiGesture(prev => {
        if (prev.label === g.label && Math.abs(prev.confidence - g.confidence) < 0.01) return prev;
        return { label: g.label || '', confidence: g.confidence || 0 };
      });
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="cookbook-camera-panel" aria-label="Cookbook camera panel" role="region">
      <div className="camera-panel-controls">
        <button
          className={`ctrl-btn ${active ? 'active' : ''}`}
          aria-pressed={active}
          onClick={() => setActive(a => !a)}
        >
          {active ? '⏹ Disable Detection' : '🚀 Enable Detection'}
        </button>
        <button
          className="ctrl-btn"
          onClick={() => setShowOverlays(v => !v)}
          aria-pressed={showOverlays}
          aria-label="Toggle camera overlays"
        >
          {showOverlays ? '👁️ Overlays: On' : '🚫 Overlays: Off'}
        </button>
        <button
          className="ctrl-btn"
          onClick={() => setMinimized(m => !m)}
          aria-label={minimized ? 'Show camera' : 'Minimize camera'}
        >
          {minimized ? '◻ Show' : '▁ Minimize'}
        </button>
      </div>

      {!minimized && (
        <div className="camera-panel-body">
          <div className="camera-aspect">
            {active ? (
              <GestureController
                mode="pip"
                showOverlays={showOverlays}
                onStatusChange={(info) => {
                  if (!info) {
                    rawGestureRef.current = { label: '', confidence: 0 };
                    return;
                  }
                  const label = info.label || '';
                  const conf = Math.max(0, Math.min(1, info.confidence || 0));
                  rawGestureRef.current = { label, confidence: conf };
                }}
              />
            ) : (
              <div className="camera-placeholder" role="status" aria-live="polite">
                Camera detection is disabled. Click "Enable Detection" to start.
              </div>
            )}
          </div>

          {/* Gesture Status */}
          <div className="gesture-status" role="status" aria-live="polite" aria-label="Gesture status">
            <div className="gesture-line">
              <span className="gesture-label">{uiGesture.label || '—'}</span>
            </div>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: `${Math.round(uiGesture.confidence * 100)}%` }}
                role="progressbar"
                aria-valuenow={Math.round(uiGesture.confidence * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Confidence ${Math.round(uiGesture.confidence * 100)}%`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
