import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { flattenLandmarks, computeCentroid } from '../utils/features';
import { DEFAULT_LABELS, INFERENCE_CONFIG, SWIPE_CONFIG } from '../constants';
import { trainModel, loadModel, testModelPrediction, deleteModel, validateDataset } from '../ml/train';
import { executeMappedAction, loadMappings, canTrigger, getOrCreateUserId } from '../utils/actions';
import MappingEditor from './MappingEditor';

/**
 * LANDMARKS: The 21 keypoints that define a hand's pose, indexed 0-20.
 * Each landmark represents a specific joint or fingertip position.
 * Order: wrist (0), thumb (1-4), index (5-8), middle (9-12), ring (13-16), pinky (17-20).
 */

/**
 * FEATURES: Derived geometric properties from landmarks, such as finger angles,
 * distances between points, or hand orientation vectors used for gesture classification.
 */

/**
 * CENTROID: The average position (x, y) of all landmarks, representing the hand's
 * center point for gesture normalization and relative positioning calculations.
 */

const GestureController = ({ mode = 'full', onRegisterControls = null, onStatusChange = null, showOverlays = true, enableCalibration = true, showMappingEditor = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handModel = useRef(null);
  const animationFrameRef = useRef(null);
  const datasetRef = useRef({});
  const lastCaptureTimeRef = useRef(0);
  const isRecordingRef = useRef(null);
  const inferenceIntervalRef = useRef(null);
  const predictionWindowRef = useRef([]);
  const lastActionTimeRef = useRef(0);
  const lastInferenceTimeRef = useRef(0);
  const centroidHistoryRef = useRef([]);
  const lastSwipeTimeRef = useRef(0);
  // Anti-spam and cooldown tracking (per-gesture) and anti-hold flags
  const lastTriggeredRef = useRef({}); // per-gesture last trigger timestamp
  const recentActionsRef = useRef([]); // array of { label, timestamp }
  // Anti-hold: require label release before firing same gesture again
  const lastFiredLabelRef = useRef(null);
  const hasResetSinceLastFireRef = useRef(true);
  
  // File input ref for importing TF.js models (model.json + weights)
  const importInputRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [isRecording, setIsRecording] = useState(null);
  const [datasetCounts, setDatasetCounts] = useState({});
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [trainedModel, setTrainedModel] = useState(null);
  const [modelMetadata, setModelMetadata] = useState(null);
  const [isInferenceActive, setIsInferenceActive] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [lastTriggeredAction, setLastTriggeredAction] = useState(null);
const [gestureMappings, setGestureMappings] = useState({});
  const [userId, setUserId] = useState(null);
  const [swipeAnimation, setSwipeAnimation] = useState(null);
  
  // UI Polish State
  const [confidenceThreshold, setConfidenceThreshold] = useState(INFERENCE_CONFIG.CONFIDENCE_THRESHOLD);
  const [cooldownMs, setCooldownMs] = useState(INFERENCE_CONFIG.COOLDOWN_MS);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [neutralBaseline, setNeutralBaseline] = useState(null);
  const [gestureAnimation, setGestureAnimation] = useState(null);

  // Initialize dataset structure
  useEffect(() => {
    const initialDataset = {};
    const initialCounts = {};
    DEFAULT_LABELS.forEach(label => {
      initialDataset[label] = [];
      initialCounts[label] = 0;
    });
    datasetRef.current = initialDataset;
    setDatasetCounts(initialCounts);
  }, []);

  // Initialize TensorFlow and load handpose model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        console.log('Initializing TensorFlow...');
        await tf.ready();
        console.log('TF ready');
        
        console.log('Loading handpose model...');
        handModel.current = await handpose.load();
        console.log('handpose loaded');
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading model:', err);
        setError('Failed to load handpose model. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initializeModel();
  }, []);

  // Initialize camera
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480 
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log('camera started');
            startDetection();
          };
        }
      } catch (err) {
        console.error('Camera error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraPermissionDenied(true);
          setError('Camera permission denied. Please enable camera access to use gesture detection.');
        } else {
          setError('Failed to access camera. Please ensure your camera is connected and not being used by another application.');
        }
        setIsLoading(false);
      }
    };

    if (!isLoading && handModel.current) {
      initializeCamera();
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (inferenceIntervalRef.current) {
        clearInterval(inferenceIntervalRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isLoading]);

  // Hand detection and rendering
  const detectHands = async () => {
    if (videoRef.current && canvasRef.current && handModel.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        // Estimate hands
        const predictions = await handModel.current.estimateHands(video, true);
        console.log('frame processed', `hands detected: ${predictions.length}`);

        // Draw landmarks for each detected hand
        predictions.forEach((prediction, handIndex) => {
          const landmarks = prediction.landmarks;
          
          // Extract features and centroid
          const features = flattenLandmarks(landmarks);
          const centroid = computeCentroid(landmarks);
          
          // Debug landmarks and features
          console.log(`👋 Hand ${handIndex}: Landmarks count = ${landmarks.length}`);
          console.log(`👋 Features result:`, features ? `Length ${features.length}, Type ${features.constructor.name}` : 'NULL');
          
          if (features && centroid) {
            console.log(`Hand ${handIndex}: Features length = ${features.length}, Centroid = {x: ${centroid.x.toFixed(1)}, y: ${centroid.y.toFixed(1)}}`);
            
            // Data capture logic - using ref for reliable async access
            const currentRecording = isRecordingRef.current;
            if (currentRecording && handIndex === 0) { // Only record first detected hand
              console.log(`🎯 Recording mode active for: ${currentRecording}`);
              
              const currentTime = Date.now();
              if (currentTime - lastCaptureTimeRef.current > 50) { // Slower debouncing for testing
                try {
                  // Convert Float32Array to regular array for JSON serialization
                  const featuresArray = Array.from(features);
                  console.log(`📋 Capturing features array, length: ${featuresArray.length}`);
                  
                  // Ensure dataset structure exists
                  if (!datasetRef.current[currentRecording]) {
                    console.log(`⚠️ Creating missing dataset entry for: ${currentRecording}`);
                    datasetRef.current[currentRecording] = [];
                  }
                  
                  datasetRef.current[currentRecording].push(featuresArray);
                  const newCount = datasetRef.current[currentRecording].length;
                  console.log(`📊 CAPTURED ${currentRecording} sample #${newCount}`);
                  
                  // Update counts
                  setDatasetCounts(prev => {
                    const updated = {
                      ...prev,
                      [currentRecording]: newCount
                    };
                    return updated;
                  });
                  
                  lastCaptureTimeRef.current = currentTime;
                } catch (captureError) {
                  console.error('❌ Error during data capture:', captureError);
                }
              }
            }
          }
          
          // Draw each of the 21 landmarks
          landmarks.forEach((landmark, index) => {
            const [x, y] = landmark;
            
            // Draw landmark as blue circle
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#0066CC';
            ctx.fill();
            
            // Optional: Draw landmark index for debugging
            // ctx.fillStyle = 'white';
            // ctx.font = '10px Arial';
            // ctx.fillText(index.toString(), x + 7, y + 3);
          });
          
          // Draw centroid as red dot
          if (centroid) {
            ctx.beginPath();
            ctx.arc(centroid.x, centroid.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = '#FF4444';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      } catch (err) {
        console.error('Hand detection error:', err);
      }
    }
  };

  const startDetection = () => {
    const detect = async () => {
      await detectHands();
      animationFrameRef.current = requestAnimationFrame(detect);
    };
    detect();
  };

  // Recording event handlers
  const startRecording = (label) => {
    console.log(`🔴 Started recording: ${label}`);
    setIsRecording(label);
    isRecordingRef.current = label; // Keep ref in sync for async access
    lastCaptureTimeRef.current = 0; // Reset debounce timer
  };

  const stopRecording = () => {
    if (isRecording || isRecordingRef.current) {
      console.log(`⏹️ Stopped recording: ${isRecording || isRecordingRef.current}`);
      setIsRecording(null);
      isRecordingRef.current = null; // Keep ref in sync
    }
  };

  // Expose recording controls to parent page if requested (non-invasive, UI-agnostic)
  useEffect(() => {
    if (typeof onRegisterControls === 'function') {
      onRegisterControls({ startRecording, stopRecording });
    }
  }, [onRegisterControls]);

  // Dataset management functions
  const clearLabelData = (label) => {
    datasetRef.current[label] = [];
    setDatasetCounts(prev => ({
      ...prev,
      [label]: 0
    }));
    console.log(`🗑️ Cleared data for label: ${label}`);
  };

  const exportDataset = () => {
    const datasetCopy = {};
    Object.keys(datasetRef.current).forEach(label => {
      datasetCopy[label] = [...datasetRef.current[label]];
    });
    
    const jsonString = JSON.stringify(datasetCopy, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gesture-dataset-${timestamp}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`💾 Exported dataset as: ${filename}`);
  };

  // Prevent context menu on long press
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  // Debug function to check current state
  const debugCurrentState = () => {
    console.log('=== DEBUG STATE ===');
    console.log('isRecording:', isRecording);
    console.log('datasetRef.current:', datasetRef.current);
    console.log('datasetCounts:', datasetCounts);
    console.log('handModel loaded:', !!handModel.current);
    console.log('==================');
  };

  // Add debug button (for testing)
  if (typeof window !== 'undefined') {
    window.debugGestureController = debugCurrentState;
  }

  // Inference utility functions
  const getMajorityVote = (predWindow) => {
    if (predWindow.length === 0) return null;
    
    // Count occurrences of each prediction
    const counts = {};
    predWindow.forEach(pred => {
      counts[pred] = (counts[pred] || 0) + 1;
    });
    
    // Find the most frequent prediction
    let maxCount = 0;
    let majorityPred = null;
    
    Object.entries(counts).forEach(([pred, count]) => {
      if (count > maxCount) {
        maxCount = count;
        majorityPred = parseInt(pred);
      }
    });
    
    // Check if it constitutes a majority (more than half)
    const requiredMajority = Math.ceil(predWindow.length / 2);
    if (maxCount >= requiredMajority && maxCount >= INFERENCE_CONFIG.MIN_MAJORITY_COUNT) {
      return { prediction: majorityPred, votes: maxCount, total: predWindow.length };
    }
    
    return null;
  };

  const addToPredictionWindow = (prediction) => {
    predictionWindowRef.current.push(prediction);
    
    // Keep window size limited
    if (predictionWindowRef.current.length > INFERENCE_CONFIG.SMOOTHING_WINDOW) {
      predictionWindowRef.current.shift();
    }
  };

  // Swipe detection utilities
  const addToCentroidHistory = (centroid) => {
    if (!centroid) return;
    
    // Normalize centroid position relative to video dimensions
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    
    const normalizedX = centroid.x / video.videoWidth;
    centroidHistoryRef.current.push(normalizedX);
    
    // Keep history size limited
    if (centroidHistoryRef.current.length > SWIPE_CONFIG.HISTORY_LENGTH) {
      centroidHistoryRef.current.shift();
    }
  };

  const detectSwipe = () => {
    const history = centroidHistoryRef.current;
    
    // Need enough history points
    if (history.length < SWIPE_CONFIG.HISTORY_LENGTH) {
      return null;
    }
    
    // Check cooldown
    const currentTime = Date.now();
    if (currentTime - lastSwipeTimeRef.current < SWIPE_CONFIG.SWIPE_COOLDOWN_MS) {
      return null;
    }
    
    // Calculate movement delta
    const firstX = history[0];
    const lastX = history[history.length - 1];
    const dx = lastX - firstX;
    
    console.log(`🌊 Swipe detection: dx=${dx.toFixed(4)}, threshold=±${SWIPE_CONFIG.SWIPE_THRESHOLD}`);
    
    // Detect swipe direction
    let swipeDirection = null;
    if (dx > SWIPE_CONFIG.SWIPE_THRESHOLD) {
      swipeDirection = 'swipe_right';
    } else if (dx < -SWIPE_CONFIG.SWIPE_THRESHOLD) {
      swipeDirection = 'swipe_left';
    }
    
    if (swipeDirection) {
      console.log(`👋 SWIPE DETECTED: ${swipeDirection} (dx=${dx.toFixed(4)})`);
      
      // Clear history and set cooldown
      centroidHistoryRef.current = [];
      lastSwipeTimeRef.current = currentTime;
      
      // Trigger swipe animation
      setSwipeAnimation({ direction: swipeDirection, timestamp: currentTime });
      setTimeout(() => {
        setSwipeAnimation(null);
      }, SWIPE_CONFIG.ANIMATION_DURATION_MS);
      
      return swipeDirection;
    }
    
    return null;
  };

  const triggerSwipeAction = (swipeDirection) => {
    const currentTime = Date.now();

    // Per-gesture cooldown for swipes as well
    const lastForGesture = lastTriggeredRef.current[swipeDirection] || 0;
    if (currentTime - lastForGesture < cooldownMs) {
      console.log(`⏱️ Swipe cooldown active for ${swipeDirection}, skipping.`);
      return false;
    }
    lastTriggeredRef.current[swipeDirection] = currentTime;
    recentActionsRef.current.push({ label: swipeDirection, timestamp: currentTime });
    if (recentActionsRef.current.length > 30) recentActionsRef.current.shift();

    console.log(`🎯 SWIPE ACTION TRIGGERED: ${swipeDirection}`);

    // Execute asynchronously to avoid blocking UI/inference loop
    setTimeout(() => {
      const mapping = gestureMappings[swipeDirection];
      if (mapping) {
        console.log('🎨 Executing mapped swipe action:', mapping);
        if (!canTrigger(mapping)) {
          console.log('⏱️ Cooldown/anti-spam: swipe suppressed');
          return;
        }
        const success = executeMappedAction(mapping);
        if (success) {
          console.log('✅ Swipe action executed successfully');
        } else {
          console.log('❌ Swipe action execution failed');
        }
      } else {
        // Default swipe actions if no mapping exists
        const defaultMapping = {
          action: 'key_press',
          params: {
            key: swipeDirection === 'swipe_left' ? 'ArrowLeft' : 'ArrowRight'
          }
        };
        console.log('🎨 Using default swipe action:', defaultMapping);
        executeMappedAction(defaultMapping);
      }

      // Cookbook page hooks for flip controls
      try {
        if (window.cookbookActions) {
          if (swipeDirection === 'swipe_left') {
            window.cookbookActions.nextPage && window.cookbookActions.nextPage();
          } else if (swipeDirection === 'swipe_right') {
            window.cookbookActions.prevPage && window.cookbookActions.prevPage();
          }
        }
      } catch (hookErr) {
        console.warn('Page hook error:', hookErr);
      }
    }, 0);

    return true;
  };

const triggerAction = (actionLabel, confidence) => {
    const currentTime = Date.now();

    // High-level throttle between any actions (user adjustable)
    if (currentTime - lastActionTimeRef.current < cooldownMs) {
      console.log(`⏱️ Action cooldown active, skipping ${actionLabel}`);
      return false;
    }

    // Per-gesture cooldown
    const lastForGesture = lastTriggeredRef.current[actionLabel] || 0;
    if (currentTime - lastForGesture < cooldownMs) {
      console.log(`⏱️ Cooldown active for ${actionLabel}, skipping.`);
      return false;
    }
    lastTriggeredRef.current[actionLabel] = currentTime;
    recentActionsRef.current.push({ label: actionLabel, timestamp: currentTime });
    if (recentActionsRef.current.length > 30) recentActionsRef.current.shift();

    const mapping = gestureMappings[actionLabel];
    console.log(`🎯 ACTION TRIGGERED: ${actionLabel} (${(confidence * 100).toFixed(1)}% confidence)`);
    setLastTriggeredAction({ label: actionLabel, confidence, timestamp: currentTime, action: mapping?.action });
    lastActionTimeRef.current = currentTime;

    // Show initial gesture animation immediately (optimistic)
    showGestureAnimation(true, actionLabel);

    // Clear action indicator after 2 seconds
    setTimeout(() => {
      setLastTriggeredAction(null);
    }, 2000);

    // Execute mapped action asynchronously to avoid blocking UI/inference loop
    setTimeout(() => {
      const execMapping = gestureMappings[actionLabel];
      if (execMapping) {
        console.log('🎨 Executing mapped action for', actionLabel, ':', execMapping);
        if (!canTrigger(execMapping)) {
          console.log(`⏱️ Mapping cooldown/anti-spam active for ${actionLabel}`);
          showGestureAnimation(false, actionLabel);
          return;
        }
        const success = executeMappedAction(execMapping);

        // Voice feedback
        let actionDescription = actionLabel;
        if (execMapping.action === 'key_press' && execMapping.params?.key) {
          actionDescription = `${actionLabel} - ${execMapping.params.key}`;
        }
        speakAction(actionDescription);

        // Update animation based on success
        showGestureAnimation(success, actionLabel);

        // Log to demo area if available
        if (window.demoAreaActions?.logAction) {
          window.demoAreaActions.logAction(`${actionLabel} (${(confidence * 100).toFixed(1)}%)`);
        }

        // Page-specific fallbacks/hooks (non-breaking):
        try {
          // Landing page media controls
          if (window.landingMediaActions) {
            if (actionLabel === 'fist') {
              window.landingMediaActions.toggleVideo && window.landingMediaActions.toggleVideo();
            } else if (actionLabel === 'thumbs_up') {
              window.landingMediaActions.volumeUp && window.landingMediaActions.volumeUp();
            } else if (actionLabel === 'thumbs_down') {
              window.landingMediaActions.volumeDown && window.landingMediaActions.volumeDown();
            }
          }
          // Training & Demo volume control (thumbs gestures)
          if (window.trainingDemoActions) {
            if (actionLabel === 'thumbs_up') {
              window.trainingDemoActions.volumeUp && window.trainingDemoActions.volumeUp();
            } else if (actionLabel === 'thumbs_down') {
              window.trainingDemoActions.volumeDown && window.trainingDemoActions.volumeDown();
            }
          }
          // Cookbook scroll control (open_hand/fist as defaults)
          if (window.cookbookActions) {
            if (actionLabel === 'open_hand') {
              window.cookbookActions.scrollDown && window.cookbookActions.scrollDown();
            } else if (actionLabel === 'fist') {
              window.cookbookActions.scrollUp && window.cookbookActions.scrollUp();
            }
          }
        } catch (hookErr) {
          console.warn('Page hook error:', hookErr);
        }

        if (success) {
          console.log('✅ Action executed successfully');
        } else {
          console.log('❌ Action execution failed');
        }
      } else {
        console.log(`⚠️ No mapping found for gesture: ${actionLabel}`);
        showGestureAnimation(false, actionLabel);
        // Even without a mapping, try page hooks for defaults
        try {
          if (window.landingMediaActions) {
            if (actionLabel === 'fist') {
              window.landingMediaActions.toggleVideo && window.landingMediaActions.toggleVideo();
            } else if (actionLabel === 'thumbs_up') {
              window.landingMediaActions.volumeUp && window.landingMediaActions.volumeUp();
            } else if (actionLabel === 'thumbs_down') {
              window.landingMediaActions.volumeDown && window.landingMediaActions.volumeDown();
            }
          }
          if (window.trainingDemoActions) {
            if (actionLabel === 'thumbs_up') {
              window.trainingDemoActions.volumeUp && window.trainingDemoActions.volumeUp();
            } else if (actionLabel === 'thumbs_down') {
              window.trainingDemoActions.volumeDown && window.trainingDemoActions.volumeDown();
            }
          }
          if (window.cookbookActions) {
            if (actionLabel === 'open_hand') {
              window.cookbookActions.scrollDown && window.cookbookActions.scrollDown();
            } else if (actionLabel === 'fist') {
              window.cookbookActions.scrollUp && window.cookbookActions.scrollUp();
            }
          }
        } catch (hookErr) {
          console.warn('Page hook error:', hookErr);
        }
      }
    }, 0);

    return true; // scheduled
  };

  // Handle mapping changes from MappingEditor
  const handleMappingsChange = (newMappings) => {
    console.log('🔄 Gesture mappings updated:', newMappings);
    setGestureMappings(newMappings);
  };
  
  // Voice feedback function
  const speakAction = (actionText) => {
    if (!voiceFeedbackEnabled || !window.speechSynthesis) return;
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(`Action: ${actionText}`);
      utterance.rate = 1.2;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('⚠️ Voice feedback error:', error);
    }
  };
  
  // Calibration functions
  /**
   * NEUTRAL BASELINE CALIBRATION:
   * This feature allows users to record a "neutral" hand pose that serves as a reference point.
   * While we still use FEATURES normalization (relative positions, angles, distances), 
   * the neutral baseline can help identify when the hand is in a "rest" state vs. actively gesturing.
   * 
   * Usage:
   * 1. User holds their hand in a relaxed, neutral position
   * 2. System captures features for 2 seconds
   * 3. Averages the features to create a baseline
   * 4. During inference, can compare current features to baseline to determine "gesture confidence"
   * 5. Helps filter out accidental activations when hand is just resting
   */
  const startCalibration = async () => {
    if (!handModel.current || !videoRef.current) {
      alert('Hand detection not ready. Please wait for the camera to initialize.');
      return;
    }
    
    setIsCalibrating(true);
    setCalibrationProgress(0);
    
    const samples = [];
    const startTime = Date.now();
    const duration = 2000; // 2 seconds
    
    const collectSample = async () => {
      if (!isCalibrating) return;
      
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setCalibrationProgress(progress * 100);
      
      try {
        const video = videoRef.current;
        const hands = await handModel.current.estimateHands(video, false);
        
        if (hands.length > 0) {
          const landmarks = hands[0].landmarks;
          const features = flattenLandmarks(landmarks);
          if (features) {
            samples.push(Array.from(features));
          }
        }
      } catch (error) {
        console.warn('⚠️ Calibration sample error:', error);
      }
      
      if (elapsed < duration) {
        setTimeout(collectSample, 100); // Collect samples every 100ms
      } else {
        // Finish calibration
        if (samples.length > 0) {
          // Average the samples to create baseline
          const avgFeatures = new Array(42).fill(0);
          samples.forEach(sample => {
            sample.forEach((value, index) => {
              avgFeatures[index] += value;
            });
          });
          avgFeatures.forEach((sum, index) => {
            avgFeatures[index] = sum / samples.length;
          });
          
          setNeutralBaseline(avgFeatures);
          console.log(`✅ Neutral baseline calibrated with ${samples.length} samples`);
          
          // Voice feedback for calibration complete
          speakAction('Calibration complete');
        } else {
          console.warn('⚠️ No samples collected during calibration');
          alert('Calibration failed. Please ensure your hand is visible to the camera.');
        }
        
        setIsCalibrating(false);
        setCalibrationProgress(0);
      }
    };
    
    collectSample();
  };
  
  // Enhanced gesture animation
  const showGestureAnimation = (success, gesture) => {
    const animation = {
      success,
      gesture,
      timestamp: Date.now()
    };
    
    setGestureAnimation(animation);
    setTimeout(() => {
      setGestureAnimation(null);
    }, 1000);
  };

  // Real-time inference function
  const performInference = async () => {
    if (!trainedModel || !modelMetadata || !videoRef.current || !handModel.current) {
      return;
    }

    const currentTime = Date.now();
    
    // Throttle inference calls
    if (currentTime - lastInferenceTimeRef.current < INFERENCE_CONFIG.INFERENCE_INTERVAL_MS) {
      return;
    }
    
    lastInferenceTimeRef.current = currentTime;

    try {
      const video = videoRef.current;
      
      // Get hand predictions from handpose
      const hands = await handModel.current.estimateHands(video, false);
      
      if (hands.length === 0) {
        // No hands detected, clear prediction
        setCurrentPrediction(null);
        try { if (typeof onStatusChange === 'function') onStatusChange(null); } catch {}
        return;
      }

      // Use first detected hand
      const landmarks = hands[0].landmarks;
      
      // Extract features and centroid
      const features = flattenLandmarks(landmarks);
      const centroid = computeCentroid(landmarks);
      
      if (!features) {
        console.warn('⚠️ Failed to extract features for inference');
        return;
      }
      
      // Add centroid to history for swipe detection
      addToCentroidHistory(centroid);
      
      // Check for swipe gestures
      const swipeDirection = detectSwipe();
      if (swipeDirection) {
        triggerSwipeAction(swipeDirection);
        // Treat swipe as release for regular gestures
        hasResetSinceLastFireRef.current = true;
        return; // Skip regular inference when swipe is detected
      }

      // Convert to tensor and predict
      const inputTensor = tf.tensor2d([Array.from(features)], [1, 42]);
      const predictionTensor = trainedModel.predict(inputTensor);
      const probabilities = predictionTensor.dataSync();
      
      // Clean up tensors immediately to prevent memory leaks
      inputTensor.dispose();
      predictionTensor.dispose();

      // Find top prediction
      let topPredictionIndex = 0;
      let maxProbability = probabilities[0];
      
      for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxProbability) {
          maxProbability = probabilities[i];
          topPredictionIndex = i;
        }
      }

      const predictedLabel = modelMetadata.indexToLabel[topPredictionIndex];
      
      // Add to prediction window
      addToPredictionWindow(topPredictionIndex);
      
      // Update current prediction display
      const predictionInfo = {
        label: predictedLabel,
        confidence: maxProbability,
        allProbabilities: Array.from(probabilities),
        timestamp: currentTime
      };
      
      setCurrentPrediction(predictionInfo);
      try { if (typeof onStatusChange === 'function') onStatusChange(predictionInfo); } catch {}
      
      // Check for majority vote and action triggering
      const majorityVote = getMajorityVote(predictionWindowRef.current);
      
      console.log(`🔎 Prediction: ${predictedLabel} (${(maxProbability * 100).toFixed(1)}%), Window: [${predictionWindowRef.current.join(',')}]`);
      
      if (majorityVote) {
        const majorityLabel = modelMetadata.indexToLabel[majorityVote.prediction];
        console.log(`📈 Majority vote: ${majorityLabel} (${majorityVote.votes}/${majorityVote.total} votes)`);
        
        // Mark reset allowed if label changed from the last fired
        if (lastFiredLabelRef.current && majorityLabel !== lastFiredLabelRef.current) {
          hasResetSinceLastFireRef.current = true;
        }
        
        // Check if conditions are met for action trigger (using dynamic threshold)
        if (majorityVote.prediction === topPredictionIndex && 
            maxProbability >= confidenceThreshold) {
          const sameAsLast = lastFiredLabelRef.current === majorityLabel;
          const allowed = !sameAsLast || hasResetSinceLastFireRef.current;
          if (allowed) {
            const ok = triggerAction(majorityLabel, maxProbability);
            if (ok) {
              lastFiredLabelRef.current = majorityLabel;
              hasResetSinceLastFireRef.current = false;
            }
          } else {
            console.log(`🧯 Hold suppression: ${majorityLabel} not re-fired until release`);
          }
        }
      } else {
        // No majority detected: treat as release
        hasResetSinceLastFireRef.current = true;
      }
      
    } catch (error) {
      console.error('❌ Inference error:', error);
    }
  };

  // Start/stop inference loop
  const startInference = () => {
    if (!trainedModel || !modelMetadata) {
      console.warn('⚠️ No model available for inference');
      return;
    }
    
    if (isInferenceActive) {
      console.log('ℹ️ Inference already active');
      return;
    }
    
    console.log('🚀 Starting real-time inference...');
    setIsInferenceActive(true);
    
    // Reset prediction window
    predictionWindowRef.current = [];
  };

  const stopInference = () => {
    console.log('⏹️ Stopping inference...');
    setIsInferenceActive(false);
    setCurrentPrediction(null);
    predictionWindowRef.current = [];
    
    if (inferenceIntervalRef.current) {
      clearInterval(inferenceIntervalRef.current);
      inferenceIntervalRef.current = null;
    }
  };

  // Effect to manage inference loop
  useEffect(() => {
    if (isInferenceActive && trainedModel && modelMetadata) {
      // Start inference interval
      inferenceIntervalRef.current = setInterval(() => {
        performInference();
      }, INFERENCE_CONFIG.INFERENCE_INTERVAL_MS);
      
      return () => {
        if (inferenceIntervalRef.current) {
          clearInterval(inferenceIntervalRef.current);
          inferenceIntervalRef.current = null;
        }
      };
    }
  }, [isInferenceActive, trainedModel, modelMetadata]);

// Load per-user mappings once model labels are known
useEffect(() => {
  if (modelMetadata?.indexToLabel) {
    const id = getOrCreateUserId();
    setUserId(id);
    const loaded = loadMappings(modelMetadata.indexToLabel, id);
    setGestureMappings(loaded);
    // Broadcast labels so external UIs (Dashboard) can update MappingEditor labels
    try { window.dispatchEvent(new CustomEvent('vibe:model-metadata', { detail: { labels: modelMetadata.indexToLabel } })); } catch {}
  }
}, [modelMetadata]);

// Auto-start inference when model is loaded/trained
useEffect(() => {
  if (trainedModel && modelMetadata && !isInferenceActive && !isRecording) {
    console.log('🤖 Auto-starting inference with loaded model');
    startInference();
  } else if (!trainedModel && isInferenceActive) {
    console.log('🚫 Auto-stopping inference - no model available');
    stopInference();
  }
}, [trainedModel, modelMetadata, isRecording]);

// Listen for universal mapping updates and storage changes to refresh mappings in real-time
useEffect(() => {
  const reload = () => {
    try {
      if (modelMetadata?.indexToLabel && userId) {
        const fresh = loadMappings(modelMetadata.indexToLabel, userId);
        setGestureMappings(fresh);
      }
    } catch {}
  };
  const onCustom = () => reload();
  const onStorage = (e) => {
    if (e && e.key && userId && e.key.includes(`vibe_user_mappings_${userId}`)) reload();
  };
  window.addEventListener('vibe:mappings-updated', onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('vibe:mappings-updated', onCustom);
    window.removeEventListener('storage', onStorage);
  };
}, [modelMetadata, userId]);

  // Training and model management functions
  const handleTrainModel = async () => {
    try {
      setIsTraining(true);
      setTrainingProgress({ phase: 'validating' });

      console.log('🚀 Starting model training...');
      console.log('📊 Current dataset:', datasetRef.current);

      // Validate dataset first
      const validation = validateDataset(datasetRef.current);
      if (!validation.isValid) {
        throw new Error(`Cannot train model: ${validation.errors.join(', ')}`);
      }

      // Progress callback
      const onProgress = (progress) => {
        setTrainingProgress(progress);
      };

      // Epoch callback
      const onEpochEnd = async (progress) => {
        setTrainingProgress(progress);
      };

      // Train the model
      const result = await trainModel(datasetRef.current, onProgress, onEpochEnd);
      
      setTrainedModel(result.model);
      setModelMetadata(result.metadata);
      setTrainingProgress({ phase: 'completed', ...result });

      console.log('✅ Training completed successfully!');
      
      // Test the model with a sample
      if (result.metadata.indexToLabel.length > 0) {
        // Get first available sample for testing
        const firstLabel = Object.keys(datasetRef.current)[0];
        const firstSample = datasetRef.current[firstLabel][0];
        
        if (firstSample) {
          const testResult = testModelPrediction(result.model, firstSample, result.metadata.indexToLabel);
          console.log('🧪 Test prediction:', testResult);
        }
      }

    } catch (error) {
      console.error('❌ Training failed:', error);
      setTrainingProgress({ phase: 'error', error: error.message });
    } finally {
      setIsTraining(false);
    }
  };

  const handleLoadModel = async () => {
    try {
      console.log('📥 Loading saved model...');
      // Primary path: load with metadata helper (persists across reloads)
      const result = await loadModel();
      setTrainedModel(result.model);
      setModelMetadata(result.metadata);
      console.log('✅ Model loaded successfully');
    } catch (error) {
      console.warn('⚠️ Fallback: trying direct tf.loadLayersModel from IndexedDB');
      try {
        const model = await tf.loadLayersModel('indexeddb://gesture-model');
        // Attempt to recover metadata; otherwise fall back to DEFAULT_LABELS based on units
        const units = model.outputs && model.outputs[0] && model.outputs[0].shape ? model.outputs[0].shape[1] : DEFAULT_LABELS.length;
        const metadataString = localStorage.getItem('gesture-model-metadata');
        let metadata = null;
        if (metadataString) {
          metadata = JSON.parse(metadataString);
        } else {
          metadata = {
            indexToLabel: DEFAULT_LABELS.slice(0, units),
            labelToIndex: Object.fromEntries(DEFAULT_LABELS.slice(0, units).map((l, i) => [l, i])),
            numClasses: units,
            trainingStats: {},
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          };
        }
        setTrainedModel(model);
        setModelMetadata(metadata);
        console.log('✅ Model loaded from IndexedDB via fallback');
      } catch (e2) {
        console.error('❌ Failed to load model:', e2);
        alert('No saved model found. Train a model first.');
      }
    }
  };

  const handleDeleteModel = async () => {
    try {
      if (window.confirm('Are you sure you want to delete the saved model?')) {
        await deleteModel();
        setTrainedModel(null);
        setModelMetadata(null);
        setTrainingProgress(null);
        console.log('✅ Model deleted successfully');
      }
    } catch (error) {
      console.error('❌ Failed to delete model:', error);
    }
  };

  const handleTestModel = () => {
    if (!trainedModel || !modelMetadata) {
      alert('No model available. Train or load a model first.');
      return;
    }

    // Get first available sample for testing
    const labels = Object.keys(datasetRef.current);
    if (labels.length === 0) {
      alert('No data available for testing.');
      return;
    }

    const testLabel = labels[0];
    const testSample = datasetRef.current[testLabel][0];
    
    if (!testSample) {
      alert('No samples available for testing.');
      return;
    }

    try {
      const result = testModelPrediction(trainedModel, testSample, modelMetadata.indexToLabel);
      console.log('🧪 Test prediction result:', result);
      
      const message = `Test Prediction:\n\nTop prediction: ${result.topPrediction.label} (${result.topPrediction.percentage}%)\n\nAll predictions:\n${result.allPredictions.map(p => `${p.label}: ${p.percentage}%`).join('\n')}`;
      alert(message);
    } catch (error) {
      console.error('❌ Test failed:', error);
      alert(`Test failed: ${error.message}`);
    }
  };

  // Check for existing model on startup (persist across reloads)
  useEffect(() => {
    const checkForExistingModel = async () => {
      try {
        // Primary path: load with metadata
        const result = await loadModel();
        setTrainedModel(result.model);
        setModelMetadata(result.metadata);
        try { window.dispatchEvent(new CustomEvent('vibe:model-metadata', { detail: { labels: result.metadata.indexToLabel } })); } catch {}
        console.log('✅ Existing model loaded on startup');
      } catch (error) {
        // Fallback: attempt direct IndexedDB model load
        try {
          const model = await tf.loadLayersModel('indexeddb://gesture-model');
          const units = model.outputs && model.outputs[0] && model.outputs[0].shape ? model.outputs[0].shape[1] : DEFAULT_LABELS.length;
          const metadataString = localStorage.getItem('gesture-model-metadata');
          let metadata = null;
          if (metadataString) {
            metadata = JSON.parse(metadataString);
          } else {
            metadata = {
              indexToLabel: DEFAULT_LABELS.slice(0, units),
              labelToIndex: Object.fromEntries(DEFAULT_LABELS.slice(0, units).map((l, i) => [l, i])),
              numClasses: units,
              trainingStats: {},
              timestamp: new Date().toISOString(),
              version: '1.0.0'
            };
          }
          setTrainedModel(model);
          setModelMetadata(metadata);
          console.log('✅ Existing model loaded from IndexedDB via fallback');
        } catch (e2) {
          console.log('ℹ️ No existing model found');
        }
      }
    };

    if (!isLoading) {
      checkForExistingModel();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="gesture-controller loading">
        <div className="loading-message">
          <h2>Loading Gesture Controller...</h2>
          <p>Initializing TensorFlow.js and handpose model...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gesture-controller error">
        <div className="error-message">
          <h2>Gesture Controller Error</h2>
          <p>{error}</p>
          {cameraPermissionDenied && (
            <div className="camera-help">
              <h3>To enable camera access:</h3>
              <ol>
                <li>Click the camera icon in your browser's address bar</li>
                <li>Select "Allow" for camera permissions</li>
                <li>Refresh this page</li>
              </ol>
              <p><strong>Alternative:</strong> Check your browser settings under Privacy & Security → Camera</p>
            </div>
          )}
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gesture-controller">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-feed"
        />
        <canvas
          ref={canvasRef}
          className="landmark-overlay"
        />
        {isRecording && (
          <div className="recording-indicator">
            🔴 Recording: {isRecording}
          </div>
        )}
        {showOverlays && currentPrediction && isInferenceActive && (
          <div className="prediction-overlay">
            <div className="prediction-label">
              {currentPrediction.label}
            </div>
            <div className="prediction-confidence">
              {(currentPrediction.confidence * 100).toFixed(1)}%
            </div>
          </div>
        )}
        {showOverlays && lastTriggeredAction && (
          <div className="action-indicator">
            ⚡ {lastTriggeredAction.label} → {lastTriggeredAction.action || '...'} @ {new Date(lastTriggeredAction.timestamp).toLocaleTimeString()}
          </div>
        )}
        {showOverlays && swipeAnimation && (
          <div className="swipe-animation">
            <div className={`swipe-arrow ${swipeAnimation.direction}`}>
              {swipeAnimation.direction === 'swipe_left' ? '←' : '→'}
            </div>
            <div className="swipe-label">
              {swipeAnimation.direction.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        )}
        
        {showOverlays && gestureAnimation && (
          <div className="gesture-animation">
            <div className={`gesture-icon ${gestureAnimation.success ? 'success' : 'failure'}`}>
              {gestureAnimation.success ? '✓' : '✗'}
            </div>
            <div className="gesture-name">
              {gestureAnimation.gesture}
            </div>
          </div>
        )}
        
        {/* Confidence Meter */}
        {showOverlays && currentPrediction && isInferenceActive && (
          <div className="confidence-meter">
            <div className="confidence-label">Confidence</div>
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ 
                  width: `${Math.round(currentPrediction.confidence * 100)}%`,
                  backgroundColor: currentPrediction.confidence >= confidenceThreshold ? '#10b981' : '#f59e0b'
                }}
              >
                <span className="confidence-text">
                  {Math.round(currentPrediction.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Calibration Progress */}
        {showOverlays && enableCalibration && isCalibrating && (
          <div className="calibration-overlay">
            <div className="calibration-content">
              <div className="calibration-icon">🤚</div>
              <div className="calibration-text">Hold neutral position</div>
              <div className="calibration-progress">
                <div 
                  className="calibration-fill"
                  style={{ width: `${calibrationProgress}%` }}
                ></div>
              </div>
              <div className="calibration-percentage">
                {Math.round(calibrationProgress)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {mode === 'full' && (
        <>
          <div className="data-capture-section">
            <h3>Gesture Data Collection</h3>
            <p className="capture-hint">
              Hold button for 2–5 seconds while performing the gesture at various angles
            </p>
            
            <div className="recording-controls">
              {DEFAULT_LABELS.map(label => (
                <div key={label} className="label-control">
                  <button
                    className={`record-button ${isRecording === label ? 'recording' : ''}`}
                    onMouseDown={() => startRecording(label)}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={() => startRecording(label)}
                    onTouchEnd={stopRecording}
                    onTouchCancel={stopRecording}
                    onContextMenu={handleContextMenu}
                    disabled={!handModel.current}
                  >
                    📹 {label}
                  </button>
                  <div className="label-stats">
                    <span className="count">{datasetCounts[label] || 0} samples</span>
                    <button 
                      className="clear-button"
                      onClick={() => clearLabelData(label)}
                      disabled={!datasetCounts[label]}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="dataset-summary">
              <div className="summary-counts">
                {DEFAULT_LABELS.map((label, index) => (
                  <span key={label} className="count-display" title={`${datasetCounts[label] || 0} samples collected for ${label}`}>
                    <span className="label-name">{label}</span>: 
                    <span className={`count-number ${(datasetCounts[label] || 0) >= 10 ? 'sufficient' : 'insufficient'}`}>
                      {datasetCounts[label] || 0}
                    </span>
                    {index < DEFAULT_LABELS.length - 1 && ' | '}
                  </span>
                ))}
              </div>
              
              <button 
                className="export-button"
                onClick={exportDataset}
                disabled={Object.values(datasetCounts).every(count => count === 0)}
              >
                💾 Export Dataset
              </button>
              
              <button 
                className="debug-button"
                onClick={debugCurrentState}
                style={{ marginLeft: '10px', padding: '10px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                🔍 Debug
              </button>
            </div>
          </div>
          
          {/* UI Controls Section */}
          <div className="ui-controls-section">
            <h4>🎛️ Controls & Settings</h4>
            
            <div className="controls-grid">
              {/* Calibration (optional) */}
              {enableCalibration && (
                <div className="control-group">
                  <label className="control-label" title="Calibrate a neutral hand position baseline for better accuracy">
                    🤚 Neutral Calibration
                  </label>
                  <button 
                    className="calibration-button"
                    onClick={startCalibration}
                    disabled={isCalibrating || !handModel.current}
                  >
                    {isCalibrating ? 'Calibrating...' : 'Hold Neutral for 2s'}
                  </button>
                  {neutralBaseline && (
                    <span className="calibration-status">✅ Calibrated</span>
                  )}
                </div>
              )}
              
              {/* Sensitivity Controls */}
              <div className="control-group">
                <label className="control-label" title="Minimum confidence required to trigger actions (higher = more precise)">
                  🎯 Confidence Threshold: {Math.round(confidenceThreshold * 100)}%
                </label>
                <input 
                  type="range"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="sensitivity-slider"
                />
                <div className="slider-labels">
                  <span>Sensitive</span>
                  <span>Precise</span>
                </div>
              </div>
              
              <div className="control-group">
                <label className="control-label" title="Time between gesture recognitions (higher = less rapid firing)">
                  ⏱️ Cooldown: {cooldownMs}ms
                </label>
                <input 
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={cooldownMs}
                  onChange={(e) => setCooldownMs(parseInt(e.target.value))}
                  className="sensitivity-slider"
                />
                <div className="slider-labels">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>
              
              {/* Voice Feedback */}
              <div className="control-group">
                <label className="control-label" title="Speak action confirmations aloud">
                  🔊 Voice Feedback
                </label>
                <button 
                  className={`voice-toggle ${voiceFeedbackEnabled ? 'enabled' : 'disabled'}`}
                  onClick={() => {
                    setVoiceFeedbackEnabled(!voiceFeedbackEnabled);
                    if (!voiceFeedbackEnabled) {
                      speakAction('Voice feedback enabled');
                    }
                  }}
                  disabled={!window.speechSynthesis}
                >
                  {voiceFeedbackEnabled ? '🔊 ON' : '🔇 OFF'}
                </button>
                {!window.speechSynthesis && (
                  <span className="feature-unavailable">Not supported</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="training-controls">
            <h3>Model Training</h3>
            <p className="training-hint">
              Train a gesture recognition model using your captured data
            </p>
            
            {trainingProgress && (
              <div className="training-progress">
                {trainingProgress.phase === 'validating' && (
                  <div className="progress-item">
                    ⚙️ Validating dataset...
                  </div>
                )}
                
                {trainingProgress.phase === 'training' && (
                  <div className="progress-item">
                    🏋️ Training in progress...
                    {trainingProgress.epoch && (
                      <div className="epoch-progress">
                        Epoch {trainingProgress.epoch}/{trainingProgress.totalEpochs}
                      </div>
                    )}
                  </div>
                )}
                
                {trainingProgress.epoch && trainingProgress.loss && (
                  <div className="training-stats">
                    <div className="stat">
                      Loss: {trainingProgress.loss.toFixed(4)}
                    </div>
                    <div className="stat">
                      Accuracy: {((trainingProgress.accuracy || 0) * 100).toFixed(1)}%
                    </div>
                    {trainingProgress.valLoss && (
                      <div className="stat">
                        Val Loss: {trainingProgress.valLoss.toFixed(4)}
                      </div>
                    )}
                    {trainingProgress.valAccuracy && (
                      <div className="stat">
                        Val Accuracy: {(trainingProgress.valAccuracy * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}
                
                {trainingProgress.phase === 'saving' && (
                  <div className="progress-item">
                    💾 Saving model to IndexedDB...
                  </div>
                )}
                
                {trainingProgress.phase === 'completed' && (
                  <div className="progress-item success">
                    ✅ Training completed successfully!
                  </div>
                )}
                
                {trainingProgress.phase === 'error' && (
                  <div className="progress-item error">
                    ❌ Training failed: {trainingProgress.error}
                  </div>
                )}
              </div>
            )}
            
            <div className="training-controls">
              <button 
                className="train-button"
                onClick={handleTrainModel}
                disabled={isTraining || Object.values(datasetCounts).every(count => count === 0)}
              >
                {isTraining ? '⚙️ Training...' : '🏋️ Train Model'}
              </button>
              
              <button 
                className="load-button"
                onClick={handleLoadModel}
                disabled={isTraining}
              >
                📥 Load Model
              </button>
              
              <button 
                className="test-button"
                onClick={handleTestModel}
                disabled={!trainedModel || isTraining}
              >
                🧪 Test Model
              </button>
              
              <button 
                className="delete-button"
                onClick={handleDeleteModel}
                disabled={!trainedModel || isTraining}
              >
                🗑️ Delete Model
              </button>

              <button 
                className="export-model-button"
                onClick={async () => {
                  try {
                    if (!trainedModel) {
                      alert('Train or load a model first.');
                      return;
                    }
                    await trainedModel.save('downloads://gesture-model');
                    console.log('💾 Model exported via browser download');
                  } catch (err) {
                    console.error('❌ Export failed:', err);
                    alert(`Export failed: ${err.message}`);
                  }
                }}
                disabled={isTraining || !trainedModel}
                style={{ marginLeft: '10px' }}
              >
                📤 Export Model
              </button>

              <button 
                className="import-model-button"
                onClick={() => {
                  if (importInputRef.current) importInputRef.current.click();
                }}
                disabled={isTraining}
                style={{ marginLeft: '10px' }}
              >
                📥 Import Model
              </button>
              <input 
                type="file"
                ref={importInputRef}
                accept=".json,.bin"
                multiple
                style={{ display: 'none' }}
                onChange={async (e) => {
                  try {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    // Expect model.json and weight files
                    const handler = tf.io.browserFiles(files);
                    const model = await tf.loadLayersModel(handler);
                    // Attempt to reuse metadata from localStorage, else fallback
                    const units = model.outputs && model.outputs[0] && model.outputs[0].shape ? model.outputs[0].shape[1] : DEFAULT_LABELS.length;
                    const metadataString = localStorage.getItem('gesture-model-metadata');
                    let metadata = null;
                    if (metadataString) {
                      metadata = JSON.parse(metadataString);
                    } else {
                      metadata = {
                        indexToLabel: DEFAULT_LABELS.slice(0, units),
                        labelToIndex: Object.fromEntries(DEFAULT_LABELS.slice(0, units).map((l, i) => [l, i])),
                        numClasses: units,
                        trainingStats: {},
                        timestamp: new Date().toISOString(),
                        version: '1.0.0'
                      };
                    }
                    setTrainedModel(model);
                    setModelMetadata(metadata);
                    setIsInferenceActive(false);
                    predictionWindowRef.current = [];
                    console.log('✅ Imported model loaded');
                    // Optional: persist imported model into IndexedDB for future sessions
                    try {
                      await model.save('indexeddb://gesture-model');
                      localStorage.setItem('gesture-model-metadata', JSON.stringify(metadata));
                      console.log('💾 Imported model persisted to IndexedDB');
                    } catch (persistErr) {
                      console.warn('⚠️ Could not persist imported model:', persistErr);
                    }
                  } catch (err) {
                    console.error('❌ Import failed:', err);
                    alert(`Import failed: ${err.message}`);
                  } finally {
                    if (e.target) e.target.value = '';
                  }
                }}
              />
            </div>
            
            <div className="inference-controls">
              <button 
                className={`inference-button ${isInferenceActive ? 'active' : ''}`}
                onClick={isInferenceActive ? stopInference : startInference}
                disabled={!trainedModel || isTraining}
              >
                {isInferenceActive ? '⏹️ Stop Inference' : '🚀 Start Inference'}
              </button>
              
              {isInferenceActive && (
                <div className="inference-status">
                  🟢 Real-time inference active
                </div>
              )}
            </div>
            
            {modelMetadata && (
              <div className="model-info">
                <h4>Current Model Info</h4>
                <div className="model-stats">
                  <div>Classes: {modelMetadata.numClasses}</div>
                  <div>Labels: {modelMetadata.indexToLabel.join(', ')}</div>
                  <div>Trained: {new Date(modelMetadata.timestamp).toLocaleString()}</div>
                  <div>Training Data: {Object.entries(modelMetadata.trainingStats)
                    .filter(([key]) => key !== 'total' && key !== 'labels')
                    .map(([label, count]) => `${label}: ${count}`)
                    .join(', ')}</div>
                </div>
              </div>
            )}
          </div>

          {showMappingEditor && (
            <MappingEditor 
              labels={modelMetadata ? modelMetadata.indexToLabel : []}
              onMappingsChange={handleMappingsChange}
              userId={userId}
            />
          )}

          <div className="info">
            <p>Show your hands to the camera to see landmark detection in action!</p>
            <p>Blue dots will appear on detected hand landmarks (21 points per hand).</p>
            <p>Red dot shows the centroid of your hand.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default GestureController;
