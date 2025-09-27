import React, { useState } from 'react';
import BrutalCard from '../ui/brutal/BrutalCard';
import BrutalHeader from '../ui/brutal/BrutalHeader';
import Icon from '../ui/icons/Icon';

const Help = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'Welcome to VibeCTRL',
      content: 'Use this guide to learn how to train gestures and control the demo.',
      color: '#4f46e5'
    },
    {
      id: 2,
      title: 'Training Your Model',
      content: 'Collect samples for each gesture by holding the record buttons while moving your hand. Vary angles and distances.',
      color: '#7c3aed'
    },
    {
      id: 3,
      title: 'Mapping Actions',
      content: 'Open the Mapping Editor to assign gestures to actions like Toggle Video, Volume, and Arrow keys.',
      color: '#dc2626'
    },
    {
      id: 4,
      title: 'Testing Gestures',
      content: 'On the Dashboard, use the Demo Area to test playback and navigate slides with left/right gestures.',
      color: '#059669'
    },
    {
      id: 5,
      title: 'Tips',
      content: 'Increase confidence threshold for precision; use swipe gestures for quick slide navigation.',
      color: '#ea580c'
    }
  ];

  const navigateSlides = (direction) => {
    if (direction === 'next' && currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else if (direction === 'prev' && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="help-page" style={{ padding: 16 }}>
      <BrutalHeader title="Help & Guide" subtitle="Interactive walkthrough" />
      <BrutalCard offset="down" style={{ marginTop: 12 }}>
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
          <div className="slide-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12 }}>
            <button 
              className="slide-nav prev"
              onClick={() => navigateSlides('prev')}
              disabled={currentSlide === 0}
              title="Previous slide"
            >
              ← Previous
            </button>
            <div className="slide-dots" style={{ display: 'flex', gap: 6 }}>
              {slides.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  style={{ width: 10, height: 10, borderRadius: '50%', background: index === currentSlide ? '#111' : '#bbb', cursor: 'pointer' }}
                />
              ))}
            </div>
            <button 
              className="slide-nav next"
              onClick={() => navigateSlides('next')}
              disabled={currentSlide === slides.length - 1}
              title="Next slide"
            >
              Next →
            </button>
          </div>
          <p className="slide-hint" style={{ marginTop: 8 }}>
            <Icon name="target" size={16} /> Tip: Map left/right gestures to ArrowLeft/ArrowRight for slide control.
          </p>
        </div>
      </BrutalCard>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className="demo-action" onClick={() => window.location.assign('/dashboard')}>
          <Icon name="start" size={16} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Help;