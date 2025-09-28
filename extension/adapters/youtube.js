/**
 * YouTube-specific adapter for video controls
 * Handles YouTube player interactions with multiple fallback strategies
 */

class YouTubeAdapter {
  constructor() {
    this.lastActionTime = 0;
    this.cooldownMs = 400; // Prevent spam
    this.player = null;
    this.playerState = null;
  }

  /**
   * Initialize YouTube adapter
   */
  async init() {
    try {
      // Try to find YouTube player
      this.player = this.findYouTubePlayer();
      if (this.player) {
        console.log('🎬 YouTube player found and initialized');
        return true;
      }
      return false;
    } catch (error) {
      console.warn('⚠️ Failed to initialize YouTube adapter:', error);
      return false;
    }
  }

  /**
   * Find YouTube player element
   */
  findYouTubePlayer() {
    // Try multiple selectors for YouTube player
    const selectors = [
      '#movie_player',
      '.html5-video-player',
      'video[src*="youtube"]',
      'video'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    return null;
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
   * Play/Pause video
   */
  async playPause() {
    if (this.isOnCooldown()) return false;

    try {
      // Strategy 1: Direct video element control
      const video = document.querySelector('video');
      if (video) {
        if (video.paused) {
          await video.play();
          this.showFeedback('▶️', 'Playing');
        } else {
          video.pause();
          this.showFeedback('⏸️', 'Paused');
        }
        return true;
      }

      // Strategy 2: YouTube player button click
      const playButton = document.querySelector('.ytp-play-button');
      if (playButton) {
        playButton.click();
        const isPlaying = playButton.getAttribute('title')?.includes('Pause');
        this.showFeedback(isPlaying ? '▶️' : '⏸️', isPlaying ? 'Playing' : 'Paused');
        return true;
      }

      // Strategy 3: Keyboard event
      const event = new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', bubbles: true });
      document.dispatchEvent(event);
      this.showFeedback('🎬', 'Toggle Playback');
      return true;

    } catch (error) {
      console.warn('⚠️ Play/pause failed:', error);
      return false;
    }
  }

  /**
   * Next video
   */
  async next() {
    if (this.isOnCooldown()) return false;

    try {
      // Strategy 1: YouTube next button
      const nextButton = document.querySelector('.ytp-next-button');
      if (nextButton) {
        nextButton.click();
        this.showFeedback('⏭️', 'Next Video');
        return true;
      }

      // Strategy 2: Keyboard event (Shift+N)
      const event = new KeyboardEvent('keydown', { 
        key: 'n', 
        code: 'KeyN', 
        shiftKey: true,
        bubbles: true 
      });
      document.dispatchEvent(event);
      this.showFeedback('⏭️', 'Next Video');
      return true;

    } catch (error) {
      console.warn('⚠️ Next video failed:', error);
      return false;
    }
  }

  /**
   * Previous video
   */
  async prev() {
    if (this.isOnCooldown()) return false;

    try {
      // Strategy 1: YouTube prev button
      const prevButton = document.querySelector('.ytp-prev-button');
      if (prevButton) {
        prevButton.click();
        this.showFeedback('⏮️', 'Previous Video');
        return true;
      }

      // Strategy 2: Keyboard event (Shift+P)
      const event = new KeyboardEvent('keydown', { 
        key: 'p', 
        code: 'KeyP', 
        shiftKey: true,
        bubbles: true 
      });
      document.dispatchEvent(event);
      this.showFeedback('⏮️', 'Previous Video');
      return true;

    } catch (error) {
      console.warn('⚠️ Previous video failed:', error);
      return false;
    }
  }

  /**
   * Volume up
   */
  async volumeUp(amount = 0.1) {
    if (this.isOnCooldown()) return false;

    try {
      // Strategy 1: Direct video element control
      const video = document.querySelector('video');
      if (video) {
        const newVolume = Math.min(1, video.volume + amount);
        video.volume = newVolume;
        this.showFeedback('🔊', `Volume: ${Math.round(newVolume * 100)}%`);
        return true;
      }

      // Strategy 2: YouTube volume button
      const volumeButton = document.querySelector('.ytp-mute-button');
      if (volumeButton && volumeButton.getAttribute('title')?.includes('Mute')) {
        volumeButton.click();
        this.showFeedback('🔊', 'Volume Up');
        return true;
      }

      // Strategy 3: Keyboard event (Arrow Up)
      const event = new KeyboardEvent('keydown', { 
        key: 'ArrowUp', 
        code: 'ArrowUp',
        bubbles: true 
      });
      document.dispatchEvent(event);
      this.showFeedback('🔊', 'Volume Up');
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
      // Strategy 1: Direct video element control
      const video = document.querySelector('video');
      if (video) {
        const newVolume = Math.max(0, video.volume - amount);
        video.volume = newVolume;
        this.showFeedback('🔉', `Volume: ${Math.round(newVolume * 100)}%`);
        return true;
      }

      // Strategy 2: Keyboard event (Arrow Down)
      const event = new KeyboardEvent('keydown', { 
        key: 'ArrowDown', 
        code: 'ArrowDown',
        bubbles: true 
      });
      document.dispatchEvent(event);
      this.showFeedback('🔉', 'Volume Down');
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
      // Strategy 1: YouTube fullscreen button
      const fullscreenButton = document.querySelector('.ytp-fullscreen-button');
      if (fullscreenButton) {
        fullscreenButton.click();
        this.showFeedback('⛶', 'Toggle Fullscreen');
        return true;
      }

      // Strategy 2: Keyboard event (F)
      const event = new KeyboardEvent('keydown', { 
        key: 'f', 
        code: 'KeyF',
        bubbles: true 
      });
      document.dispatchEvent(event);
      this.showFeedback('⛶', 'Toggle Fullscreen');
      return true;

    } catch (error) {
      console.warn('⚠️ Toggle fullscreen failed:', error);
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
      
      case 'next':
      case 'next_video':
        return await this.next();
      
      case 'prev':
      case 'prev_video':
        return await this.prev();
      
      case 'volumeUp':
      case 'volume_up':
        return await this.volumeUp(params.amount || 0.1);
      
      case 'volumeDown':
      case 'volume_down':
        return await this.volumeDown(params.amount || 0.1);
      
      case 'toggleFullscreen':
      case 'fullscreen':
        return await this.toggleFullscreen();
      
      default:
        console.warn(`⚠️ Unknown YouTube action: ${actionName}`);
        return false;
    }
  }
}

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YouTubeAdapter;
} else {
  window.YouTubeAdapter = YouTubeAdapter;
}
