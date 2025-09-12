import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './Navigation';
import ImageConverter from './ImageConverter';
import VideoToGifConverter from './gif';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<ImageConverter />} />
          <Route path="/video-to-gif" element={<VideoToGifConverter />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
