// Background (service worker) to relay VibeCTRL actions from popup to the active tab content script

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'VIBE_EXECUTE') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id != null) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'VIBE_EXECUTE',
          action: msg.action,
          params: msg.params || {},
        });
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: 'No active tab' });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
    // Return true to indicate async response
    return true;
  }
});
