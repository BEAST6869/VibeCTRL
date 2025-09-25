import * as tf from '@tensorflow/tfjs';
import { DEFAULT_LABELS } from '../constants';

/**
 * Training configuration
 */
export const TRAINING_CONFIG = {
  epochs: 25,
  batchSize: 32,
  learningRate: 0.001,
  validationSplit: 0.2,
  shuffle: true,
  minSamplesPerLabel: 10,
  recommendedSamplesPerLabel: 50,
  maxSamplesPerLabel: 200
};

/**
 * Validates the dataset before training
 * @param {Object} dataset - Dataset object with labels as keys and arrays of features as values
 * @returns {Object} Validation result with isValid flag and messages
 */
export function validateDataset(dataset) {
  const validation = {
    isValid: true,
    warnings: [],
    errors: [],
    stats: {}
  };

  const labels = Object.keys(dataset);
  
  if (labels.length < 2) {
    validation.isValid = false;
    validation.errors.push('Need at least 2 different gesture labels to train a classifier.');
    return validation;
  }

  let totalSamples = 0;
  labels.forEach(label => {
    const samples = dataset[label] || [];
    const count = samples.length;
    totalSamples += count;
    validation.stats[label] = count;

    if (count < TRAINING_CONFIG.minSamplesPerLabel) {
      validation.isValid = false;
      validation.errors.push(`Label "${label}" has only ${count} samples. Need at least ${TRAINING_CONFIG.minSamplesPerLabel}.`);
    } else if (count < TRAINING_CONFIG.recommendedSamplesPerLabel) {
      validation.warnings.push(`Label "${label}" has ${count} samples. Recommend ${TRAINING_CONFIG.recommendedSamplesPerLabel}-${TRAINING_CONFIG.maxSamplesPerLabel} for better accuracy.`);
    }

    // Validate feature dimensions
    if (count > 0) {
      const firstFeature = samples[0];
      if (!Array.isArray(firstFeature) || firstFeature.length !== 42) {
        validation.isValid = false;
        validation.errors.push(`Label "${label}" has invalid feature dimensions. Expected 42, got ${firstFeature?.length || 'undefined'}.`);
      }
    }
  });

  validation.stats.total = totalSamples;
  validation.stats.labels = labels.length;

  if (totalSamples < 50) {
    validation.warnings.push(`Dataset is quite small (${totalSamples} total samples). Consider collecting more data for better model performance.`);
  }

  return validation;
}

/**
 * Prepares training data from the dataset
 * @param {Object} dataset - Dataset object with labels as keys and arrays of features as values
 * @returns {Object} Prepared training data with features and labels tensors
 */
export function prepareTrainingData(dataset) {
  console.log('📊 Preparing training data...');
  
  const labels = Object.keys(dataset);
  const labelToIndex = {};
  labels.forEach((label, index) => {
    labelToIndex[label] = index;
  });

  const X_array = [];
  const y_array = [];

  // Collect all samples
  labels.forEach(label => {
    const samples = dataset[label] || [];
    const labelIndex = labelToIndex[label];
    
    samples.forEach(features => {
      X_array.push(features);
      y_array.push(labelIndex);
    });
  });

  console.log(`📈 Prepared ${X_array.length} samples across ${labels.length} classes`);
  console.log('🏷️ Label mapping:', labelToIndex);

  // Convert to tensors
  const xs = tf.tensor2d(X_array, [X_array.length, 42]);
  const ys = tf.oneHot(tf.tensor1d(y_array, 'int32'), labels.length);

  return {
    xs,
    ys,
    labelToIndex,
    indexToLabel: labels,
    numSamples: X_array.length,
    numClasses: labels.length
  };
}

/**
 * Creates the gesture classification model
 * @param {number} numClasses - Number of gesture classes
 * @returns {tf.LayersModel} Compiled TensorFlow.js model
 */
