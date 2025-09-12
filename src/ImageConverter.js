import React, { useState } from "react";
import imageCompression from 'browser-image-compression';
import './ImageConverter.css';

const ImageConverter = () => {
  const [image, setImage] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("png");
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalFileSize, setOriginalFileSize] = useState(0);
  const [convertedFileSize, setConvertedFileSize] = useState(0);
  const [originalFile, setOriginalFile] = useState(null);

  // Supported formats
  const formats = [
    { value: "png", label: "PNG", lossless: true },
    { value: "jpeg", label: "JPG/JPEG", lossless: false },
    { value: "webp", label: "WEBP", lossless: false },
    { value: "bmp", label: "BMP", lossless: true }
  ];

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate file size from data URL
  const getFileSizeFromDataUrl = (dataUrl) => {
    const base64String = dataUrl.split(',')[1];
    const stringLength = base64String.length;
    const padding = (base64String.match(/=/g) || []).length;
    return (stringLength * 0.75) - padding;
  };

  // Handle file selection
  const handleFileChange = (file) => {
    if (file) {
      setOriginalFile(file);
      setOriginalFileSize(file.size);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setConvertedUrl(null);
        setConvertedFileSize(0);
      };
      reader.readAsDataURL(file);
    }
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

        // Smart compression based on format
        let quality = 1.0;
        const currentFormat = formats.find(f => f.value === selectedFormat);
        
        if (selectedFormat === 'jpeg') {
          quality = compressionEnabled ? compressionQuality : 0.9;
        } else if (selectedFormat === 'webp') {
          quality = compressionEnabled ? compressionQuality : 0.8;
        }

        const converted = canvas.toDataURL(`image/${selectedFormat}`, quality);
        
        // Advanced compression for supported formats (not for lossless formats like PNG, BMP)
        if (compressionEnabled && !currentFormat?.lossless && (selectedFormat === 'jpeg' || selectedFormat === 'webp')) {
          try {
            const response = await fetch(converted);
            const blob = await response.blob();
            const file = new File([blob], `converted.${selectedFormat}`, { type: `image/${selectedFormat}` });
            
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              initialQuality: compressionQuality,
              fileType: `image/${selectedFormat}`
            };
            
            const compressedFile = await imageCompression(file, options);
            const compressedUrl = await imageCompression.getDataUrlFromFile(compressedFile);
            setConvertedUrl(compressedUrl);
            setConvertedFileSize(compressedFile.size);
          } catch (compressionError) {
            console.log('Compression failed, using standard conversion:', compressionError);
            setConvertedUrl(converted);
            setConvertedFileSize(getFileSizeFromDataUrl(converted));
          }
        } else {
          setConvertedUrl(converted);
          setConvertedFileSize(getFileSizeFromDataUrl(converted));
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

  // Calculate compression percentage
  const getCompressionPercentage = () => {
    if (originalFileSize && convertedFileSize) {
      const reduction = ((originalFileSize - convertedFileSize) / originalFileSize) * 100;
      return reduction > 0 ? reduction.toFixed(1) : 0;
    }
    return 0;
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

        {/* File Upload Area */}
        <div 
          className={`file-upload-area ${dragOver ? "drag-over" : ""}`}
          onClick={() => document.getElementById('file-input').click()}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">Drag & drop your image here</div>
          <div className="upload-subtext">or click to browse files</div>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />
        </div>

        {image && (
          <div className="preview">
            <h3>Original Image</h3>
            <img src={image} alt="Uploaded" />
            <div className="file-info">
              <p><strong>File Size:</strong> {formatFileSize(originalFileSize)}</p>
              {originalFile && (
                <p><strong>Format:</strong> {originalFile.type.split('/')[1].toUpperCase()}</p>
              )}
            </div>
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
                  disabled={formats.find(f => f.value === selectedFormat)?.lossless}
                />
                Enable Compression
                {formats.find(f => f.value === selectedFormat)?.lossless && (
                  <span className="disabled-text"> (Not available for lossless formats)</span>
                )}
              </label>
              
              {compressionEnabled && !formats.find(f => f.value === selectedFormat)?.lossless && (
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
            <div className="file-info">
              <p><strong>New Size:</strong> {formatFileSize(convertedFileSize)}</p>
              <p><strong>Format:</strong> {selectedFormat.toUpperCase()}</p>
              
              {(() => {
                const compressionPercentage = getCompressionPercentage();
                const originalFormat = originalFile?.type.split('/')[1].toUpperCase();
                const isLosslessConversion = formats.find(f => f.value === selectedFormat)?.lossless;
                
                if (compressionPercentage > 0) {
                  return (
                    <p className="compression-info">
                      <strong>Size Reduced by:</strong> {compressionPercentage}%
                    </p>
                  );
                } else if ((originalFormat === 'JPEG' || originalFormat === 'WEBP') && isLosslessConversion) {
                  return (
                    <p className="format-info">
                      <strong>Note:</strong> {originalFormat}→{selectedFormat.toUpperCase()} increases size for better quality (lossless)
                    </p>
                  );
                } else if (compressionPercentage < 0) {
                  return (
                    <p className="size-increase-info">
                      <strong>Note:</strong> File size increased due to format conversion
                    </p>
                  );
                }
                return null;
              })()}
            </div>
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
};

export default ImageConverter;
