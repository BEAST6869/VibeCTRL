import React, { useState, useRef, useEffect } from 'react';
import './DemoArea.css';

const DemoArea = () => {
  const videoRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [actionHistory, setActionHistory] = useState([]);
  
  // Sample slides data
  const slides = [
    {
      id: 1,
      title: "Welcome to Vibe Gestures",
      content: "Real-time hand gesture recognition in your browser",
      color: "#4f46e5"
    },
    {
      id: 2,
      title: "Training Your Model",
      content: "Collect gesture data by holding the record buttons while performing different hand poses",
      color: "#7c3aed"
    },
    {
      id: 3,
      title: "Gesture Recognition",
      content: "Once trained, your gestures will control various interface elements in real-time",
      color: "#dc2626"
    },
    {
      id: 4,
      title: "Action Mapping",
      content: "Map gestures to keyboard shortcuts, navigation commands, or custom actions",
      color: "#059669"
    },
    {
      id: 5,
      title: "Demo Complete",
      content: "Use left/right gestures to navigate these slides, or try other mapped actions!",
      color: "#ea580c"
    }
  ];

  // Navigation functions that can be called by gesture actions
  const navigateSlides = (direction) => {
    const currentTime = Date.now();
    if (currentTime - lastActionTime < 1000) return; // Prevent rapid navigation
    
    setLastActionTime(currentTime);
    
    if (direction === 'next' && currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
      logAction('Next Slide');
    } else if (direction === 'prev' && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      logAction('Previous Slide');
    }
  };

  // Media control functions
  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        logAction('Play Video');
      } else {
        videoRef.current.pause();
        logAction('Pause Video');
      }
    }
  };

  const adjustVolume = (change) => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(1, videoRef.current.volume + change));
      videoRef.current.volume = newVolume;
      logAction(`Volume ${change > 0 ? 'Up' : 'Down'}: ${Math.round(newVolume * 100)}%`);
    }
  };

  // Enhanced media controls for testing
  const testMediaControls = () => {
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    const mediaElements = [...videos, ...audios];
    
    if (mediaElements.length === 0) {
      logAction('No media elements found');
      return;
    }
    
    logAction(`Found ${mediaElements.length} media element(s)`);
  };

  // Demo action logger
  const logAction = (actionName) => {
    const timestamp = new Date().toLocaleTimeString();
    const newAction = {
      id: Date.now(),
      name: actionName,
      timestamp,
      slide: currentSlide + 1
    };
    
    setActionHistory(prev => [newAction, ...prev.slice(0, 9)]); // Keep last 10 actions
  };

  // Expose navigation functions globally for gesture system
  useEffect(() => {
    window.demoAreaActions = {
      nextSlide: () => navigateSlides('next'),
      prevSlide: () => navigateSlides('prev'),
      toggleVideo,
      volumeUp: () => adjustVolume(0.1),
      volumeDown: () => adjustVolume(-0.1),
      testMediaControls,
      logAction
    };

    return () => {
      delete window.demoAreaActions;
    };
  }, [currentSlide]);

  return (
    <div className="demo-area">
      <div className="demo-header">
        <h3>🎮 Demo Area - Test Your Gestures</h3>
        <p>This area contains elements that respond to your trained gestures</p>
      </div>
      
      <div className="demo-content">
        {/* Video Player Section */}
        <div className="video-section">
          <h4>📹 Video Player</h4>
          <div className="video-container">
            <video
              ref={videoRef}
              className="demo-video"
              width="320"
              height="240"
              controls
              muted
              loop
              poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gVmlkZW88L3RleHQ+Cjwvc3ZnPg=="
            >
              <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
              <source src="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="video-info">
              <p>🎯 Map gestures to: Play/Pause, Volume Up/Down</p>
              <div className="demo-controls">
                <button 
                  className="demo-action"
                  onClick={toggleVideo}
                  title="Test video control mapping"
                >
                  🎬 Toggle Video
                </button>
                <button 
                  className="demo-action"
                  onClick={() => adjustVolume(0.1)}
                  title="Test volume up"
                >
                  🔊 Volume Up
                </button>
                <button 
                  className="demo-action"
                  onClick={() => adjustVolume(-0.1)}
                  title="Test volume down"
                >
                  🔉 Volume Down
                </button>
                <button 
                  className="demo-action"
                  onClick={testMediaControls}
                  title="Test media detection"
                >
                  🔍 Test Media
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Player Section */}
        <div className="audio-section">
          <h4>🎵 Audio Player</h4>
          <div className="audio-container">
            <audio
              ref={videoRef}
              className="demo-audio"
              controls
              loop
            >
              <source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" type="audio/wav" />
              <source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3" type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <div className="audio-info">
              <p>🎯 Test volume controls with audio element</p>
            </div>
          </div>
        </div>

        {/* Slide Deck Section */}
        <div className="slides-section">
          <h4>🖼️ Interactive Slides</h4>
          <div className="slide-container">
            <div 
              className="slide"
              style={{ backgroundColor: slides[currentSlide].color }}
            >
              <div className="slide-content">
                <h2>{slides[currentSlide].title}</h2>
                <p>{slides[currentSlide].content}</p>
                <div className="slide-indicator">
                  {currentSlide + 1} / {slides.length}
                </div>
              </div>
            </div>
            
            <div className="slide-controls">
              <button 
                className="slide-nav prev"
                onClick={() => navigateSlides('prev')}
                disabled={currentSlide === 0}
                title="Previous slide (or use left gesture)"
              >
                ← Previous
              </button>
              <div className="slide-dots">
                {slides.map((_, index) => (
                  <span
                    key={index}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
              <button 
                className="slide-nav next"
                onClick={() => navigateSlides('next')}
                disabled={currentSlide === slides.length - 1}
                title="Next slide (or use right gesture)"
              >
                Next →
              </button>
            </div>
            <p className="slide-hint">
              🎯 Map gestures to: ArrowLeft (previous), ArrowRight (next)
            </p>
          </div>
        </div>
      </div>

      {/* Action History */}
      <div className="action-history">
        <h4>📊 Recent Actions</h4>
        <div className="action-list">
          {actionHistory.length === 0 ? (
            <p className="no-actions">No actions triggered yet. Try using gestures!</p>
          ) : (
            actionHistory.map(action => (
              <div key={action.id} className="action-item">
                <span className="action-name">⚡ {action.name}</span>
                <span className="action-time">{action.timestamp}</span>
                <span className="action-slide">Slide {action.slide}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Demo Instructions */}
      <div className="demo-instructions">
        <h4>🎯 How to Test Gestures</h4>
        <ol>
          <li><strong>Train gestures:</strong> Use the data collection section to record different hand poses</li>
          <li><strong>Map actions:</strong> In the Mapping Editor, assign gestures to keyboard shortcuts like ArrowLeft/ArrowRight</li>
          <li><strong>Test here:</strong> Perform gestures to control the video and slides above</li>
          <li><strong>Monitor feedback:</strong> Watch the action history and confidence meter</li>
        </ol>
        
        <div className="suggested-mappings">
          <h5>💡 Suggested Mappings:</h5>
          <ul>
            <li><code>open_hand</code> → Scroll down (Page navigation)</li>
            <li><code>fist</code> → Toggle video (Play/Pause media)</li>
            <li><code>thumbs_up</code> → Volume up (Increase volume)</li>
            <li><code>thumbs_down</code> → Volume down (Decrease volume)</li>
            <li><code>peace</code> → Next tab (Browser navigation)</li>
            <li><code>point</code> → Click button (Element interaction)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DemoArea;