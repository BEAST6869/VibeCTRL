// Enhanced content script: executes mapped actions on the current page
// with gesture detection integration and site-specific adapters

(function () {
  // Global gesture mappings and adapters
  let globalMappings = {};
  let currentAdapter = null;
  let isYouTube = false;
  let pageVideo = null;
  let gestureDetectionActive = false;

  // Check if overlay is enabled
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

  // Inject page-context overlay
  async function injectPageOverlay() {
    try {
      console.log('🎬 VibeCTRL: Injecting page-context overlay');
      
      // Request background script to inject the page-context camera system
      const response = await chrome.runtime.sendMessage({
        type: 'VIBE_INJECT_PAGE_OVERLAY',
        tabId: null // Will use current tab
      });
      
      if (response && response.ok) {
        console.log('✅ VibeCTRL: Page overlay injected successfully');
      } else {
        console.error('❌ VibeCTRL: Failed to inject page overlay:', response?.error);
      }
    } catch (error) {
      console.error('❌ VibeCTRL: Error injecting page overlay:', error);
    }
  }

  // Remove page overlay
  function removePageOverlay() {
    try {
      // Dispatch close event to page context
      window.dispatchEvent(new Event('VIBECTRL_CLOSE_OVERLAY'));
      console.log('🎬 VibeCTRL: Page overlay removed');
    } catch (error) {
      console.error('❌ VibeCTRL: Error removing page overlay:', error);
    }
  }

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

  // Global gesture mappings and adapters
  let globalMappings = {};
  let currentAdapter = null;
  let isYouTube = false;

  // Initialize adapters based on current site
  async function initializeAdapter() {
    try {
      const hostname = window.location.hostname.toLowerCase();
      isYouTube = hostname.includes('youtube.com') || hostname.includes('youtu.be');
      
      if (isYouTube) {
        // Load YouTube adapter
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('adapters/youtube.js');
        script.onload = async () => {
          if (window.YouTubeAdapter) {
            currentAdapter = new window.YouTubeAdapter();
            await currentAdapter.init();
            console.log('🎬 YouTube adapter loaded');
          }
        };
        document.head.appendChild(script);
      } else {
        // Load generic adapter
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('adapters/generic.js');
        script.onload = async () => {
          if (window.GenericAdapter) {
            currentAdapter = new window.GenericAdapter();
            await currentAdapter.init();
            console.log('🎬 Generic adapter loaded');
          }
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize adapter:', error);
    }
  }

  // Load global gesture mappings
  async function loadGlobalMappings() {
    try {
      const result = await chrome.storage.sync.get(['gesture_mappings']);
      if (result.gesture_mappings) {
        globalMappings = result.gesture_mappings;
        console.log('🌐 Global gesture mappings loaded');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load global mappings:', error);
    }
  }

  // Execute action using site-specific adapter
  async function executeAction(actionName, params = {}) {
    try {
      // Try site-specific adapter first
      if (currentAdapter && typeof currentAdapter.executeAction === 'function') {
        const result = await currentAdapter.executeAction(actionName, params);
        if (result) return true;
      }

      // Fallback to generic actions
      const fn = ACTIONS[actionName];
      if (typeof fn === 'function') {
        return await fn(params || {});
      }

      return false;
    } catch (error) {
      console.warn('⚠️ Action execution failed:', error);
      return false;
    }
  }

  // Handle gesture detection with mapping execution
  function handleGestureDetected(gesture, confidence) {
    try {
      if (!globalMappings || !globalMappings[gesture]) {
        return;
      }

      const mapping = globalMappings[gesture];
      const confidenceThreshold = 0.6; // Match the improved threshold
      
      if (confidence >= confidenceThreshold) {
        console.log(`🎯 Executing ${gesture} -> ${mapping.action} (${(confidence * 100).toFixed(1)}%)`);
        executeAction(mapping.action, mapping.params || {});
      }
    } catch (error) {
      console.warn('⚠️ Gesture handling failed:', error);
    }
  }

  // Listen for page-context messages
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    const data = event.data;
    if (data?.source === 'VIBECTRL_OVERLAY') {
      if (data.status === 'bootstrapped') {
        console.log('✅ VibeCTRL: Page overlay bootstrapped');
      } else if (data.status === 'closed') {
        console.log('🎬 VibeCTRL: Page overlay closed');
        gestureDetectionActive = false;
      }
    }
    
    if (data?.source === 'VIBECTRL_CAMERA') {
      if (data.status === 'ready') {
        console.log('✅ VibeCTRL: Camera ready, starting gesture detection');
        pageVideo = document.getElementById('vibectrl_page_video');
        if (pageVideo) {
          startGestureDetection();
        }
      } else if (data.status === 'stopped') {
        console.log('🎬 VibeCTRL: Camera stopped');
        gestureDetectionActive = false;
      } else if (data.status === 'error') {
        console.error('❌ VibeCTRL: Camera error:', data.message);
        gestureDetectionActive = false;
      }
    }
  });

  // Start gesture detection using page video
  async function startGestureDetection() {
    if (!pageVideo || gestureDetectionActive) return;
    
    try {
      gestureDetectionActive = true;
      console.log('🎯 VibeCTRL: Starting gesture detection on page video');
      
      // Load TensorFlow.js and handpose model
      await loadGestureModel();
      
      // Start detection loop
      runDetectionLoop();
      
    } catch (error) {
      console.error('❌ VibeCTRL: Failed to start gesture detection:', error);
      gestureDetectionActive = false;
    }
  }

  // Load gesture detection model
  async function loadGestureModel() {
    try {
      // Load TensorFlow.js
      if (!window.tf) {
        const tfScript = document.createElement('script');
        tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js';
        await new Promise((resolve, reject) => {
          tfScript.onload = resolve;
          tfScript.onerror = reject;
          document.head.appendChild(tfScript);
        });
      }
      
      // Load handpose model
      if (!window.handpose) {
        const handposeScript = document.createElement('script');
        handposeScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose@latest/dist/handpose.min.js';
        await new Promise((resolve, reject) => {
          handposeScript.onload = resolve;
          handposeScript.onerror = reject;
          document.head.appendChild(handposeScript);
        });
      }
      
      // Initialize handpose model
      if (window.handpose && !window.handposeModel) {
        window.handposeModel = await handpose.load();
        console.log('✅ VibeCTRL: Handpose model loaded');
      }
      
    } catch (error) {
      console.error('❌ VibeCTRL: Failed to load gesture model:', error);
      throw error;
    }
  }

  // Run gesture detection loop
  async function runDetectionLoop() {
    if (!gestureDetectionActive || !pageVideo || !window.handposeModel) return;
    
    try {
      // Get hand predictions
      const hands = await window.handposeModel.estimateHands(pageVideo, false);
      
      if (hands.length > 0) {
        // Process gesture detection
        const landmarks = hands[0].landmarks;
        if (landmarks && landmarks.length >= 21) {
          // Simple gesture classification based on hand landmarks
          const gesture = classifyGesture(landmarks);
          if (gesture) {
            console.log(`🎯 VibeCTRL: Detected gesture: ${gesture}`);
            handleGestureDetected(gesture, 0.8); // Fixed confidence for now
          }
        }
      }
      
      // Update gesture status in overlay
      updateGestureStatus(hands.length > 0 ? 'Hand detected' : 'No hand detected');
      
    } catch (error) {
      console.error('❌ VibeCTRL: Detection loop error:', error);
    }
    
    // Continue loop
    if (gestureDetectionActive) {
      requestAnimationFrame(runDetectionLoop);
    }
  }

  // Simple gesture classification
  function classifyGesture(landmarks) {
    // This is a simplified gesture classifier
    // In a real implementation, you'd use a trained model
    
    const thumb = landmarks[4];
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
    
    // Check if fingers are extended
    const thumbExtended = thumb[1] < landmarks[3][1];
    const indexExtended = index[1] < landmarks[6][1];
    const middleExtended = middle[1] < landmarks[10][1];
    const ringExtended = ring[1] < landmarks[14][1];
    const pinkyExtended = pinky[1] < landmarks[18][1];
    
    const extendedFingers = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended];
    const extendedCount = extendedFingers.filter(Boolean).length;
    
    // Simple gesture classification
    if (extendedCount === 0) {
      return 'fist';
    } else if (extendedCount === 5) {
      return 'open_hand';
    } else if (extendedCount === 2 && indexExtended && middleExtended) {
      return 'peace';
    } else if (extendedCount === 1 && thumbExtended) {
      return 'thumbs_up';
    }
    
    return null;
  }

  // Update gesture status in overlay
  function updateGestureStatus(status) {
    try {
      const statusDiv = document.getElementById('vibectrl-gesture-status');
      if (statusDiv) {
        statusDiv.textContent = status;
      }
    } catch (error) {
      // Ignore errors updating status
    }
  }

  // Initialize on page load
  async function initialize() {
    await loadGlobalMappings();
    await initializeAdapter();
  }

  // Listen for mapping updates
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.gesture_mappings) {
      globalMappings = changes.gesture_mappings.newValue || {};
      console.log('🔄 Gesture mappings updated');
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg !== 'object') return;
    
    if (msg.type === 'VIBE_EXECUTE') {
      const { action, params } = msg;
      executeAction(action, params || {}).then(ok => {
        sendResponse({ ok });
      });
      return true;
    }
    
    if (msg.type === 'VIBE_GESTURE_DETECTED') {
      const { gesture, confidence } = msg;
      handleGestureDetected(gesture, confidence);
      sendResponse({ ok: true });
      return true;
    }
    
    if (msg.type === 'VIBE_INJECT_OVERLAY') {
      injectPageOverlay();
      sendResponse({ ok: true });
      return true;
    }
    
    if (msg.type === 'VIBE_REMOVE_OVERLAY') {
      removePageOverlay();
      sendResponse({ ok: true });
      return true;
    }
  });

  // Initialize on page load
  initialize();
})();
