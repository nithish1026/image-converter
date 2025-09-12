import React, { useState, useRef } from 'react';
import gifshot from 'gifshot';
import './gif.css';

const VideoToGifConverter = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(3);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gifUrl, setGifUrl] = useState('');
  const [gifSize, setGifSize] = useState(0);
  
  const videoRef = useRef(null);

  // Handle video file selection
  const handleVideoUpload = (file) => {
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setGifUrl(''); // Reset previous GIF
    }
  };

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    const duration = videoRef.current.duration;
    setVideoDuration(duration);
    setStartTime(0);
    setEndTime(Math.min(3, duration));
  };

  // Update end time when start time changes (ensure max 3 seconds)
  const handleStartTimeChange = (newStartTime) => {
    setStartTime(newStartTime);
    const maxEndTime = Math.min(newStartTime + 3, videoDuration);
    setEndTime(maxEndTime);
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert video segment to high-quality 20 FPS animated GIF
  const convertToGif = async () => {
    if (!videoFile || !videoRef.current) return;

    setIsConverting(true);
    setProgress(0);

    try {
      const video = videoRef.current;
      const duration = endTime - startTime;
      
      // High-quality 20 FPS settings
      const fps = 20; // Smooth 20 FPS
      const frameCount = Math.floor(duration * fps);
      const frameInterval = duration / frameCount;
      const frames = [];
      
      // Variables to store canvas dimensions
      let canvasWidth = 480;
      let canvasHeight = 360;

      console.log(`Creating ${frameCount} frames at ${fps} FPS for ${duration}s duration`);

      // Capture frames at high frame rate
      for (let i = 0; i < frameCount; i++) {
        const time = startTime + (i * frameInterval);
        const frameCanvas = document.createElement('canvas');
        const ctx = frameCanvas.getContext('2d');
        
        // High-quality canvas settings
        const maxWidth = 480; // Good quality size
        const maxHeight = 360;
        const videoAspectRatio = video.videoWidth / video.videoHeight;
        
        if (videoAspectRatio > 1) {
          frameCanvas.width = maxWidth;
          frameCanvas.height = maxWidth / videoAspectRatio;
        } else {
          frameCanvas.height = maxHeight;
          frameCanvas.width = maxHeight * videoAspectRatio;
        }

        // Store dimensions for GIF creation
        canvasWidth = frameCanvas.width;
        canvasHeight = frameCanvas.height;

        // Seek to specific time and capture frame
        await new Promise((resolve) => {
          video.currentTime = time;
          video.onseeked = () => {
            // High-quality frame capture
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
            frames.push(frameCanvas.toDataURL('image/png', 0.9)); // High quality PNG
            setProgress((frames.length / frameCount) * 70); // 70% for frame capture
            resolve();
          };
        });

        // Small delay for browser processing
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      console.log(`Captured ${frames.length} frames, creating high-quality GIF...`);

      // Create smooth 20 FPS GIF
      gifshot.createGIF({
        images: frames,
        gifWidth: canvasWidth,
        gifHeight: canvasHeight,
        interval: 0.05, // 50ms between frames (20 FPS = 1/20 = 0.05)
        numFrames: frameCount,
        frameDuration: 2, // Each frame shows for 50ms for smooth animation
        fontWeight: 'normal',
        fontSize: '16px',
        fontFamily: 'sans-serif',
        fontColor: '#ffffff',
        textAlign: 'center',
        textBaseline: 'bottom',
        sampleInterval: 5, // Higher sampling for better quality
        numWorkers: 4, // More workers for faster processing
        progressCallback: (captureProgress) => {
          setProgress(70 + (captureProgress * 30)); // 70-100% for GIF creation
        }
      }, (obj) => {
        if (!obj.error) {
          setGifUrl(obj.image);
          
          // Calculate file size
          const base64String = obj.image.split(',')[1];
          const sizeInBytes = (base64String.length * 0.75);
          setGifSize(sizeInBytes);
          
          setProgress(100);
          setIsConverting(false);
          console.log('High-quality 20 FPS GIF created successfully');
        } else {
          console.error('GIF creation failed:', obj.error);
          setIsConverting(false);
          alert('GIF creation failed. Try with a shorter segment or smaller video file.');
        }
      });

    } catch (error) {
      console.error('Conversion failed:', error);
      setIsConverting(false);
      alert('Conversion failed. Please try again.');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container">
      <div className="video-to-gif-converter">
        <h2>🎬 Video to GIF Converter</h2>
        <p>Convert any video segment (max 3 seconds) to a smooth 20 FPS animated GIF</p>

        {/* Video Upload */}
        <div className="upload-section">
          <div 
            className="video-upload-area"
            onClick={() => document.getElementById('video-input').click()}
          >
            <div className="upload-icon">🎥</div>
            <div className="upload-text">Click to upload video</div>
            <div className="upload-subtext">Supports MP4, MOV, AVI, WebM (max 20MB recommended)</div>
            <input
              id="video-input"
              type="file"
              accept="video/*"
              onChange={(e) => handleVideoUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Features Info */}
        <div style={{
          background: 'linear-gradient(145deg, #e3f2fd, #bbdefb)',
          padding: '15px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #2196f3'
        }}>
          <p style={{ margin: 0, color: '#0d47a1', fontSize: '14px' }}>
            ⚡ <strong>High-Quality 20 FPS:</strong> Creates buttery-smooth animated GIFs with 20 frames per second. 
            Perfect quality for social media!
          </p>
        </div>

        {/* Video Preview and Controls */}
        {videoUrl && (
          <div className="video-section">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              className="video-preview"
            />
            
            <div className="segment-controls">
              <h3>Select 3-Second Segment</h3>
              
              <div className="time-controls">
                <div className="time-input">
                  <label>Start Time: {formatTime(startTime)}</label>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, videoDuration - 3)}
                    step="0.1"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="time-input">
                  <label>End Time: {formatTime(endTime)}</label>
                  <input
                    type="range"
                    min={startTime}
                    max={Math.min(startTime + 3, videoDuration)}
                    step="0.1"
                    value={endTime}
                    onChange={(e) => setEndTime(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="segment-info">
                <p><strong>Segment Duration:</strong> {(endTime - startTime).toFixed(1)} seconds</p>
                <p><strong>Video Duration:</strong> {formatTime(videoDuration)}</p>
                <p><strong>GIF Frames:</strong> ~{Math.floor((endTime - startTime) * 20)} frames</p>
                <p><strong>Frame Rate:</strong> 20 FPS (Smooth)</p>
                <p><strong>Quality:</strong> High (480px max width)</p>
              </div>

              <button 
                className="convert-btn"
                onClick={convertToGif}
                disabled={isConverting || (endTime - startTime) < 0.3}
              >
                {isConverting ? `Converting... ${progress.toFixed(0)}%` : 'Convert to 20 FPS GIF'}
              </button>
              
              {(endTime - startTime) < 0.3 && (
                <p style={{ color: '#e74c3c', fontSize: '14px', marginTop: '10px' }}>
                  Minimum segment duration is 0.3 seconds for 20 FPS
                </p>
              )}
            </div>
          </div>
        )}

        {/* GIF Result */}
        {gifUrl && (
          <div className="gif-result">
            <h3>Generated 20 FPS Smooth GIF</h3>
            <img src={gifUrl} alt="Generated 20 FPS GIF" className="gif-preview" />
            <div className="gif-info">
              <p><strong>File Size:</strong> {formatFileSize(gifSize)}</p>
              <p><strong>Duration:</strong> {(endTime - startTime).toFixed(1)} seconds</p>
              <p><strong>Frame Rate:</strong> 20 FPS (Buttery Smooth)</p>
              <p><strong>Quality:</strong> High Definition</p>
              <p><strong>Total Frames:</strong> {Math.floor((endTime - startTime) * 20)}</p>
            </div>
            <a
              href={gifUrl}
              download="smooth-20fps.gif"
              className="download-btn"
            >
              Download 20 FPS GIF
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoToGifConverter;
