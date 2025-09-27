# VibeCTRL - Gesture-Based Browser Controller

A full-featured gesture-based browser controller built with TensorFlow.js Handpose that allows you to control web pages using hand gestures.

## Features

### Gesture Mappings
- **Open Hand** → Scroll page down
- **Fist** → Play/pause media elements (video/audio)
- **Thumbs Up** → Increase volume
- **Thumbs Down** → Decrease volume
- **Peace Sign** → Switch to next browser tab
- **Pointing** → Click elements by CSS selector
- **Hand Swipe Left/Right** → Navigate slides or trigger custom actions

### Advanced Features
- **Configurable Shortcuts**: Remap gestures to any action
- **Smooth, Low-Latency Detection**: Real-time gesture recognition
- **Multiple Media Support**: Control all video/audio elements on a page
- **Cross-Browser Support**: Works with Chrome, Edge, and Firefox
- **Visual Feedback**: Real-time gesture detection and action confirmation
- **Custom Gesture Training**: Train your own gestures using in-browser transfer learning

## Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Edge, Firefox)
- Webcam or camera device
- Node.js (for development)

### Installation

1. **Clone or Download the Project**
   ```bash
   git clone <repository-url>
   cd VibeCTRL
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm start
   ```

4. **Open in Browser**
   - Navigate to `http://localhost:3000`
   - Allow camera permissions when prompted

### Production Build

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Serve the Build**
   ```bash
   npx serve -s build
   ```

## Usage Guide

### 1. Initial Setup

1. **Grant Camera Permissions**
   - Click "Allow" when prompted for camera access
   - Ensure good lighting and clear view of your hands

2. **Calibrate Neutral Position** (Optional)
   - Click "Hold Neutral for 2s" button
   - Hold your hand in a relaxed, neutral position
   - This helps improve gesture recognition accuracy

### 2. Training Your Gestures

1. **Collect Training Data**
   - For each gesture, hold the record button for 2-5 seconds
   - Perform the gesture at various angles and positions
   - Aim for at least 10-20 samples per gesture for good accuracy

2. **Train the Model**
   - Click "🏋️ Train Model" after collecting data
   - Wait for training to complete (usually 30-60 seconds)
   - The model will automatically start inference when ready

3. **Test Your Gestures**
   - Perform gestures in front of the camera
   - Watch the confidence meter and prediction overlay
   - Check the action history for triggered actions

### 3. Configuring Gesture Mappings

1. **Open Mapping Editor**
   - Click "▼ Show Mappings" in the Gesture Action Mapping section
   - Configure what each gesture should do

2. **Default Mappings**
   - `open_hand` → Scroll page down
   - `fist` → Toggle video play/pause
   - `thumbs_up` → Volume up
   - `thumbs_down` → Volume down
   - `peace` → Next tab
   - `point` → Click button

3. **Customize Actions**
   - Change action types using the dropdown menus
   - Adjust parameters (scroll pixels, volume amount, etc.)
   - Save your configuration

### 4. Testing Your Setup

1. **Demo Area Testing**
   - Use the video player to test play/pause gestures
   - Test volume controls with the audio player
   - Navigate slides using left/right gestures
   - Monitor the action history for feedback

2. **Real-World Testing**
   - Try gestures on other websites
   - Test with different media elements
   - Verify tab switching works in your browser

## Troubleshooting

### Common Issues

1. **Camera Not Working**
   - Check browser permissions
   - Ensure no other applications are using the camera
   - Try refreshing the page

2. **Poor Gesture Recognition**
   - Improve lighting conditions
   - Ensure hand is clearly visible
   - Collect more training data
   - Adjust confidence threshold in settings

3. **Actions Not Triggering**
   - Check gesture mappings are configured
   - Verify confidence threshold is appropriate
   - Ensure cooldown period isn't too long
   - Check browser console for errors

4. **Media Controls Not Working**
   - Ensure media elements are present on the page
   - Check if media is muted or has autoplay restrictions
   - Try with different media sources

### Performance Optimization

1. **Reduce Latency**
   - Lower confidence threshold (but may increase false positives)
   - Reduce cooldown period
   - Ensure good lighting for faster detection

2. **Improve Accuracy**
   - Collect more diverse training data
   - Use neutral calibration
   - Increase confidence threshold
   - Train with different hand positions

## Browser Compatibility

### Supported Browsers
- **Chrome** (Recommended) - Full support
- **Edge** - Full support
- **Firefox** - Full support
- **Safari** - Limited support (some features may not work)

### Required Features
- WebRTC (for camera access)
- WebGL (for TensorFlow.js)
- ES6+ JavaScript support

## Advanced Configuration

### Custom Gesture Training

1. **Add New Gesture Labels**
   - Edit `src/constants.js`
   - Add new labels to `DEFAULT_LABELS` array
   - Restart the application

2. **Custom Action Types**
   - Add new actions to `src/utils/actions.js`
   - Implement execution logic
   - Update the mapping editor

3. **Model Export/Import**
   - Export trained models for reuse
   - Import pre-trained models
   - Share models between devices

## Security Considerations

- Camera access is required and handled securely
- No data is sent to external servers
- All processing happens locally in the browser
- Models and data are stored locally in IndexedDB

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── GestureController.jsx
│   ├── DemoArea.jsx
│   └── MappingEditor.jsx
├── utils/              # Utility functions
│   ├── actions.js      # Action execution
│   └── features.js     # Feature extraction
├── ml/                 # Machine learning
│   └── train.js        # Model training
└── constants.js        # Configuration
```

### Key Technologies
- **React** - UI framework
- **TensorFlow.js** - Machine learning
- **Handpose** - Hand landmark detection
- **WebRTC** - Camera access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Ensure all prerequisites are met
4. Create an issue with detailed information

---

**Happy Gesturing! 🎉**
