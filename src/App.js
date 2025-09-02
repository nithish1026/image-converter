import React, { useState } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);

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

  // Convert Image
  const convertImage = (format) => {
    if (!image) return;

    const img = new Image();
    img.src = image;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const converted = canvas.toDataURL(`image/${format}`);
      setConvertedUrl(converted);
    };
  };

  return (
    <div className="container">
      <div
        className={`card ${dragOver ? "drag-over" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <h2>🖼️ JPG ↔ PNG Converter</h2>

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
          <div className="buttons">
            <button onClick={() => convertImage("png")}>Convert to PNG</button>
            <button onClick={() => convertImage("jpeg")}>Convert to JPG</button>
          </div>
        )}

        {convertedUrl && (
          <div className="preview">
            <h3>Converted Image</h3>
            <img src={convertedUrl} alt="Converted" />
            <a
              href={convertedUrl}
              download={`converted.${convertedUrl.includes("png") ? "png" : "jpg"}`}
            >
              <button>Download</button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
