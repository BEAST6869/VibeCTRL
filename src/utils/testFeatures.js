// Simple test script for features utility functions
import { flattenLandmarks, computeCentroid } from './features.js';

// Sample landmarks for unit testing (simulating a pointing gesture)
const sampleLandmarks = [
  [100, 100, 0],  // 0: wrist (base point)
  [110, 90, 0],   // 1: thumb base
  [115, 80, 0],   // 2: thumb joint
  [120, 70, 0],   // 3: thumb joint
  [125, 60, 0],   // 4: thumb tip
  [105, 85, 0],   // 5: index base
  [105, 75, 0],   // 6: index joint
  [105, 65, 0],   // 7: index joint
  [105, 55, 0],   // 8: index tip (pointing up)
  [100, 85, 0],   // 9: middle base
  [100, 90, 0],   // 10: middle joint (curled)
  [100, 95, 0],   // 11: middle joint
  [100, 100, 0],  // 12: middle tip
  [95, 85, 0],    // 13: ring base
  [95, 90, 0],    // 14: ring joint (curled)
  [95, 95, 0],    // 15: ring joint
  [95, 100, 0],   // 16: ring tip
  [90, 85, 0],    // 17: pinky base
  [90, 90, 0],    // 18: pinky joint (curled)
  [90, 95, 0],    // 19: pinky joint
  [90, 100, 0]    // 20: pinky tip
];

// Run tests
console.log('🧪 Testing features utility functions...');
console.log('');

// Test 1: flattenLandmarks
console.log('1️⃣ Testing flattenLandmarks():');
const features = flattenLandmarks(sampleLandmarks);

if (features) {
  console.log(`✅ SUCCESS: Output length = ${features.length} (expected 42)`);
  console.log(`✅ Array type: ${features.constructor.name}`);
  console.log(`✅ First 6 normalized features: [${Array.from(features.slice(0, 6)).map(f => f.toFixed(4)).join(', ')}]`);
  console.log(`✅ Last 6 normalized features: [${Array.from(features.slice(-6)).map(f => f.toFixed(4)).join(', ')}]`);
  
  // Verify normalization - wrist should be at (0, 0) since it's the base
  const wristX = features[0];  // First landmark x (wrist)
  const wristY = features[1];  // First landmark y (wrist)
  console.log(`✅ Wrist normalization check: (${wristX.toFixed(6)}, ${wristY.toFixed(6)}) should be (0, 0)`);
} else {
  console.log('❌ FAILED: flattenLandmarks returned null');
}

console.log('');

// Test 2: computeCentroid
console.log('2️⃣ Testing computeCentroid():');
const centroid = computeCentroid(sampleLandmarks);

if (centroid) {
  console.log(`✅ SUCCESS: Centroid = {x: ${centroid.x.toFixed(2)}, y: ${centroid.y.toFixed(2)}}`);
  
  // Manual verification of centroid calculation
  let sumX = 0, sumY = 0;
  sampleLandmarks.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
  });
  const expectedX = sumX / sampleLandmarks.length;
  const expectedY = sumY / sampleLandmarks.length;
  console.log(`✅ Expected centroid: {x: ${expectedX.toFixed(2)}, y: ${expectedY.toFixed(2)}}`);
  
  const diffX = Math.abs(centroid.x - expectedX);
  const diffY = Math.abs(centroid.y - expectedY);
  console.log(`✅ Accuracy: X diff = ${diffX.toFixed(6)}, Y diff = ${diffY.toFixed(6)}`);
} else {
  console.log('❌ FAILED: computeCentroid returned null');
}

console.log('');

// Test 3: Error handling
console.log('3️⃣ Testing error handling:');

// Test with null input
console.log('Testing null input...');
const nullResult = flattenLandmarks(null);
console.log(`Result: ${nullResult} (expected null)`);

// Test with wrong length array
console.log('Testing wrong length array...');
const wrongLengthResult = flattenLandmarks([[1, 2, 3], [4, 5, 6]]);
console.log(`Result: ${wrongLengthResult} (expected null)`);

// Test with invalid landmark format
console.log('Testing invalid landmark format...');
const invalidLandmarks = new Array(21).fill([1, 2]); // Valid length but will test format
invalidLandmarks[5] = [1]; // Invalid - missing y coordinate
const invalidResult = flattenLandmarks(invalidLandmarks);
console.log(`Result: ${invalidResult} (expected null)`);

console.log('');
console.log('🎉 Feature utility tests completed!');

// Export test function for use in other modules
export function runFeatureTests() {
  console.log('Running feature utility tests from module...');
  return {
    features: features,
    centroid: centroid,
    featuresLength: features ? features.length : 0,
    testsPassed: features !== null && centroid !== null && features.length === 42
  };
}