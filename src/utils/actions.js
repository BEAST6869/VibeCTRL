/**
 * Browser action execution utilities for gesture mapping
 */

// Default action configurations
export const ACTION_TYPES = {
  SCROLL_DOWN: 'scroll_down',
  SCROLL_UP: 'scroll_up',
  TOGGLE_VIDEO: 'toggle_video',
  VOLUME_UP: 'volume_up',
  VOLUME_DOWN: 'volume_down',
  TAB_NEXT: 'tab_next',
  TAB_PREV: 'tab_prev',
  KEY_PRESS: 'key_press',
  CLICK_SELECTOR: 'click_selector',
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
  NOOP: 'noop'
};

export const DEFAULT_ACTION_PARAMS = {
  [ACTION_TYPES.SCROLL_DOWN]: { pixels: 300, distance: 300 },
  [ACTION_TYPES.SCROLL_UP]: { pixels: 300, distance: 300 },
  [ACTION_TYPES.TOGGLE_VIDEO]: {},
  [ACTION_TYPES.VOLUME_UP]: { amount: 0.1 },
  [ACTION_TYPES.VOLUME_DOWN]: { amount: 0.1 },
  [ACTION_TYPES.TAB_NEXT]: {},
  [ACTION_TYPES.TAB_PREV]: {},
  [ACTION_TYPES.KEY_PRESS]: { key: 'ArrowRight' },
  [ACTION_TYPES.CLICK_SELECTOR]: { selector: 'button' },
  [ACTION_TYPES.SWIPE_LEFT]: { key: 'ArrowLeft' },
  [ACTION_TYPES.SWIPE_RIGHT]: { key: 'ArrowRight' },
  [ACTION_TYPES.NOOP]: {}
};

export const ACTION_DESCRIPTIONS = {
  [ACTION_TYPES.SCROLL_DOWN]: 'Scroll page down',
  [ACTION_TYPES.SCROLL_UP]: 'Scroll page up',
  [ACTION_TYPES.TOGGLE_VIDEO]: 'Toggle video play/pause',
  [ACTION_TYPES.VOLUME_UP]: 'Increase volume',
  [ACTION_TYPES.VOLUME_DOWN]: 'Decrease volume',
  [ACTION_TYPES.TAB_NEXT]: 'Switch to next tab',
  [ACTION_TYPES.TAB_PREV]: 'Switch to previous tab',
  [ACTION_TYPES.KEY_PRESS]: 'Send keyboard key',
  [ACTION_TYPES.CLICK_SELECTOR]: 'Click element by selector',
  [ACTION_TYPES.SWIPE_LEFT]: 'Swipe left (motion-based)',
  [ACTION_TYPES.SWIPE_RIGHT]: 'Swipe right (motion-based)',
  [ACTION_TYPES.NOOP]: 'No action'
};

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type ('success', 'error', 'info')
 */
const showToast = (message, type = 'info') => {
  try {
    const toast = document.createElement('div');
    toast.className = `gesture-toast toast-${type}`;
    toast.textContent = message;
  
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '6px',
      color: 'white',
      fontWeight: '500',
      fontSize: '14px',
      zIndex: '10000',
      maxWidth: '300px',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s ease',
      backgroundColor: type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'
    });
  
    document.body.appendChild(toast);
  
    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);
  
    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  } catch (err) {
    // In very restrictive environments, DOM APIs might fail; just log
    console.warn('Toast display failed:', err);
  }
};

/** Utility: coalesce numeric params (first valid number wins) */
const coalesceNumber = (...values) => {
  for (const v of values) {
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
  }
  return undefined;
};

/** Utility: get the deepest hovered element (if supported) */
const getHoveredElement = () => {
  try {
    const hovered = document.querySelectorAll(':hover');
    if (hovered && hovered.length) return hovered[hovered.length - 1];
  } catch (_) {
    // :hover may not be queryable in some contexts
  }
  return null;
};

/** Utility: determine if an element can scroll vertically */
const isScrollable = (el) => {
  if (!el || el === document || el === window) return false;
  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  const canScroll = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay');
  return canScroll && el.scrollHeight > el.clientHeight;
};

/** Utility: find nearest scrollable ancestor for an element */
const findScrollableAncestor = (el) => {
  let node = el;
  while (node && node !== document.body && node !== document.documentElement) {
    if (isScrollable(node)) return node;
    node = node.parentElement;
  }
  // fall back to document scrolling element
  return document.scrollingElement || document.documentElement || document.body;
};

/** Scroll a target element by deltaY in a single step */
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

