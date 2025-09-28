/**
 * Page-context camera injection system for VibeCTRL
 * This script runs in the page context to handle camera access properly
 */

// Bootstrap overlay function that runs in page context
async function bootstrapOverlay() {
  // Prevent multiple initializations
  if (window.__VIBECTRL_OVERLAY_BOOTSTRAPPED__) return;
  window.__VIBECTRL_OVERLAY_BOOTSTRAPPED__ = true;

  console.log('🎬 VibeCTRL: Bootstrapping overlay in page context');

  // Check for secure origin
  if (!location.protocol.startsWith('https') && location.hostname !== 'localhost') {
    console.error('❌ VibeCTRL: Camera blocked on insecure pages. Use HTTPS or localhost.');
    showOverlayError('Camera blocked: page is not secure. Use HTTPS or localhost.');
    return;
  }

  // Create overlay root
  let root = document.getElementById('vibectrl-overlay-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'vibectrl-overlay-root';
    root.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;
    document.body.appendChild(root);
  }

  // Create page-owned video element
  if (!document.getElementById('vibectrl_page_video')) {
    const video = document.createElement('video');
    video.id = 'vibectrl_page_video';
    video.playsInline = true;
    video.muted = true;
    video.autoplay = false;
    video.style.cssText = `
      display: none;
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    root.appendChild(video);
  }

  // Create overlay UI
  createOverlayUI(root);

  // Set up camera event listeners
  setupCameraEventListeners();

  // Notify content script that overlay is ready
  window.postMessage({ 
    source: 'VIBECTRL_OVERLAY', 
    status: 'bootstrapped' 
  }, '*');
}

function createOverlayUI(root) {
  const overlayHTML = `
    <div id="vibectrl-overlay" style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      height: 240px;
      background: rgba(0, 0, 0, 0.9);
      border: 3px solid #10b981;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      pointer-events: auto;
      overflow: hidden;
      font-family: Arial, sans-serif;
    ">
      <div id="vibectrl-camera-container" style="
        width: 100%;
        height: 180px;
        background: #111;
        position: relative;
        overflow: hidden;
      ">
        <video id="vibectrl-camera-preview" style="
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: none;
        "></video>
        <div id="vibectrl-camera-placeholder" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #fff;
          text-align: center;
          padding: 20px;
        ">
          <div style="font-size: 48px; margin-bottom: 10px;">📹</div>
          <div style="font-size: 14px; margin-bottom: 15px;">VibeCTRL Camera</div>
          <button id="vibectrl-enable-camera" style="
            background: #10b981;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
          ">Enable Camera</button>
        </div>
        <div id="vibectrl-error-message" style="
          display: none;
          color: #ff6b6b;
          font-size: 12px;
          padding: 10px;
          text-align: center;
          background: rgba(255, 107, 107, 0.1);
        "></div>
      </div>
      <div id="vibectrl-controls" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: 12px;
      ">
        <div id="vibectrl-gesture-status">No gesture detected</div>
        <div style="display: flex; gap: 8px;">
          <button id="vibectrl-retry-camera" style="
            background: transparent;
            color: #10b981;
            border: 1px solid #10b981;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
            display: none;
          ">Retry</button>
          <button id="vibectrl-close-overlay" style="
            background: transparent;
            color: #ff6b6b;
            border: 1px solid #ff6b6b;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
          ">✕</button>
        </div>
      </div>
    </div>
  `;

  root.innerHTML = overlayHTML;

  // Move the page video into the camera container
  const pageVideo = document.getElementById('vibectrl_page_video');
  const cameraContainer = document.getElementById('vibectrl-camera-container');
  const cameraPreview = document.getElementById('vibectrl-camera-preview');
  
  if (pageVideo && cameraContainer && cameraPreview) {
    // Copy the page video stream to the preview when available
    pageVideo.addEventListener('loadedmetadata', () => {
      if (pageVideo.srcObject) {
        cameraPreview.srcObject = pageVideo.srcObject;
        cameraPreview.style.display = 'block';
        document.getElementById('vibectrl-camera-placeholder').style.display = 'none';
      }
    });
  }

  // Wire up button events
  setupOverlayEvents();
}

function setupOverlayEvents() {
  const enableBtn = document.getElementById('vibectrl-enable-camera');
  const retryBtn = document.getElementById('vibectrl-retry-camera');
  const closeBtn = document.getElementById('vibectrl-close-overlay');

  if (enableBtn) {
    enableBtn.addEventListener('click', () => {
      console.log('🎬 VibeCTRL: User clicked enable camera');
      window.dispatchEvent(new Event('VIBECTRL_REQUEST_CAMERA'));
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      console.log('🎬 VibeCTRL: User clicked retry camera');
      hideError();
      window.dispatchEvent(new Event('VIBECTRL_REQUEST_CAMERA'));
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('🎬 VibeCTRL: User clicked close overlay');
      window.dispatchEvent(new Event('VIBECTRL_CLOSE_OVERLAY'));
    });
  }
}

function setupCameraEventListeners() {
  // Request camera when user clicks enable
  window.addEventListener('VIBECTRL_REQUEST_CAMERA', async () => {
    try {
      console.log('🎬 VibeCTRL: Requesting camera access...');
      showStatus('Requesting camera access...');
      
      const constraints = { 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }, 
        audio: false 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const pageVideo = document.getElementById('vibectrl_page_video');
      const previewVideo = document.getElementById('vibectrl-camera-preview');
      
      if (pageVideo) {
        pageVideo.srcObject = stream;
        await pageVideo.play().catch(e => console.warn('Play failed:', e));
      }
      
      if (previewVideo) {
        previewVideo.srcObject = stream;
        await previewVideo.play().catch(e => console.warn('Preview play failed:', e));
      }
      
      // Hide placeholder and show video
      const placeholder = document.getElementById('vibectrl-camera-placeholder');
      if (placeholder) placeholder.style.display = 'none';
      if (previewVideo) previewVideo.style.display = 'block';
      
      hideError();
      showStatus('Camera active');
      
      // Notify content script
      window.postMessage({ 
        source: 'VIBECTRL_CAMERA', 
        status: 'ready',
        videoId: 'vibectrl_page_video'
      }, '*');
      
      console.log('✅ VibeCTRL: Camera access granted');
      
    } catch (error) {
      console.error('❌ VibeCTRL: Camera access failed:', error);
      handleCameraError(error);
    }
  });

  // Stop camera when requested
  window.addEventListener('VIBECTRL_STOP_CAMERA', () => {
    const pageVideo = document.getElementById('vibectrl_page_video');
    const previewVideo = document.getElementById('vibectrl-camera-preview');
    
    if (pageVideo && pageVideo.srcObject) {
      pageVideo.srcObject.getTracks().forEach(track => track.stop());
      pageVideo.srcObject = null;
    }
    
    if (previewVideo && previewVideo.srcObject) {
      previewVideo.srcObject.getTracks().forEach(track => track.stop());
      previewVideo.srcObject = null;
    }
    
    // Show placeholder again
    const placeholder = document.getElementById('vibectrl-camera-placeholder');
    if (placeholder) placeholder.style.display = 'flex';
    if (previewVideo) previewVideo.style.display = 'none';
    
    showStatus('Camera stopped');
    
    window.postMessage({ 
      source: 'VIBECTRL_CAMERA', 
      status: 'stopped' 
    }, '*');
  });

  // Close overlay when requested
  window.addEventListener('VIBECTRL_CLOSE_OVERLAY', () => {
    const root = document.getElementById('vibectrl-overlay-root');
    if (root) {
      root.remove();
    }
    window.__VIBECTRL_OVERLAY_BOOTSTRAPPED__ = false;
    
    window.postMessage({ 
      source: 'VIBECTRL_OVERLAY', 
      status: 'closed' 
    }, '*');
  });
}

function handleCameraError(error) {
  let errorMessage = 'Camera error occurred';
  let showRetry = true;
  
  switch (error.name) {
    case 'NotAllowedError':
      errorMessage = 'Camera permission denied. Click the lock icon next to the URL and allow Camera for this site, or click Retry.';
      break;
    case 'NotFoundError':
      errorMessage = 'No camera found. Check your device or try a different camera.';
      break;
    case 'SecurityError':
      errorMessage = 'Camera blocked: page is not secure. Use HTTPS or localhost.';
      showRetry = false;
      break;
    case 'AbortError':
      errorMessage = 'Camera access was interrupted. Click Retry to try again.';
      break;
    default:
      errorMessage = `Camera error: ${error.message || error.name}. Click Retry to try again.`;
  }
  
  showError(errorMessage, showRetry);
}

function showError(message, showRetry = true) {
  const errorDiv = document.getElementById('vibectrl-error-message');
  const retryBtn = document.getElementById('vibectrl-retry-camera');
  
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
  
  if (retryBtn) {
    retryBtn.style.display = showRetry ? 'block' : 'none';
  }
  
  showStatus('Camera error');
}

function hideError() {
  const errorDiv = document.getElementById('vibectrl-error-message');
  const retryBtn = document.getElementById('vibectrl-retry-camera');
  
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
  
  if (retryBtn) {
    retryBtn.style.display = 'none';
  }
}

function showStatus(message) {
  const statusDiv = document.getElementById('vibectrl-gesture-status');
  if (statusDiv) {
    statusDiv.textContent = message;
  }
}

function showOverlayError(message) {
  // Create a simple error overlay if the main overlay fails
  const errorOverlay = document.createElement('div');
  errorOverlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff6b6b;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 2147483647;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  errorOverlay.textContent = message;
  document.body.appendChild(errorOverlay);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorOverlay.parentNode) {
      errorOverlay.parentNode.removeChild(errorOverlay);
    }
  }, 5000);
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapOverlay);
} else {
  bootstrapOverlay();
}
