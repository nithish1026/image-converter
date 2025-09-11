import React, { useState } from "react";
import imageCompression from 'browser-image-compression';
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("png");
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const [isProcessing, setIsProcessing] = useState(false);

  // Supported formats
  const formats = [
    { value: "png", label: "PNG" },
    { value: "jpeg", label: "JPG/JPEG" },
    { value: "webp", label: "WEBP" },
    { value: "bmp", label: "BMP" }
  ];

  // Handle file selection
  const handleFileChange = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setConvertedUrl(null); // Reset converted image
    };
    reader.readAsDataURL(file);
  };

  // Handle drag events
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Convert and optionally compress image
  const convertImage = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    
    try {
      const img = new Image();
      img.src = image;

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Convert to selected format
        let quality = selectedFormat === 'png' ? undefined : compressionQuality;
        const converted = canvas.toDataURL(`image/${selectedFormat}`, quality);
        
        // If compression is enabled and it's not PNG, compress further
        if (compressionEnabled && selectedFormat !== 'png') {
          try {
            // Convert dataURL to File object for compression
            const response = await fetch(converted);
            const blob = await response.blob();
            const file = new File([blob], `converted.${selectedFormat}`, { type: `image/${selectedFormat}` });
            
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              initialQuality: compressionQuality
            };
            
            const compressedFile = await imageCompression(file, options);
            const compressedUrl = await imageCompression.getDataUrlFromFile(compressedFile);
            setConvertedUrl(compressedUrl);
          } catch (compressionError) {
            console.log('Compression failed, using standard conversion:', compressionError);
            setConvertedUrl(converted);
          }
        } else {
          setConvertedUrl(converted);
        }
        
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Conversion failed:', error);
      setIsProcessing(false);
    }
  };

  // Get file extension for download
  const getFileExtension = (format) => {
    switch(format) {
      case 'jpeg': return 'jpg';
      default: return format;
    }
  };

  return (
    <div className="container">
      <div
        className={`card ${dragOver ? "drag-over" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <h2>🖼️ Multi-Format Image Converter</h2>
        <p>Convert between JPG, PNG, WEBP, BMP + Compression</p>

        <p>Drag & drop an image here, or click below to select</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files[0])}
        />

        {image && (
          <div className="preview">
            <h3>Original Image</h3>
            <img src={image} alt="Uploaded" />
          </div>
        )}

        {image && (
          <div className="controls">
            <div className="format-selector">
              <label>Convert to:</label>
              <select 
                value={selectedFormat} 
                onChange={(e) => setSelectedFormat(e.target.value)}
              >
                {formats.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="compression-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={compressionEnabled}
                  onChange={(e) => setCompressionEnabled(e.target.checked)}
                />
                Enable Compression
              </label>
              
              {compressionEnabled && (
                <div className="quality-slider">
                  <label>Quality: {Math.round(compressionQuality * 100)}%</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={compressionQuality}
                    onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
                  />
                </div>
              )}
            </div>

            <button 
              onClick={convertImage}
              disabled={isProcessing}
              className="convert-btn"
            >
              {isProcessing ? "Processing..." : `Convert to ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        )}

        {convertedUrl && (
          <div className="preview">
            <h3>Converted Image</h3>
            <img src={convertedUrl} alt="Converted" />
            <a
              href={convertedUrl}
              download={`converted.${getFileExtension(selectedFormat)}`}
            >
              <button className="download-btn">Download {selectedFormat.toUpperCase()}</button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
