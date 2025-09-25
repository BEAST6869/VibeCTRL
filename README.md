# Vibe Gestures - Real-Time Hand Gesture Recognition

A React application for real-time hand gesture recognition using TensorFlow.js, featuring custom model training, gesture mapping to system actions, and import/export capabilities.

## Features

- **Real-time hand detection** using MediaPipe Handpose
- **Custom gesture training** with data collection and model training
- **Model persistence** - models automatically save and reload across sessions
- **Import/Export models** - share trained models between devices
- **Action mapping** - map gestures to keyboard shortcuts, system commands, etc.
- **Swipe detection** - built-in left/right swipe gestures
- **Teachable Machine integration** - import models from Google's Teachable Machine

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- A webcam for gesture detection
- Modern browser with WebGL support

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd vibe-gestures
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Allow camera access** when prompted
2. **Collect gesture data** by holding the record buttons while performing gestures
3. **Train your model** once you have sufficient data (10+ samples per gesture recommended)
4. **Start inference** to begin real-time gesture recognition
5. **Configure action mappings** to trigger keyboard shortcuts or system commands

## Model Persistence

Models are automatically saved to IndexedDB after training and persist across browser sessions. You can:

- **Export models**: Download your trained model files to share or backup
- **Import models**: Load previously exported models or models from other sources
- **Delete models**: Remove saved models from browser storage

## Using Teachable Machine as Fallback

If you prefer to use Google's Teachable Machine for gesture training, follow these steps:

### Step 1: Create Your Model in Teachable Machine

1. Go to [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com)
2. Choose "Image Project" → "Standard image model"
3. Create classes for your gestures (e.g., "peace", "thumbs_up", "fist", etc.)
4. Upload images or use webcam to record gesture examples
5. Train your model in Teachable Machine

### Step 2: Export TensorFlow.js Model

1. Click "Export Model" in Teachable Machine
2. Select the "TensorFlow.js" tab
3. Choose "Download" and save the model files
4. Extract the downloaded zip file

### Step 3: Integrate with Vibe Gestures

**Option A: Import via UI (Recommended)**
1. In Vibe Gestures, click "📥 Import Model"
2. Select the `model.json` file and all `.bin` weight files from your Teachable Machine export
3. The model will load automatically

**Option B: Manual Integration**
1. Create a `public/model/` directory in your project
2. Copy `model.json` and all weight files to `public/model/`
3. Add this code to load the model:

```javascript
// Load Teachable Machine model
const model = await tf.loadGraphModel('/model/model.json');
```

**Note**: Teachable Machine models use `tf.loadGraphModel()` while custom-trained models use `tf.loadLayersModel()`. The UI import handles this automatically.

### Step 4: Update Gesture Labels

Ensure your Teachable Machine class names match the gesture labels used in the application, or update the `DEFAULT_LABELS` in `src/constants.js`.

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
**Note: This is a one-way operation!** Ejects from Create React App configuration.

## Project Structure

```
src/
├── components/
│   ├── GestureController.jsx    # Main gesture recognition component
│   └── MappingEditor.jsx        # Gesture-to-action mapping interface
├── ml/
│   └── train.js                 # Model training utilities
├── utils/
│   ├── features.js              # Hand landmark feature extraction
│   └── actions.js               # Action execution utilities
├── constants.js                 # Configuration constants
└── App.js                       # Root component
```

## Troubleshooting

- **Camera not working**: Ensure browser has camera permissions and no other apps are using the camera
- **Model won't load**: Clear browser data and retrain, or try importing a fresh model
- **Poor accuracy**: Collect more diverse training data (50-200 samples per gesture recommended)
- **Actions not triggering**: Check gesture mappings and ensure actions are properly configured

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
