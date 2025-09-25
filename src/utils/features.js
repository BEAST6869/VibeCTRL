/**
 * Utility functions for processing hand landmarks and extracting normalized features.
 */

/**
 * Converts LANDMARKS to normalized flattened FEATURES vector.
 * 
 * @param {Array} landmarks - Array of 21 landmarks where each item is [x, y, z]
 * @returns {Array|null} - Float32Array of length 42 (21 * 2) or null if invalid input
 */
export function flattenLandmarks(landmarks) {
  // Validate input
  if (!landmarks || !Array.isArray(landmarks)) {
    console.error('flattenLandmarks: landmarks must be an array');
    return null;
  }
  
  if (landmarks.length !== 21) {
    console.error(`flattenLandmarks: Expected 21 landmarks, got ${landmarks.length}`);
    return null;
  }
  
  // Validate each landmark has at least x, y coordinates
  for (let i = 0; i < landmarks.length; i++) {
    if (!Array.isArray(landmarks[i]) || landmarks[i].length < 2) {
      console.error(`flattenLandmarks: Invalid landmark at index ${i}, expected [x, y, z] format`);
      return null;
    }
  }
  
  try {
    // 1. Get wrist (landmark 0) as base/origin
    const baseX = landmarks[0][0];
    const baseY = landmarks[0][1];
    
    // 2. Compute bounding box over all landmarks
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (let i = 0; i < landmarks.length; i++) {
      const x = landmarks[i][0];
      const y = landmarks[i][1];
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    
    // 3. Compute box size (prevent division by zero)
    const boxSize = Math.max(maxX - minX, maxY - minY, 1e-6);
    
    // 4. Create flattened normalized features array
    const flat = [];
    
    for (let i = 0; i < landmarks.length; i++) {
      const x = landmarks[i][0];
      const y = landmarks[i][1];
      
      // Normalize relative to wrist and scale by box size
      const normalizedX = (x - baseX) / boxSize;
      const normalizedY = (y - baseY) / boxSize;
      
      flat.push(normalizedX);
      flat.push(normalizedY);
    }
    
    // Return as Float32Array for better performance
    return new Float32Array(flat);
    
  } catch (error) {
    console.error('flattenLandmarks: Error processing landmarks:', error);
    return null;
  }
}

/**
 * Computes the centroid (average position) of all landmarks.
 * Used for motion detection and gesture normalization.
 * 
 * @param {Array} landmarks - Array of 21 landmarks where each item is [x, y, z]
 * @returns {Object|null} - {x: avgX, y: avgY} or null if invalid input
 */
export function computeCentroid(landmarks) {
  // Validate input
  if (!landmarks || !Array.isArray(landmarks)) {
    console.error('computeCentroid: landmarks must be an array');
    return null;
  }
  
  if (landmarks.length !== 21) {
    console.error(`computeCentroid: Expected 21 landmarks, got ${landmarks.length}`);
    return null;
  }
  
  // Validate each landmark has at least x, y coordinates
  for (let i = 0; i < landmarks.length; i++) {
    if (!Array.isArray(landmarks[i]) || landmarks[i].length < 2) {
      console.error(`computeCentroid: Invalid landmark at index ${i}, expected [x, y, z] format`);
      return null;
    }
  }
  
  try {
    let sumX = 0;
    let sumY = 0;
    
    // Sum all x and y coordinates
    for (let i = 0; i < landmarks.length; i++) {
      sumX += landmarks[i][0];
      sumY += landmarks[i][1];
    }
    
    // Calculate averages
    const avgX = sumX / landmarks.length;
    const avgY = sumY / landmarks.length;
    
    return { x: avgX, y: avgY };
    
  } catch (error) {
    console.error('computeCentroid: Error processing landmarks:', error);
    return null;
  }
}

// Unit test examples and validation
if (typeof window !== 'undefined' && window.console) {
  // Sample landmarks for testing (simplified positions)
  const sampleLandmarks = [
    [100, 100, 0],  // 0: wrist
    [110, 90, 0],   // 1: thumb base
    [115, 80, 0],   // 2: thumb joint
    [120, 70, 0],   // 3: thumb joint
    [125, 60, 0],   // 4: thumb tip
    [105, 85, 0],   // 5: index base
    [105, 75, 0],   // 6: index joint
    [105, 65, 0],   // 7: index joint
    [105, 55, 0],   // 8: index tip
    [100, 85, 0],   // 9: middle base
    [100, 75, 0],   // 10: middle joint
    [100, 65, 0],   // 11: middle joint
    [100, 55, 0],   // 12: middle tip
    [95, 85, 0],    // 13: ring base
    [95, 75, 0],    // 14: ring joint
    [95, 65, 0],    // 15: ring joint
    [95, 55, 0],    // 16: ring tip
    [90, 85, 0],    // 17: pinky base
    [90, 80, 0],    // 18: pinky joint
    [90, 75, 0],    // 19: pinky joint
    [90, 70, 0]     // 20: pinky tip
  ];
  
  // Test flattenLandmarks
  const features = flattenLandmarks(sampleLandmarks);
  if (features) {
    console.log(`✅ flattenLandmarks test: Output length = ${features.length} (expected 42)`);
    console.log(`✅ Features array type: ${features.constructor.name}`);
    console.log(`✅ First few features: [${Array.from(features.slice(0, 6)).map(f => f.toFixed(3)).join(', ')}]`);
  }
  
  // Test computeCentroid
  const centroid = computeCentroid(sampleLandmarks);
  if (centroid) {
    console.log(`✅ computeCentroid test: Centroid = {x: ${centroid.x.toFixed(2)}, y: ${centroid.y.toFixed(2)}}`);
  }
  
  // Test error handling
  console.log(`❌ Error handling test - invalid input:`, flattenLandmarks(null));
  console.log(`❌ Error handling test - wrong length:`, flattenLandmarks([[1, 2, 3]]));
}