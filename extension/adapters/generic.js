/**
 * Generic video adapter for non-YouTube sites
 * Handles video controls for any HTML5 video/audio elements
 */

class GenericAdapter {
  constructor() {
    this.lastActionTime = 0;
    this.cooldownMs = 400; // Prevent spam
  }

  /**
   * Initialize generic adapter
   */
  async init() {
    try {
      console.log('🎬 Generic video adapter initialized');
      return true;
    } catch (error) {
      console.warn('⚠️ Failed to initialize generic adapter:', error);
      return false;
    }
  }

  /**
   * Check if action is on cooldown
   */
  isOnCooldown() {
    const now = Date.now();
    if (now - this.lastActionTime < this.cooldownMs) {
      return true;
    }
    this.lastActionTime = now;
    return false;
  }

  /**
   * Show HUD feedback
   */
  showFeedback(icon, message) {
    try {
      // Remove existing feedback
      const existing = document.getElementById('vibe-feedback');
      if (existing) existing.remove();

      // Create feedback element
      const feedback = document.createElement('div');
      feedback.id = 'vibe-feedback';
      feedback.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
          font-size: 16px;
          font-weight: bold;
          z-index: 2147483647;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <span style="font-size: 20px; margin-right: 8px;">${icon}</span>
          ${message}
        </div>
      `;
      
      document.body.appendChild(feedback);
      
      // Auto-remove after 2 seconds
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 2000);
    } catch (error) {
      console.warn('⚠️ Failed to show feedback:', error);
    }
  }

  /**
   * Find all video/audio elements on the page
   */
  findMediaElements() {
    return document.querySelectorAll('video, audio');
  }

  /**
   * Get the primary media element (most likely to be the main video)
   */
  getPrimaryMediaElement() {
    const elements = this.findMediaElements();
    if (elements.length === 0) return null;

    // If only one element, return it
    if (elements.length === 1) return elements[0];

    // Try to find the most prominent video element
    for (const element of elements) {
      // Prefer video over audio
      if (element.tagName === 'VIDEO') {
        // Prefer elements that are visible and have reasonable dimensions
        const rect = element.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 100) {
          return element;
        }
      }
    }

    // Fallback to first element
    return elements[0];
  }

  /**
   * Play/Pause video
   */
  async playPause() {
    if (this.isOnCooldown()) return false;

    try {
      const mediaElements = this.findMediaElements();
      if (mediaElements.length === 0) {
        console.warn('⚠️ No media elements found');
        return false;
      }

      // Check if any are playing
      let anyPlaying = false;
      for (const element of mediaElements) {
        if (!element.paused) {
          anyPlaying = true;
          break;
        }
      }

      // Toggle all media elements
      for (const element of mediaElements) {
        if (anyPlaying) {
          element.pause();
        } else {
          try {
            await element.play();
          } catch (playError) {
            console.warn('⚠️ Play failed for element:', playError);
          }
        }
      }

      this.showFeedback(anyPlaying ? '⏸️' : '▶️', anyPlaying ? 'Paused' : 'Playing');
      return true;

    } catch (error) {
      console.warn('⚠️ Play/pause failed:', error);
      return false;
    }
  }

  /**
   * Volume up
   */
  async volumeUp(amount = 0.1) {
    if (this.isOnCooldown()) return false;

    try {
      const mediaElements = this.findMediaElements();
      if (mediaElements.length === 0) return false;

      let newVolume = 0;
      for (const element of mediaElements) {
        const currentVolume = element.volume;
        newVolume = Math.min(1, currentVolume + amount);
        element.volume = newVolume;
      }

      this.showFeedback('🔊', `Volume: ${Math.round(newVolume * 100)}%`);
      return true;

    } catch (error) {
      console.warn('⚠️ Volume up failed:', error);
      return false;
    }
  }

  /**
   * Volume down
   */
  async volumeDown(amount = 0.1) {
    if (this.isOnCooldown()) return false;

    try {
      const mediaElements = this.findMediaElements();
      if (mediaElements.length === 0) return false;

      let newVolume = 0;
      for (const element of mediaElements) {
        const currentVolume = element.volume;
        newVolume = Math.max(0, currentVolume - amount);
        element.volume = newVolume;
      }

      this.showFeedback('🔉', `Volume: ${Math.round(newVolume * 100)}%`);
      return true;

    } catch (error) {
      console.warn('⚠️ Volume down failed:', error);
      return false;
    }
  }

  /**
   * Toggle fullscreen
   */
  async toggleFullscreen() {
    if (this.isOnCooldown()) return false;

    try {
      const primaryElement = this.getPrimaryMediaElement();
      if (!primaryElement) return false;

      if (document.fullscreenElement) {
        await document.exitFullscreen();
        this.showFeedback('⛶', 'Exit Fullscreen');
      } else {
        await primaryElement.requestFullscreen();
        this.showFeedback('⛶', 'Enter Fullscreen');
      }
      return true;

    } catch (error) {
      console.warn('⚠️ Toggle fullscreen failed:', error);
      return false;
    }
  }

  /**
   * Seek forward
   */
  async seekForward(seconds = 10) {
    if (this.isOnCooldown()) return false;

    try {
      const mediaElements = this.findMediaElements();
      if (mediaElements.length === 0) return false;

      for (const element of mediaElements) {
        element.currentTime = Math.min(element.duration, element.currentTime + seconds);
      }

      this.showFeedback('⏩', `Seek +${seconds}s`);
      return true;

    } catch (error) {
      console.warn('⚠️ Seek forward failed:', error);
      return false;
    }
  }

  /**
   * Seek backward
   */
  async seekBackward(seconds = 10) {
    if (this.isOnCooldown()) return false;

    try {
      const mediaElements = this.findMediaElements();
      if (mediaElements.length === 0) return false;

      for (const element of mediaElements) {
        element.currentTime = Math.max(0, element.currentTime - seconds);
      }

      this.showFeedback('⏪', `Seek -${seconds}s`);
      return true;

    } catch (error) {
      console.warn('⚠️ Seek backward failed:', error);
      return false;
    }
  }

  /**
   * Execute action by name
   */
  async executeAction(actionName, params = {}) {
    switch (actionName) {
      case 'playPause':
      case 'toggle_video':
        return await this.playPause();
      
      case 'volumeUp':
      case 'volume_up':
        return await this.volumeUp(params.amount || 0.1);
      
      case 'volumeDown':
      case 'volume_down':
        return await this.volumeDown(params.amount || 0.1);
      
      case 'toggleFullscreen':
      case 'fullscreen':
        return await this.toggleFullscreen();
      
      case 'seekForward':
      case 'seek_forward':
        return await this.seekForward(params.seconds || 10);
      
      case 'seekBackward':
      case 'seek_backward':
        return await this.seekBackward(params.seconds || 10);
      
      default:
        console.warn(`⚠️ Unknown generic action: ${actionName}`);
        return false;
    }
  }
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GenericAdapter;
} else {
  window.GenericAdapter = GenericAdapter;
}
