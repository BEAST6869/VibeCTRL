# PR Notes — Cookbook camera + gesture mappings

Branch: feature/cookbook-camera-gestures

Summary
- Add a dedicated, responsive camera panel to the Cookbook page that reuses the same camera+gesture pipeline as Landing.
- Implement gesture-driven interactions on Cookbook: open_hand → scroll down; fist → scroll up; swipe_left/right → previous/next page.
- Use react-pageflip for book behavior and expose imperative API (flipNext/flipPrev) for programmatic navigation.
- Add throttled, live gesture status UI below the camera with label + confidence bar.
- Defer heavy ML model load until the user clicks “Enable Detection”.

Key changes
- src/pages/Cookbook.jsx
  - New two-column responsive layout: 3/4 book area + 1/4 camera panel (stacks on narrow screens)
  - Wire window.cookbookActions { nextPage, prevPage, scrollUp, scrollDown } used by GestureController
  - Programmatic page flips via RecipeBook ref
- src/components/recipe/RecipeBook.jsx
  - Forward ref and expose flipNext/flipPrev/getCurrentPage using HTMLFlipBook API
  - Add keyboard ArrowLeft/ArrowRight support
- src/components/CookbookCameraPanel.jsx [NEW]
  - Hosts GestureController (same as Landing) with control strip
  - “Enable Detection” to opt-in to model load and inference
  - Live gesture status (label + confidence) with requestAnimationFrame updates
- src/App.css
  - Styles for cookbook layout and camera panel

How to test
1) Navigate to the Cookbook page.
2) Verify layout:
   - Desktop/wide: left/main shows the RecipeBook (~75%), right/side shows the camera panel (~25%).
   - Narrow/mobile: book stacks above camera panel.
3) Click “Enable Detection” in the camera panel. The model loads and live camera preview appears.
4) Perform gestures:
   - Swipe right: book flips to previous page.
   - Swipe left: book flips to next page.
   - Open hand (palm): scrolls content down (if content is scrollable) or page.
   - Fist: scrolls content up.
5) Observe:
   - Gesture label and confidence bar update in real time under the camera.
   - Cooldowns prevent rapid repeated triggers from the same gesture hold.
6) Keyboard fallback: ArrowLeft/ArrowRight flip book pages.
7) Minimize camera: camera panel body collapses; re-open to continue.
8) Ensure no console errors and performance remains smooth while inference is running.

Notes
- Background detection while minimized is not enabled by default (saves CPU). If required, we can add a setting to continue inference while minimized.
- Overlays toggle controls the GestureController overlays.
- The gesture-to-action mapping logic is centralized in GestureController; Landing and Cookbook share the same pipeline.

Manual QA checklist
- [ ] Cookbook loads with 3/4 + 1/4 layout
- [ ] Camera panel shows Enable Detection before loading models
- [ ] Enabling detection starts camera and handpose model without errors
- [ ] Gesture label + confidence updates under camera (smooth transitions)
- [ ] Swipe left/right flips pages with appropriate throttling
- [ ] Open hand scrolls down content; fist scrolls up (or window if content is short)
- [ ] Keyboard ArrowLeft/Right navigate pages
- [ ] Layout stacks on small screens (book on top, camera below)
- [ ] No console warnings/errors

Out of scope (future)
- Drag/undock camera from panel (optional)
- Mapping customization UI for Cookbook (Dashboard)
- Background detection while minimized with a low-power mode
