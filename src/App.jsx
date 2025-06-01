import React, { useState, useRef, useCallback } from 'react';
import './App.css';

function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [hexValue, setHexValue] = useState('');
  const [rgbValue, setRgbValue] = useState('');
  const [hslValue, setHslValue] = useState('');
  const [pickedColor, setPickedColor] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isPickerSupported, setIsPickerSupported] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const fileInputRef = useRef(null);

  // Check if EyeDropper is supported
  React.useEffect(() => {
    setIsPickerSupported('EyeDropper' in window);
  }, []);

  // Handle file processing
  const processFile = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        setShowResult(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Convert hex to RGB and HSL
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b, string: `rgb(${r}, ${g}, ${b})` };
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      string: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    };
  };

  // Handle color picking
  const handleColorPick = async () => {
    if (!isPickerSupported) {
      alert("Your browser doesn't support EyeDropper API!");
      return;
    }

    try {
      const eyeDropper = new EyeDropper();
      const colorValue = await eyeDropper.open();
      const hex = colorValue.sRGBHex.toLowerCase();
      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      
      setHexValue(hex);
      setRgbValue(rgb.string);
      setHslValue(hsl.string);
      setPickedColor(hex);
      setShowResult(true);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.log("Color picking was cancelled");
      }
    }
  };

  // Copy to clipboard with feedback
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied!`);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(`${type} copied!`);
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  return (
    <div className="app">
      <div className="container">
        {/* Left Section - Upload & Pick */}
        <div className="left-section">
          <div className="section-header">
            <h1>Color Picker</h1>
            <p>Upload an image and extract colors instantly</p>
          </div>
          
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''} ${imageSrc ? 'has-image' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {imageSrc ? (
              <>
                <img src={imageSrc} alt="Uploaded" className="uploaded-image" />
                <div className="image-overlay">
                  <div className="overlay-content">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17,8 12,3 7,8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Click or drag to change image</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="drop-zone-content">
                <div className="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17,8 12,3 7,8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <h3>Drop your image here</h3>
                <p>or click to browse files</p>
                <div className="supported-formats">
                  <span>Supports: JPG, PNG, GIF, WebP</span>
                </div>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="file-input"
          />

          <div className="action-buttons">
            <button 
              className="pick-color-btn"
              onClick={handleColorPick}
              disabled={!isPickerSupported}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 18h1.4c.2 0 .4-.1.5-.2L9 12.7c.1-.1.2-.3.2-.5s-.1-.4-.2-.5L3.9 6.6c-.1-.1-.3-.2-.5-.2H2"/>
                <path d="m15 9-3-3"/>
                <path d="M11.5 6.5 15 3"/>
                <path d="M22 3 12 13"/>
              </svg>
              {isPickerSupported ? 'Pick Color from Screen' : 'EyeDropper Not Supported'}
            </button>
          </div>

          {!isPickerSupported && (
            <div className="warning-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Your browser doesn't support the EyeDropper API
            </div>
          )}
        </div>

        {/* Right Section - Color Details */}
        <div className="right-section">
          <div className="section-header">
            <h2>Color Details</h2>
            <p>Extracted color information</p>
          </div>

          {showResult ? (
            <div className="color-results">
              {/* Color Preview */}
              <div className="color-preview-large">
                <div 
                  className="color-swatch"
                  style={{ backgroundColor: pickedColor }}
                ></div>
                <div className="color-name">
                  <h3>Picked Color</h3>
                  <span className="color-hex">{hexValue}</span>
                </div>
              </div>

              {/* Color Values */}
              <div className="color-values">
                <div className="color-value-item">
                  <label>HEX</label>
                  <div className="value-container">
                    <input 
                      type="text" 
                      value={hexValue} 
                      readOnly 
                      className="color-value-input"
                    />
                    <button 
                      onClick={() => copyToClipboard(hexValue, 'HEX')}
                      className="copy-button"
                      title="Copy HEX value"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="color-value-item">
                  <label>RGB</label>
                  <div className="value-container">
                    <input 
                      type="text" 
                      value={rgbValue} 
                      readOnly 
                      className="color-value-input"
                    />
                    <button 
                      onClick={() => copyToClipboard(rgbValue, 'RGB')}
                      className="copy-button"
                      title="Copy RGB value"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="color-value-item">
                  <label>HSL</label>
                  <div className="value-container">
                    <input 
                      type="text" 
                      value={hslValue} 
                      readOnly 
                      className="color-value-input"
                    />
                    <button 
                      onClick={() => copyToClipboard(hslValue, 'HSL')}
                      className="copy-button"
                      title="Copy HSL value"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {copySuccess && (
                <div className="copy-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  {copySuccess}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12h8"/>
                  <path d="M12 8v8"/>
                </svg>
              </div>
              <h3>No Color Selected</h3>
              <p>Upload an image and pick a color to see the details here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;