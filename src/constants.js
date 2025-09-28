/**
 * Application constants for the Vibe Gesture Controller
 */

// Default gesture labels for data collection
export const DEFAULT_LABELS = [
  "open_hand",    // Open palm for scrolling
  "fist",         // Closed fist for play/pause
  "thumbs_up",    // Thumbs up for volume up
  "thumbs_down",  // Thumbs down for volume down
  "peace",        // Peace sign for additional actions
  "point"         // Pointing gesture for clicking
];

// Data capture constants
export const CAPTURE_DEBOUNCE_MS = 16; // Approximately 60fps
export const MIN_RECORDING_TIME_MS = 500; // Minimum recording time hint
export const MAX_RECORDING_TIME_MS = 5000; // Maximum recording time hint

// Real-time inference constants
export const INFERENCE_CONFIG = {
  SMOOTHING_WINDOW: 5, // Number of predictions to keep in buffer (reduced for faster response)
  CONFIDENCE_THRESHOLD: 0.6, // Minimum confidence for action trigger (lowered for faster detection)
  COOLDOWN_MS: 400, // Milliseconds between actions (reduced for more responsive)
  INFERENCE_INTERVAL_MS: 50, // Milliseconds between predictions (doubled frequency)
  MIN_MAJORITY_COUNT: 3 // Minimum votes needed in window for majority (reduced for faster response)
};

// Swipe detection constants
export const SWIPE_CONFIG = {
  HISTORY_LENGTH: 8, // Number of centroid positions to track
  SWIPE_THRESHOLD: 0.12, // Minimum normalized distance for swipe detection
  SWIPE_COOLDOWN_MS: 800, // Milliseconds between swipe detections
  ANIMATION_DURATION_MS: 600 // Duration of swipe animation overlay
};
