# VibeCTRL Chrome Extension — Build and Usage Report

This report explains what files were added for the extension, how to build/load it, and how to use it.

Files added (extension/)
- extension/manifest.json — Chrome MV3 manifest (permissions: activeTab, storage, tabs, scripting)
- extension/popup.html — Popup wrapper (prepared from CRA build by build:ext)
- extension/background.js — Service worker to relay actions from the popup to the active tab content script
- extension/contentScript.js — Executes mapped actions on any website

Build helper
- scripts/prepare-extension.js — Copies CRA build into extension/, writes popup.html with correct asset paths

Shared changes
- src/utils/actions.js —
  - executeMappedAction(): When running inside the extension popup, sends the action to background, which forwards to the active tab content script. This ensures mapped actions run on the website, not inside the popup.
  - saveMappings(): Also mirrors mappings into chrome.storage.local (key: vibe_mappings_${userId}) for extension usage.
- package.json — Added npm script: npm run build:ext

Build & load steps
1) Build the React app and prepare the extension popup
   - npm run build:ext
   - This creates build/ and copies assets to extension/, producing extension/popup.html based on build/index.html.

2) Load the extension into Chrome
   - Open chrome://extensions
   - Toggle “Developer mode” (top-right)
   - Click “Load unpacked” and select the extension/ folder in your repo
   - You should see “VibeCTRL Gestures” in your extensions list

3) Open the popup
   - Click the VibeCTRL extension icon in the toolbar to open the popup
   - The popup hosts the full React app (Landing, Dashboard, Cookbook, etc.) with Neo-Brutalist UI intact

How it works (architecture)
- Popup — Training & mapping
  - Train models and adjust gesture mappings in the popup (Dashboard)
  - The app still uses its internal stores (IndexedDB/localStorage), but mappings are also mirrored into chrome.storage.local
  - When gestures are recognized in the popup, executeMappedAction() detects the extension context and relays the action to background → content script → active site

- Content script — Action execution on websites
  - Listens for messages { type: 'VIBE_EXECUTE', action, params }
  - Executes page actions asynchronously: scroll, play/pause media, volume controls, key press, click selector
  - Cooldown is enforced upstream in the app (GestureController + mapping canTrigger); content script is kept stateless for reliability

- Background — Relay
  - Receives action messages from the popup and forwards them to the active tab’s content script

Usage guide (step-by-step for users)
1) Install (developer mode)
   - Open chrome://extensions → Enable Developer Mode → Load unpacked → select the extension/ folder

2) Open the VibeCTRL popup
   - Click the extension icon to open the popup

3) Train hand gestures (Dashboard)
   - Use the Camera & Training section to collect data and train a model
   - Start inference to verify predictions and confidence

4) Set gesture mappings (Dashboard)
   - Configure each gesture’s action (scroll, play/pause, volume, key presses, etc.)
   - Click Save Mappings — they are applied globally and mirrored into Chrome storage

5) Test in the popup
   - Perform gestures while watching the status and confidence in the camera view
   - Actions will be relayed to the active tab when the popup is open

6) Use on any site
   - Navigate to a site (e.g., YouTube, news)
   - With the popup open and detection active, gestures will control the site (scroll, play/pause, volume)

7) Tune behavior
   - Adjust cooldown, scroll distance, and volume increments in the mapping parameters


Notes & limitations (MVP)
- Detection runs inside the popup; content scripts focus on executing actions within the active site. This keeps site performance impact low and avoids CSP friction.
- If you want detection to run fully on-page later, you can extend contentScript.js to initialize TF.js and the hand model and request getUserMedia; for MVP we prioritize reliability via the popup detection pipeline.
- When the popup is closed, gesture detection stops; actions will not be relayed until the popup is reopened and detection is active.

Troubleshooting
- If popup shows a placeholder message, ensure you ran: npm run build:ext
- If actions don’t affect the site, confirm the site tab is active and not a restricted URL (e.g., chrome:// pages)
- Ensure camera permission was granted in the popup and your model is loaded/inference is running

File list summary (deliverables)
- extension/manifest.json
- extension/popup.html
- extension/contentScript.js
- extension/background.js
- scripts/prepare-extension.js
- package.json (build:ext)
- src/utils/actions.js updates

Commit message suggestion
feat(extension): create popup for training/mapping, content script for any site, with user guide
