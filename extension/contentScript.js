// Content script: executes mapped actions on the current page.
// For MVP, this script focuses on executing actions relayed from the popup/background.
// Optionally, it can be extended to run detection directly in-page.

(function () {
  // Inject overlay iframe for in-page detection if enabled
  const OVERLAY_ID = '__vibectrl_overlay__';
  const OVERLAY_STYLE_ID = '__vibectrl_overlay_style__';

  async function isOverlayEnabled() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get('vibe_overlay_enabled', (data) => {
          if (typeof data.vibe_overlay_enabled === 'boolean') return resolve(data.vibe_overlay_enabled);
          // default to true on first run
          resolve(true);
        });
      } catch (_) { resolve(true); }
    });
  }

  function injectStyle() {
    if (document.getElementById(OVERLAY_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = OVERLAY_STYLE_ID;
    style.textContent = `
      #${OVERLAY_ID} { position: fixed; right: 14px; bottom: 14px; width: 360px; height: 270px; z-index: 2147483647; pointer-events: none; }
      #${OVERLAY_ID} .vc-wrap { pointer-events: auto; box-shadow: 6px 6px 0 rgba(0,0,0,0.35); border: 4px solid #000; border-radius: 10px; background: #fff; overflow: hidden; }
      #${OVERLAY_ID} .vc-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; background: #f8f8f8; border-bottom: 4px solid #000; cursor: move; }
      #${OVERLAY_ID} .vc-iframe { width: 100%; height: calc(100% - 40px); border: 0; }
      #${OVERLAY_ID}.dragging { opacity: 0.9; }
      #${OVERLAY_ID} .vc-btn { border: 3px solid #000; background: #fff; padding: 4px 8px; border-radius: 8px; cursor: pointer; font-weight: 800; }
    `;
    document.documentElement.appendChild(style);
  }

  function createOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;
    injectStyle();
    const root = document.createElement('div');
    root.id = OVERLAY_ID;

    const wrap = document.createElement('div');
    wrap.className = 'vc-wrap';

    const header = document.createElement('div');
    header.className = 'vc-header';
    const title = document.createElement('div');
    title.textContent = 'VibeCTRL';
    const btns = document.createElement('div');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'vc-btn';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Hide overlay';
    closeBtn.onclick = () => removeOverlay();

    btns.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(btns);

    const iframe = document.createElement('iframe');
    const url = chrome.runtime.getURL('offscreen.html#/overlay?embed=1');
    iframe.src = url;
    iframe.className = 'vc-iframe';
    iframe.allow = 'camera; microphone;';

    wrap.appendChild(header);
    wrap.appendChild(iframe);
    root.appendChild(wrap);
    document.documentElement.appendChild(root);

    // Drag support
    let dragging = false; let sx=0; let sy=0; let rx=0; let ry=0;
    const onDown = (e) => { dragging = true; sx = e.clientX; sy = e.clientY; const r = root.getBoundingClientRect(); rx=r.right; ry=r.bottom; root.classList.add('dragging'); };
    const onMove = (e) => { if (!dragging) return; const dx = e.clientX - sx; const dy = e.clientY - sy; root.style.right = (window.innerWidth - rx - dx) + 'px'; root.style.bottom = (window.innerHeight - ry - dy) + 'px'; };
    const onUp = () => { dragging = false; root.classList.remove('dragging'); };
    header.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function removeOverlay() {
    const el = document.getElementById(OVERLAY_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // Respond to background toggle
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'VIBE_INJECT_OVERLAY') createOverlay();
    if (msg.type === 'VIBE_REMOVE_OVERLAY') removeOverlay();
  });

  // Auto-inject if enabled
  isOverlayEnabled().then((on) => { if (on) createOverlay(); });

  // Small helpers
  const coalesceNumber = (...values) => {
    for (const v of values) if (typeof v === 'number' && !Number.isNaN(v)) return v;
    return undefined;
  };

  const getHoveredElement = () => {
    try {
      const hovered = document.querySelectorAll(':hover');
      if (hovered && hovered.length) return hovered[hovered.length - 1];
    } catch (_) {}
    return null;
  };

  const isScrollable = (el) => {
    if (!el || el === document || el === window) return false;
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScroll = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay');
    return canScroll && el.scrollHeight > el.clientHeight;
  };

  const findScrollableAncestor = (el) => {
    let node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      if (isScrollable(node)) return node;
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement || document.body;
  };

  const scrollElementBy = (target, deltaY) => {
    if (!target) return;
    if (target === document.body || target === document.documentElement || target === document.scrollingElement) {
      window.scrollBy(0, deltaY);
    } else if (typeof target.scrollBy === 'function') {
      target.scrollBy(0, deltaY);
    } else {
      target.scrollTop += deltaY;
    }
  };

  const animateScroll = (target, totalDelta, durationMs = 200) => {
    return new Promise((resolve) => {
      const start = performance.now();
      const initialScrollTop = target && target.scrollTop;
      const step = (t) => {
        const elapsed = t - start;
        const progress = Math.min(1, durationMs > 0 ? elapsed / durationMs : 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentDelta = totalDelta * easeOut;
        const alreadyScrolled = (initialScrollTop != null) ? (target.scrollTop - initialScrollTop) : 0;
        const toScrollNow = currentDelta - alreadyScrolled;
        scrollElementBy(target, toScrollNow);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          resolve(true);
        }
      };
      window.requestAnimationFrame(step);
    });
  };

  const executeScroll = async (direction, pixels) => {
    const delta = direction === 'up' ? -Math.abs(pixels) : Math.abs(pixels);
    const hovered = getHoveredElement();
    const active = document.activeElement;
    const firstCandidate = hovered || active;
    const target = findScrollableAncestor(firstCandidate);
    try {
      await animateScroll(target, delta);
      return true;
    } catch {
      scrollElementBy(target, delta);
      return true;
    }
  };

  const executeVideoToggle = () => {
    try {
      // Try page media elements
      const mediaElements = document.querySelectorAll('video, audio');
      if (!mediaElements || mediaElements.length === 0) return false;
      let anyPlaying = false;
      mediaElements.forEach(m => { if (!m.paused) anyPlaying = true; });
      mediaElements.forEach(m => {
        if (anyPlaying) m.pause(); else m.play().catch(() => {});
      });
      return true;
    } catch { return false; }
  };

  const executeVolumeControl = (direction, amount) => {
    try {
      const mediaElements = document.querySelectorAll('video, audio');
      if (!mediaElements || mediaElements.length === 0) return false;
      const change = direction === 'up' ? amount : -amount;
      let newVolume = 0;
      mediaElements.forEach(m => {
        const current = m.volume;
        newVolume = Math.max(0, Math.min(1, current + change));
        m.volume = newVolume;
      });
      return true;
    } catch { return false; }
  };

  const executeKeyPress = (key) => {
    try {
      const event = new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true });
      (document.activeElement || document).dispatchEvent(event);
      return true;
    } catch { return false; }
  };

  const ACTIONS = {
    scroll_down: (params) => executeScroll('down', coalesceNumber(params.distance, params.pixels, 300) ?? 300),
    scroll_up:   (params) => executeScroll('up',   coalesceNumber(params.distance, params.pixels, 300) ?? 300),
    toggle_video: () => executeVideoToggle(),
    volume_up: (p) => executeVolumeControl('up', p?.amount ?? 0.1),
    volume_down: (p) => executeVolumeControl('down', p?.amount ?? 0.1),
    key_press: (p) => executeKeyPress(p?.key || 'ArrowRight'),
    click_selector: (p) => {
      try {
        const el = document.querySelector(p?.selector || 'button');
        if (!el) return false;
        if (el.disabled) return false;
        el.click();
        return true;
      } catch { return false; }
    },
    swipe_left: (p) => executeKeyPress(p?.key || 'ArrowLeft'),
    swipe_right: (p) => executeKeyPress(p?.key || 'ArrowRight'),
    noop: () => true
  };

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'VIBE_EXECUTE') {
      const { action, params } = msg;
      const fn = ACTIONS[action];
      const ok = typeof fn === 'function' ? !!fn(params || {}) : false;
      sendResponse({ ok });
      return true;
    }
  });
})();
