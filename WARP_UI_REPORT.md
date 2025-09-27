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

How to run
1) npm install
2) npm start

What to verify
- Landing: big Start Camera button with thick borders and hard shadows; asymmetrical card layout.
- Dashboard: left/top shows live camera preview in a boxed brutal card; right shows Gesture Status quick controls and Action History (DemoArea reused). Gesture status overlays remain from existing logic.
- Settings: brutal inputs (ranges, checkbox) and mapping/editor section wrapped in brutal cards.
- Accessibility: visible 4px focus outlines, all nav and buttons reachable via Tab, strong pressed states.
- No gradients, only flat fills and sharp offset shadows.

Screenshots to capture
1) Desktop Dashboard: open /dashboard (ensure camera permission) and capture full view.
2) Landing page: open / and capture hero with Start Camera.
3) Mobile Dashboard: in browser devtools, toggle device toolbar (e.g., iPhone X) and capture /dashboard stacked layout.

Notes
- ML logic (TensorFlow, handpose, training) untouched. Styling is layered via wrappers and global CSS.
- If Tailwind migration is desired later, brutal.css tokens map 1:1 to potential Tailwind variables.