/** Animate scroll in small non-blocking steps via requestAnimationFrame */
const animateScroll = (target, totalDelta, durationMs = 200) => {
  return new Promise((resolve) => {
    const start = performance.now();
    const initialScrollTop = target && target.scrollTop;
    const step = (t) => {
      const elapsed = t - start;
      const progress = Math.min(1, durationMs > 0 ? elapsed / durationMs : 1);
      // ease-out cubic for smoothness
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

/**
 * Execute scroll action (non-blocking, container-aware)
 * @param {string} direction - 'up' or 'down'
 * @param {number} pixels - Number of pixels to scroll
 */
const executeScroll = (direction, pixels) => {
  try {
    const delta = direction === 'up' ? -Math.abs(pixels) : Math.abs(pixels);

    // Pick best target: hovered element's scrollable ancestor, then activeElement, fallback to page
    const hovered = getHoveredElement();
    const active = document.activeElement;
    const firstCandidate = hovered || active;
    const target = findScrollableAncestor(firstCandidate);

    // Run animation asynchronously without blocking UI thread
    setTimeout(() => {
      animateScroll(target, delta).then(() => {
        console.log(`📜 Scrolled ${direction} by ${Math.abs(pixels)}px on`, target === document.scrollingElement ? 'page' : target);
      }).catch(err => {
        console.warn('⚠️ Scroll animation error, falling back:', err);
        // Fallback single-step scroll
        scrollElementBy(target, delta);
      });
    }, 0);

    return true;
  } catch (error) {
    console.error('❌ Scroll action failed:', error);
    showToast('Failed to scroll page', 'error');
    return false;
  }
};

/**
 * Execute video toggle action
 */
const executeVideoToggle = () => {
  try {
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    const mediaElements = [...videos, ...audios];
    
    if (mediaElements.length === 0) {
      console.warn('⚠️ No media elements found on page');
      showToast('No media element found on page', 'error');
      return false;
    }
    
    // Toggle all media elements
    let anyPlaying = false;
    mediaElements.forEach(media => {
      if (!media.paused) {
        anyPlaying = true;
      }
    });
    
    mediaElements.forEach(media => {
      if (anyPlaying) {
        media.pause();
      } else {
        media.play().catch(err => {
          console.warn('⚠️ Failed to play media:', err);
        });
      }
    });
    
    const action = anyPlaying ? 'paused' : 'playing';
    console.log(`🎬 All media ${action}`);
    showToast(`Media ${action}`, 'success');
    
    return true;
  } catch (error) {
    console.error('❌ Video toggle failed:', error);
    showToast('Failed to toggle media', 'error');
    return false;
  }
};

/**
 * Execute volume control action
 * @param {string} direction - 'up' or 'down'
 * @param {number} amount - Volume change amount (0-1)
 */
const executeVolumeControl = (direction, amount) => {
  try {
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    const mediaElements = [...videos, ...audios];
    
    if (mediaElements.length === 0) {
      console.warn('⚠️ No media elements found on page');
      showToast('No media element found on page', 'error');
      return false;
    }
    
    const change = direction === 'up' ? amount : -amount;
    let newVolume = 0;
    
    mediaElements.forEach(media => {
      const currentVolume = media.volume;
      newVolume = Math.max(0, Math.min(1, currentVolume + change));
      media.volume = newVolume;
    });
    
    const volumePercent = Math.round(newVolume * 100);
    console.log(`🔊 Volume ${direction}: ${volumePercent}%`);
    showToast(`Volume: ${volumePercent}%`, 'success');
    
    return true;
  } catch (error) {
    console.error('❌ Volume control failed:', error);
    showToast('Failed to control volume', 'error');
    return false;
  }
};

/**
 * Execute tab switching action
 * @param {string} direction - 'next' or 'prev'
 */
const executeTabSwitch = (direction) => {
  try {
    // Note: Due to browser security restrictions, we cannot directly control browser tabs
    // Instead, we'll use keyboard shortcuts that browsers recognize
    const key = direction === 'next' ? 'Tab' : 'Tab';
    const modifiers = direction === 'next' ? ['ctrlKey'] : ['ctrlKey', 'shiftKey'];
    
    // Create and dispatch keyboard event
    const event = new KeyboardEvent('keydown', {
      key: key,
      code: key,
      ctrlKey: modifiers.includes('ctrlKey'),
      shiftKey: modifiers.includes('shiftKey'),
      bubbles: true,
      cancelable: true
    });
    
    // Dispatch to document
    document.dispatchEvent(event);
    
    console.log(`🔄 Tab switch: ${direction}`);
    showToast(`Switching to ${direction} tab`, 'success');
    
    return true;
  } catch (error) {
    console.error('❌ Tab switch failed:', error);
    showToast('Failed to switch tabs', 'error');
    return false;
  }
};

/**
 * Execute keyboard key press
 * @param {string} key - Key to press (e.g., 'ArrowRight', 'Space', 'Enter')
 */
const executeKeyPress = (key) => {
  try {
    // Validate key
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key parameter');
    }
    
    // Create and dispatch keyboard event
    const event = new KeyboardEvent('keydown', {
      key: key,
      code: key,
      bubbles: true,
      cancelable: true
    });
    
    // Dispatch to focused element or document
    const target = document.activeElement || document;
    target.dispatchEvent(event);
    
    console.log(`⌨️ Key pressed: ${key}`);
    showToast(`Key pressed: ${key}`, 'success');
    return true;
  } catch (error) {
    console.error('❌ Key press failed:', error);
    showToast(`Failed to press key: ${error.message}`, 'error');
    return false;
  }
};

/**
 * Execute click on element by CSS selector
 * @param {string} selector - CSS selector to find element
 */
const executeClickSelector = (selector) => {
  try {
    // Validate selector
    if (!selector || typeof selector !== 'string') {
      throw new Error('Invalid selector parameter');
    }
    
    // Find element
    const element = document.querySelector(selector);
    
    if (!element) {
      throw new Error(`No element found with selector: ${selector}`);
    }
    
    // Check if element is clickable
    if (element.disabled) {
      throw new Error('Element is disabled and cannot be clicked');
    }
    
    // Click the element
    element.click();
    
    console.log(`🖱️ Clicked element: ${selector}`);
    showToast(`Clicked: ${selector}`, 'success');
    return true;
  } catch (error) {
    console.error('❌ Click selector failed:', error);
    showToast(`Click failed: ${error.message}`, 'error');
    return false;
  }
};

/**
 * Main action execution function
 * @param {Object} mapping - Action mapping configuration
 * @param {string} mapping.action - Action type
 * @param {Object} mapping.params - Action parameters
 */
export const executeMappedAction = (mapping) => {
  if (!mapping || !mapping.action) {
    console.warn('⚠️ Invalid mapping provided to executeMappedAction');
    return false;
  }
  
  const { action, params = {} } = mapping;
  
  console.log(`🎬 Executing action: ${action}`, params);
  
  try {
    switch (action) {
      case ACTION_TYPES.SCROLL_DOWN: {
        const defaultDist = DEFAULT_ACTION_PARAMS[ACTION_TYPES.SCROLL_DOWN].distance || DEFAULT_ACTION_PARAMS[ACTION_TYPES.SCROLL_DOWN].pixels || 100;
        const dist = coalesceNumber(params.distance, params.pixels, defaultDist) ?? 100;
        return executeScroll('down', dist);
      }
      case ACTION_TYPES.SCROLL_UP: {
        const defaultDist = DEFAULT_ACTION_PARAMS[ACTION_TYPES.SCROLL_UP].distance || DEFAULT_ACTION_PARAMS[ACTION_TYPES.SCROLL_UP].pixels || 100;
        const dist = coalesceNumber(params.distance, params.pixels, defaultDist) ?? 100;
        return executeScroll('up', dist);
      }
      case ACTION_TYPES.TOGGLE_VIDEO:
        return executeVideoToggle();
        
      case ACTION_TYPES.VOLUME_UP:
        return executeVolumeControl('up', params.amount || DEFAULT_ACTION_PARAMS[ACTION_TYPES.VOLUME_UP].amount);
        
      case ACTION_TYPES.VOLUME_DOWN:
        return executeVolumeControl('down', params.amount || DEFAULT_ACTION_PARAMS[ACTION_TYPES.VOLUME_DOWN].amount);
        
      case ACTION_TYPES.TAB_NEXT:
        return executeTabSwitch('next');
        
      case ACTION_TYPES.TAB_PREV:
        return executeTabSwitch('prev');
        
      case ACTION_TYPES.KEY_PRESS:
        return executeKeyPress(params.key || DEFAULT_ACTION_PARAMS[ACTION_TYPES.KEY_PRESS].key);
        
      case ACTION_TYPES.CLICK_SELECTOR:
        return executeClickSelector(params.selector || DEFAULT_ACTION_PARAMS[ACTION_TYPES.CLICK_SELECTOR].selector);
        
      case ACTION_TYPES.SWIPE_LEFT:
        return executeKeyPress(params.key || DEFAULT_ACTION_PARAMS[ACTION_TYPES.SWIPE_LEFT].key);
        
      case ACTION_TYPES.SWIPE_RIGHT:
        return executeKeyPress(params.key || DEFAULT_ACTION_PARAMS[ACTION_TYPES.SWIPE_RIGHT].key);
        
      case ACTION_TYPES.NOOP:
        console.log('😴 No action executed (NOOP)');
        return true;
        
      default:
        console.warn(`⚠️ Unknown action type: ${action}`);
        showToast(`Unknown action: ${action}`, 'error');
        return false;
    }
  } catch (error) {
    console.error('❌ Action execution failed:', error);
    showToast(`Action failed: ${error.message}`, 'error');
    return false;
  }
};

/**
 * Get default mapping for gesture labels
 * @param {Array} labels - Array of gesture labels
 * @returns {Object} Default mapping configuration
 */
export const getDefaultMapping = (labels) => {
  const defaultMapping = {};
  
  // Provide sensible defaults for common labels
  labels.forEach((label, index) => {
    switch (label.toLowerCase()) {
      case 'open_hand':
      case 'open':
      case 'palm':
        defaultMapping[label] = { action: ACTION_TYPES.SCROLL_DOWN, params: { pixels: 300 } };
        break;
      case 'fist':
      case 'closed':
        defaultMapping[label] = { action: ACTION_TYPES.TOGGLE_VIDEO, params: {} };
        break;
      case 'thumbs_up':
      case 'thumbs':
      case 'like':
        defaultMapping[label] = { action: ACTION_TYPES.VOLUME_UP, params: { amount: 0.1 } };
        break;
      case 'thumbs_down':
      case 'dislike':
        defaultMapping[label] = { action: ACTION_TYPES.VOLUME_DOWN, params: { amount: 0.1 } };
        break;
      case 'peace':
      case 'victory':
        defaultMapping[label] = { action: ACTION_TYPES.TAB_NEXT, params: {} };
        break;
      case 'point':
      case 'finger':
        defaultMapping[label] = { action: ACTION_TYPES.CLICK_SELECTOR, params: { selector: 'button' } };
        break;
      default:
        defaultMapping[label] = { action: ACTION_TYPES.NOOP, params: {} };
        break;
    }
  });
  
  return defaultMapping;
};

/**
 * Save gesture mappings to localStorage
 * @param {Object} mappings - Mapping configuration object
 */
export const saveMappings = (mappings) => {
  try {
    localStorage.setItem('gesture-action-mappings', JSON.stringify(mappings));
    console.log('💾 Gesture mappings saved to localStorage');
    return true;
  } catch (error) {
    console.error('❌ Failed to save mappings:', error);
    showToast('Failed to save mappings', 'error');
    return false;
  }
};

/**
 * Load gesture mappings from localStorage
 * @param {Array} labels - Array of gesture labels for default fallback
 * @returns {Object} Loaded or default mapping configuration
 */
export const loadMappings = (labels = []) => {
  try {
    const saved = localStorage.getItem('gesture-action-mappings');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('📥 Gesture mappings loaded from localStorage');
      return parsed;
    }
  } catch (error) {
    console.error('❌ Failed to load mappings:', error);
    showToast('Failed to load saved mappings, using defaults', 'error');
  }
  
  // Return default mappings if loading fails or no saved mappings exist
  return getDefaultMapping(labels);
};

/**
 * Validate mapping configuration
 * @param {Object} mappings - Mapping configuration to validate
 * @returns {Object} Validation result with isValid flag and errors
 */
export const validateMappings = (mappings) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  if (!mappings || typeof mappings !== 'object') {
    validation.isValid = false;
    validation.errors.push('Mappings must be an object');
    return validation;
  }
  
  Object.entries(mappings).forEach(([label, mapping]) => {
    if (!mapping || typeof mapping !== 'object') {
      validation.errors.push(`Invalid mapping for label \"${label}\"`);
      validation.isValid = false;
      return;
    }
    
    const { action, params = {} } = mapping;
    
    if (!action || !Object.values(ACTION_TYPES).includes(action)) {
      validation.errors.push(`Invalid action type for label \"${label}\": ${action}`);
      validation.isValid = false;
    }
    
    // Validate action-specific parameters
    if (action === ACTION_TYPES.SCROLL_DOWN || action === ACTION_TYPES.SCROLL_UP) {
      const dist = coalesceNumber(params.distance, params.pixels);
      if (dist !== undefined && (typeof dist !== 'number' || dist <= 0)) {
        validation.warnings.push(`Invalid scroll distance for \"${label}\": ${dist}`);
      }
    }
    
    if (action === ACTION_TYPES.CLICK_SELECTOR) {
      if (!params.selector || typeof params.selector !== 'string') {
        validation.warnings.push(`Missing or invalid selector for \"${label}\"`);
      }
    }
    
    if (action === ACTION_TYPES.KEY_PRESS) {
      if (!params.key || typeof params.key !== 'string') {
        validation.warnings.push(`Missing or invalid key for \"${label}\"`);
      }
    }
  });
  
  return validation;
};