export function createModel(numClasses) {
  console.log(`🧠 Creating model for ${numClasses} classes...`);
  
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [42],
        units: 128,
        activation: 'relu',
        name: 'dense_1'
      }),
      tf.layers.dropout({
        rate: 0.25,
        name: 'dropout_1'
      }),
      tf.layers.dense({
        units: 64,
        activation: 'relu',
        name: 'dense_2'
      }),
      tf.layers.dense({
        units: numClasses,
        activation: 'softmax',
        name: 'output'
      })
    ]
  });

  // Compile model
  model.compile({
    optimizer: tf.train.adam(TRAINING_CONFIG.learningRate),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log('✅ Model created and compiled');
  model.summary();

  return model;
}

/**
 * Training callback for progress updates
 */
class TrainingProgressCallback extends tf.Callback {
  constructor(onProgress, onEpochEnd) {
    super();
    this.onProgress = onProgress;
    this.onEpochEnd = onEpochEnd;
  }

  async onEpochEnd(epoch, logs) {
    const progress = {
      epoch: epoch + 1,
      totalEpochs: TRAINING_CONFIG.epochs,
      loss: logs.loss,
      accuracy: logs.acc || logs.accuracy,
      valLoss: logs.val_loss,
      valAccuracy: logs.val_acc || logs.val_accuracy
    };

    console.log(`📊 Epoch ${progress.epoch}/${progress.totalEpochs} - Loss: ${progress.loss.toFixed(4)}, Accuracy: ${(progress.accuracy * 100).toFixed(1)}%`);

    if (this.onEpochEnd) {
      await this.onEpochEnd(progress);
    }

    // Check for NaN loss
    if (isNaN(logs.loss)) {
      console.error('❌ Training failed: NaN loss detected');
      throw new Error('Training failed with NaN loss. Try collecting more diverse training data.');
    }
  }

  async onTrainEnd(logs) {
    console.log('🎉 Training completed!');
    if (this.onProgress) {
      this.onProgress({ phase: 'completed', logs });
    }
  }
}

/**
 * Main training function
 * @param {Object} dataset - Dataset object with labels as keys and arrays of features as values
 * @param {Function} onProgress - Progress callback function
 * @param {Function} onEpochEnd - Epoch end callback function
 * @returns {Object} Training result with model and metadata
 */
export async function trainModel(dataset, onProgress = null, onEpochEnd = null) {
  console.log('🚀 Starting gesture model training...');

  // Validate dataset
  const validation = validateDataset(dataset);
  if (!validation.isValid) {
    throw new Error(`Dataset validation failed: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Dataset warnings:', validation.warnings);
  }

  try {
    // Prepare training data
    const trainingData = prepareTrainingData(dataset);
    
    // Create model
    const model = createModel(trainingData.numClasses);

    // Set up callbacks
    const callbacks = [];
    if (onProgress || onEpochEnd) {
      callbacks.push(new TrainingProgressCallback(onProgress, onEpochEnd));
    }

    // Train model
    console.log('🏋️ Starting training...');
    if (onProgress) {
      onProgress({ phase: 'training', epoch: 0, totalEpochs: TRAINING_CONFIG.epochs });
    }

    const history = await model.fit(trainingData.xs, trainingData.ys, {
      epochs: TRAINING_CONFIG.epochs,
      batchSize: TRAINING_CONFIG.batchSize,
      validationSplit: TRAINING_CONFIG.validationSplit,
      shuffle: TRAINING_CONFIG.shuffle,
      callbacks: callbacks
    });

    // Clean up tensors
    trainingData.xs.dispose();
    trainingData.ys.dispose();

    console.log('💾 Saving model to IndexedDB...');
    if (onProgress) {
      onProgress({ phase: 'saving' });
    }

    // Save model
    await model.save('indexeddb://gesture-model');
    
    // Save label mapping
    const modelMetadata = {
      labelToIndex: trainingData.labelToIndex,
      indexToLabel: trainingData.indexToLabel,
      numClasses: trainingData.numClasses,
      trainingStats: validation.stats,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    localStorage.setItem('gesture-model-metadata', JSON.stringify(modelMetadata));

    console.log('✅ Model training completed successfully!');

    return {
      model,
      history: history.history,
      metadata: modelMetadata,
      validation
    };

  } catch (error) {
    console.error('❌ Training failed:', error);
    
    if (error.message.includes('NaN')) {
      throw new Error(`Training failed with NaN loss. This usually means:
        • Not enough training data (collect 50-200 examples per gesture)
        • Data quality issues (try recording gestures from different angles)
        • Class imbalance (ensure similar number of samples per gesture)
        
        Current data: ${JSON.stringify(validation.stats, null, 2)}`);
    }
    
    throw error;
  }
}

/**
 * Loads a previously trained model from IndexedDB
 * @returns {Object} Loaded model and metadata
 */
export async function loadModel() {
  try {
    console.log('📥 Loading model from IndexedDB...');
    
    const model = await tf.loadLayersModel('indexeddb://gesture-model');
    const metadataString = localStorage.getItem('gesture-model-metadata');
    
    if (!metadataString) {
      throw new Error('Model metadata not found');
    }
    
    const metadata = JSON.parse(metadataString);
    console.log('✅ Model loaded successfully');
    
    return { model, metadata };
  } catch (error) {
    console.error('❌ Failed to load model:', error);
    throw error;
  }
}

/**
 * Tests the model with a sample prediction
 * @param {tf.LayersModel} model - Trained model
 * @param {Array} sampleFeatures - Sample features array (length 42)
 * @param {Array} indexToLabel - Label mapping array
 * @returns {Object} Prediction result
 */
export function testModelPrediction(model, sampleFeatures, indexToLabel) {
  try {
    console.log('🧪 Testing model prediction...');
    
    // Validate input
    if (!Array.isArray(sampleFeatures) || sampleFeatures.length !== 42) {
      throw new Error(`Invalid features array. Expected length 42, got ${sampleFeatures?.length}`);
    }

    // Make prediction
    const inputTensor = tf.tensor2d([sampleFeatures], [1, 42]);
    const prediction = model.predict(inputTensor);
    const probabilities = prediction.dataSync();
    
    // Clean up
    inputTensor.dispose();
    prediction.dispose();

    // Format results
    const results = indexToLabel.map((label, index) => ({
      label,
      probability: probabilities[index],
      percentage: (probabilities[index] * 100).toFixed(1)
    }));

    // Sort by probability
    results.sort((a, b) => b.probability - a.probability);

    const topPrediction = results[0];
    console.log(`🎯 Top prediction: ${topPrediction.label} (${topPrediction.percentage}%)`);

    return {
      topPrediction,
      allPredictions: results,
      probabilities: Array.from(probabilities)
    };

  } catch (error) {
    console.error('❌ Model prediction failed:', error);
    throw error;
  }
}

/**
 * Deletes the saved model from IndexedDB
 */
export async function deleteModel() {
  try {
    console.log('🗑️ Deleting model from IndexedDB...');
    
    // Delete model
    await tf.io.removeModel('indexeddb://gesture-model');
    
    // Delete metadata
    localStorage.removeItem('gesture-model-metadata');
    
    console.log('✅ Model deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete model:', error);
    throw error;
  }
}