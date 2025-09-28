// Background (service worker) to relay VibeCTRL actions from popup to the active tab content script

async function ensureOffscreen(alwaysOn = false) {
  if (!alwaysOn) return;
  const existing = await chrome.offscreen.hasDocument?.().catch(() => false);
  if (existing) return;
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html#/dashboard?detached=1',
      reasons: ['IFRAME_SCRIPTING'],
      justification: 'Run gesture detection with camera in background and relay actions to active tab.'
    });
  } catch (e) {
    console.warn('Offscreen create failed:', e);
  }
}

async function setBadge(enabled) {
  try {
    await chrome.action.setBadgeText({ text: enabled ? 'ON' : '' });
    await chrome.action.setBadgeBackgroundColor({ color: enabled ? '#10b981' : '#000000' });
  } catch {}
}

chrome.runtime.onInstalled.addListener(async () => {
  const { vibe_always_on: alwaysOn } = await chrome.storage.local.get('vibe_always_on');
  await ensureOffscreen(!!alwaysOn);
  await setBadge(!!alwaysOn);
});

chrome.runtime.onStartup.addListener(async () => {
  const { vibe_always_on: alwaysOn } = await chrome.storage.local.get('vibe_always_on');
  await ensureOffscreen(!!alwaysOn);
  await setBadge(!!alwaysOn);
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'toggle_overlay') {
    try {
      const current = (await chrome.storage.local.get('vibe_overlay_enabled')).vibe_overlay_enabled;
      const enable = !current;
      await chrome.storage.local.set({ vibe_overlay_enabled: enable });
      const targetTabId = tab?.id || (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
      if (targetTabId != null) {
        await chrome.tabs.sendMessage(targetTabId, { type: enable ? 'VIBE_INJECT_OVERLAY' : 'VIBE_REMOVE_OVERLAY' });
      }
    } catch (e) {
      console.warn('toggle_overlay command failed', e);
    }
  }
});

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'VIBE_EXECUTE') {
    try {
      // Prefer sender.tab (overlay iframe is hosted inside a tab)
      const targetTabId = sender?.tab?.id;
      let targetTab = null;
      if (typeof targetTabId === 'number') {
        targetTab = { id: targetTabId };
      } else {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        targetTab = tab || null;
      }
      if (targetTab && targetTab.id != null) {
        await chrome.tabs.sendMessage(targetTab.id, {
          type: 'VIBE_EXECUTE',
          action: msg.action,
          params: msg.params || {},
        });
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: 'No target tab' });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
    return true;
  }

  if (msg.type === 'VIBE_INJECT_PAGE_OVERLAY') {
    try {
      const tabId = msg.tabId || sender?.tab?.id;
      if (!tabId) {
        sendResponse({ ok: false, error: 'No tab ID provided' });
        return true;
      }

      // Inject the page-context camera system
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['page-injector.js']
      });

      sendResponse({ ok: true });
    } catch (e) {
      console.error('❌ Failed to inject page overlay:', e);
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
    return true;
  }

  if (msg.type === 'VIBE_GESTURE_DETECTED') {
    try {
      // Broadcast gesture to all tabs (not just active ones)
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'VIBE_GESTURE_DETECTED',
            gesture: msg.gesture,
            confidence: msg.confidence
          });
        } catch (e) {
          // Tab might not have content script, ignore
        }
      }
      sendResponse({ ok: true });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
    return true;
  }

  if (msg.type === 'VIBE_TOGGLE_OVERLAY') {
    try {
      const current = (await chrome.storage.local.get('vibe_overlay_enabled')).vibe_overlay_enabled;
      const enable = msg.enable != null ? !!msg.enable : !current;
      await chrome.storage.local.set({ vibe_overlay_enabled: enable });

      // Try to target the last focused NORMAL window's active tab
      let targetTab = null;
      try {
        const lastWin = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
        if (lastWin && lastWin.id != null) {
          const tabs = await chrome.tabs.query({ active: true, windowId: lastWin.id });
          if (tabs && tabs.length) targetTab = tabs[0];
        }
      } catch {}

      // Fallback to sender tab
      if (!targetTab && sender?.tab?.id != null) {
        targetTab = sender.tab;
      }

      if (targetTab && targetTab.id != null) {
        await chrome.tabs.sendMessage(targetTab.id, { type: enable ? 'VIBE_INJECT_OVERLAY' : 'VIBE_REMOVE_OVERLAY' });
      }
      sendResponse({ ok: true, enabled: enable, tabId: targetTab?.id ?? null });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
    return true;
  }

  if (msg.type === 'VIBE_TOGGLE_ALWAYS_ON') {
    try {
      const enable = !!msg.enable;
      await chrome.storage.local.set({ vibe_always_on: enable });
      if (enable) await ensureOffscreen(true);
      else if (chrome.offscreen?.closeDocument) {
        try { await chrome.offscreen.closeDocument(); } catch {}
      }
      await setBadge(enable);
      sendResponse({ ok: true });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
    return true;
  }
});
