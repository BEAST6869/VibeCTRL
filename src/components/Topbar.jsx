import React from 'react';
import BrutalButton from '../ui/brutal/BrutalButton';
import Icon from '../ui/icons/Icon';

const Topbar = ({ sidebarHidden = false, onToggleSidebar = null }) => {
  const isExtension = typeof window !== 'undefined' && window.location && window.location.protocol === 'chrome-extension:';

  const goToDashboard = () => {
    if (isExtension) {
      // Use hash navigation inside popup
      try { window.location.hash = '#/dashboard'; } catch {}
    } else {
      window.location.assign('/dashboard');
    }
  };

  const openInWindow = async () => {
    try {
      const hasChrome = typeof window !== 'undefined' && window.chrome && window.chrome.runtime;
      const url = hasChrome
        ? window.chrome.runtime.getURL('popup.html#/dashboard?detached=1')
        : window.location.href.replace(/#.*$/, '') + '#/dashboard?detached=1';
      if (hasChrome && window.chrome.windows && window.chrome.windows.create) {
        await window.chrome.windows.create({ url, type: 'popup', width: 1100, height: 800, focused: true });
      } else {
        // Fallback: open regular window
        window.open(url, '_blank', 'width=1100,height=800');
      }
    } catch (e) {
      console.warn('Open in window failed:', e);
      goToDashboard();
    }
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span aria-hidden className="big-border" style={{ width: 18, height: 18, background: 'var(--accent-1)', display: 'inline-block' }} />
        <strong>Neo‑Brutal UI</strong>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <BrutalButton
          variant="outline"
          aria-label={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
          onClick={() => onToggleSidebar && onToggleSidebar()}
        >
          <Icon name="menu" /> {sidebarHidden ? 'Show' : 'Hide'} Sidebar
        </BrutalButton>
        <BrutalButton variant="invert" aria-label="Start camera" onClick={goToDashboard}>
          <Icon name="start" /> Start Camera
        </BrutalButton>
        {isExtension && (
          <>
            <BrutalButton aria-label="Open in window" onClick={openInWindow}>
              <Icon name="open" /> Open in Window
            </BrutalButton>
            <BrutalButton
              variant="outline"
              aria-label="Toggle in-page overlay detection"
              onClick={async () => {
                try {
                  const current = await new Promise((res) => {
                    window.chrome.storage.local.get('vibe_overlay_enabled', data => res(!!data.vibe_overlay_enabled));
                  });
                  const resp = await new Promise((res) => {
                    window.chrome.runtime.sendMessage({ type: 'VIBE_TOGGLE_OVERLAY', enable: !current }, (r) => res(r));
                  });
                  alert(resp?.enabled ? 'Overlay enabled on this tab' : 'Overlay removed');
                } catch (e) {
                  console.warn('Toggle overlay failed', e);
                }
              }}
            >
              <Icon name="power" /> Overlay
            </BrutalButton>
          </>
        )}
      </div>
    </header>
  );
};

export default Topbar;
