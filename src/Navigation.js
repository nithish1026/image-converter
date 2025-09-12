import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-logo">🔧 Media Converter</h1>
        <div className="nav-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            🖼️ Image Converter
          </Link>
          <Link 
            to="/video-to-gif" 
            className={location.pathname === '/video-to-gif' ? 'nav-link active' : 'nav-link'}
          >
            🎬 Video to GIF
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
