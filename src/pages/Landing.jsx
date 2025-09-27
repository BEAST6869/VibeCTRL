import React, { useEffect, useRef, useState } from 'react';
import BrutalHeader from '../ui/brutal/BrutalHeader';
import BrutalCard from '../ui/brutal/BrutalCard';
import Icon from '../ui/icons/Icon';
import GestureController from '../components/GestureController';
import { INFERENCE_CONFIG } from '../constants';
import VideoPlayerLanding from '../components/VideoPlayerLanding';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const Landing = () => {
  const videoRef = useRef(null);
  const [volume, setVolume] = useState(0.6);
  const [playError, setPlayError] = useState(null);
  
  // Real-time gesture UI state with throttled updates
  const rawGestureRef = useRef({ label: null, confidence: 0 });
  const [uiGesture, setUiGesture] = useState({ label: '', confidence: 0 });
  const statusCallbackRef = useRef(null);
  
  // Video is now YouTube-based; landingMediaActions are provided by VideoPlayerLanding
  useEffect(() => () => { try { delete window.landingMediaActions; } catch {} }, []);
  
  // Stable callback reference for gesture detection
  const handleGestureUpdate = (info) => {
    if (!info) {
      rawGestureRef.current = { label: null, confidence: 0 };
      return;
    }
    const minConf = INFERENCE_CONFIG?.CONFIDENCE_THRESHOLD || 0.6;
    const label = info.label || '';
    const conf = Math.max(0, Math.min(1, info.confidence || 0));
    
    // Update raw reference for high-frequency updates
    rawGestureRef.current = { label, confidence: conf };
    
    // Continuous volume change while thumbs up/down held with confidence
    if (!window.landingContinuous) window.landingContinuous = { timer: null, lastLabel: null };
    const state = window.landingContinuous;
    const stopTimer = () => { if (state.timer) { clearInterval(state.timer); state.timer = null; } };
    if (conf >= minConf && (label === 'thumbs_up' || label === 'thumbs_down')) {
      if (state.lastLabel !== label || !state.timer) {
        stopTimer();
        state.lastLabel = label;
        state.timer = setInterval(() => {
          if (label === 'thumbs_up') {
            window.landingMediaActions?.volumeUp?.();
          } else if (label === 'thumbs_down') {
            window.landingMediaActions?.volumeDown?.();
          }
        }, 120);
      }
    } else {
      state.lastLabel = null;
      stopTimer();
    }
    
    // Legacy support for window.landingStatus
    window.landingStatus = { label, confidence: conf };
  };
  
  // Keep callback reference stable
  useEffect(() => {
    statusCallbackRef.current = handleGestureUpdate;
  }, []);
  
  // Throttled UI updater (target 30 FPS for smooth updates)
  useEffect(() => {
    let rafId;
    const updateUI = () => {
      const { label, confidence } = rawGestureRef.current;
      setUiGesture(prev => {
        // Only update if there's a meaningful change
        if (prev.label === label && Math.abs(prev.confidence - confidence) < 0.01) {
          return prev;
        }
        return { label: label || '', confidence };
      });
      rafId = requestAnimationFrame(updateUI);
    };
    rafId = requestAnimationFrame(updateUI);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'grid', gap: 16 }}>
      <BrutalHeader title="VibeCTRL" subtitle="Gesture-based Browser Controller" />

      <div className="landing-split">
        <BrutalCard offset="down" className="asym-1">
<VideoPlayerLanding videoId="dQw4w9WgXcQ" playlistId="RDdQw4w9WgXcQ" />
        </BrutalCard>

        <BrutalCard offset="left">
          <div className="landing-camera responsive-video">
            <GestureController mode="pip" showOverlays={false}
              onStatusChange={(info) => {
                // Use stable callback reference to prevent stale closures
                if (statusCallbackRef.current) {
                  statusCallbackRef.current(info);
                }
              }}
            />
          </div>
          {/* Status below camera with real-time React state updates */}
          <div className="landing-status" style={{ marginTop: 10 }}>
            <strong>Gesture:</strong> 
            <span 
              id="landing-gesture"
              role="status" 
              aria-live="polite"
              aria-label="Current gesture detected"
            >
              {uiGesture.label || '—'}
            </span>
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, color: '#444' }}>Confidence</div>
              <div style={{ 
                height: 10, 
                border: '4px solid #000', 
                borderRadius: 6, 
                background: '#eee', 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div 
                  id="landing-conf-fill" 
                  style={{ 
                    height: '100%', 
                    width: `${Math.round(uiGesture.confidence * 100)}%`, 
                    background: '#10b981',
                    transition: 'width 150ms linear',
                    '--score': uiGesture.confidence
                  }} 
                  aria-label={`Confidence: ${Math.round(uiGesture.confidence * 100)}%`}
                  role="progressbar"
                  aria-valuenow={Math.round(uiGesture.confidence * 100)}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          </div>
        </BrutalCard>
      </div>
    </div>
  );
};

export default Landing;
