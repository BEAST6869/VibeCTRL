// Lightweight popup logic
(async function(){
  const statusEl = document.getElementById('status');
  const hostEl = document.getElementById('host');
  const toggleBtn = document.getElementById('toggle');
  const openDashboard = document.getElementById('openDashboard');
  const openSettings = document.getElementById('openSettings');
  const help = document.getElementById('help');

  function setStatus(on){
    statusEl.textContent = `Overlay: ${on ? 'ON' : 'OFF'}`;
    statusEl.classList.toggle('on', !!on);
    statusEl.classList.toggle('off', !on);
    toggleBtn.textContent = on ? 'Disable on this site' : 'Enable on this site';
  }

  async function getActiveTab(){
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs && tabs[0]));
    });
  }

  const tab = await getActiveTab();
  const url = new URL(tab.url || '');
  const host = url.host || 'unknown';
  hostEl.textContent = host;

  const { vibe_overlay_enabled } = await chrome.storage.local.get('vibe_overlay_enabled');
  setStatus(!!vibe_overlay_enabled);

  toggleBtn.onclick = async () => {
    try {
      const current = (await chrome.storage.local.get('vibe_overlay_enabled')).vibe_overlay_enabled;
      const enable = !current;
      await chrome.storage.local.set({ vibe_overlay_enabled: enable });
      if (tab && tab.id != null) {
        await chrome.tabs.sendMessage(tab.id, { type: enable ? 'VIBE_INJECT_OVERLAY' : 'VIBE_REMOVE_OVERLAY' });
      }
      setStatus(enable);
    } catch (e) {
      console.warn('Toggle overlay failed', e);
    }
  };

  openDashboard.onclick = async () => {
    const url = chrome.runtime.getURL('offscreen.html#/dashboard');
    await chrome.tabs.create({ url });
  };
  openSettings.onclick = async () => {
    const url = chrome.runtime.getURL('offscreen.html#/settings');
    await chrome.tabs.create({ url });
  };
  help.onclick = async () => {
    const url = chrome.runtime.getURL('WARP_EXTENSION_REPORT.md');
    await chrome.tabs.create({ url });
  };
})();
