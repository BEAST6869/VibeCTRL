# PR Notes — Dashboard polish for training + universal mappings

Branch: feature/dashboard-polish-training

Summary
- Refactor Dashboard to focus exclusively on model training and gesture mappings.
- Remove demo content, action history, interactive slides, calibration UI, and toast notifications from Dashboard.
- Implement universal mappings: updates in Dashboard propagate to Landing/Cookbook immediately (via custom event) and persist across reloads.

Key changes
- src/pages/Dashboard.jsx
  - New polished two-column layout: left Camera/Training, right Mapping Editor
  - No demo area, no quick media buttons, no action history, no slides
  - Mapping labels synced via custom event from GestureController and fallback to localStorage metadata
- src/components/GestureController.jsx
  - New props: enableCalibration (default true), showMappingEditor (default true)
  - Calibration UI hidden on Dashboard with enableCalibration={false}
  - Broadcast model metadata labels via window event `vibe:model-metadata`
  - Listen for `vibe:mappings-updated` and `storage` to refresh mappings live
- src/utils/actions.js
  - Suppress toasts on Dashboard (and Landing) in showToast()
  - Dispatch `vibe:mappings-updated` after saveMappings() for real-time propagation in SPA
- src/App.css
  - Add polished Dashboard grid layout styles
- README.md
  - Update with Dashboard changes and universal mappings behavior

How to test
1) Open Dashboard.
   - Verify the layout shows only Camera & Training on the left and Gesture Mappings on the right.
   - No demo area, no action history, no slides, no calibration controls.
2) Train or load a model.
   - Labels appear in the Gesture Mappings panel.
3) Edit mappings and click Save.
   - Mappings persist in localStorage.
   - Switch to Landing or Cookbook and verify gestures use the updated mappings without a reload if they’re mounted; otherwise, after reload.
4) Confirm no toast popups are shown on Dashboard (or Landing) during actions.
5) Performance remains smooth; camera and inference remain functional.

QA checklist
- [ ] Dashboard contains only camera/training and mapping sections
- [ ] No demo content, slides, calibration UI, or toasts on Dashboard
- [ ] Mapping edits propagate to Landing/Cookbook (real time if mounted, else on reload)
- [ ] Mappings persist in localStorage
- [ ] Camera preview and training controls work without regressions
- [ ] UI is responsive and accessible (ARIA labels on controls)
