# WARP_UI_REPORT

Neo-Brutalist UI applied across Landing, Dashboard, and Settings without touching ML logic.

Changed files
- package.json (added react-router-dom, clsx)
- src/index.js (import brutal.css)
- src/App.js (router + brutal layout)
- src/styles/brutal.css (tokens, utilities, layout)
- src/ui/brutal/BrutalButton.jsx
- src/ui/brutal/BrutalCard.jsx
- src/ui/brutal/BrutalInput.jsx
- src/ui/brutal/BrutalHeader.jsx
- src/utils/pressBehavior.js
- src/components/Sidebar.jsx
- src/components/Topbar.jsx
- src/pages/Landing.jsx
- src/pages/Dashboard.jsx
- src/pages/Settings.jsx
- src/components/MappingEditor.jsx (per-user mapping, import/export, test)
- src/components/GestureController.jsx (per-mapping cooldown + anti-spam, per-user load)
- src/utils/actions.js (cooldown, recentActions, per-user storage, import/export)

How to run
1) npm install
2) npm start

What to verify
- Landing: big Start Camera button with thick borders and hard shadows; asymmetrical card layout.
- Dashboard: left/top shows live camera preview in a boxed brutal card; right shows Gesture Status quick controls and Action History (DemoArea reused). Overlays now show last triggered action and timestamp for cooldown visualization.
- Settings: brutal inputs (ranges, checkbox) and mapping/editor section wrapped in brutal cards. Mapping Editor shows per-user ID and Import/Export buttons.
- Accessibility: visible 4px focus outlines, all nav and buttons reachable via Tab, strong pressed states.
- No gradients, only flat fills and sharp offset shadows.

Gesture mapping features
- Per-user/session mappings saved under localStorage key vibe_user_mappings_<userId> (userId auto-generated and persisted as vibe_user_id).
- Import/Export mapping JSON. Export format includes: { version, userId, exportedAt, mappings: [{ gesture, action, params, lastTriggered }] }.
- Cooldown and anti-repetition: actions gated by 700ms cooldown and recent action suppression; prevents continuous triggers (e.g., open hand no longer scrolls continuously).

Screenshots to capture
1) Desktop Dashboard: open /dashboard (ensure camera permission) and capture full view.
2) Landing page: open / and capture hero with Start Camera.
3) Mobile Dashboard: in browser devtools, toggle device toolbar (e.g., iPhone X) and capture /dashboard stacked layout.

Commit message
feat(mapping): add per-user customizable mappings and cooldown/anti-repetition

Notes
- ML logic (TensorFlow, handpose, training) untouched. Styling is layered via wrappers and global CSS.
- If Tailwind migration is desired later, brutal.css tokens map 1:1 to potential Tailwind variables.
