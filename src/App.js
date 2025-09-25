import React from 'react';
import GestureController from './components/GestureController';
import DemoArea from './components/DemoArea';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Vibe Gesture Controller</h1>
        <p>Real-time hand landmark detection using TensorFlow.js</p>
      </header>
      <main className="App-main">
        <GestureController />
        <DemoArea />
      </main>
    </div>
  );
}

export default App;
