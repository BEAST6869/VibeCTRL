// Content script: executes mapped actions on the current page.
// For MVP, this script focuses on executing actions relayed from the popup/background.
// Optionally, it can be extended to run detection directly in-page.

(function () {
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
