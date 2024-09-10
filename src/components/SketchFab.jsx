import React, { useState } from 'react';

// SketchfabEmbed component
const SketchfabEmbed = ({ url, title = 'Sketchfab Model', width = '100%', height = '400px' }) => {
  const embedUrl = url.endsWith('/embed') ? url : `${url}/embed`;

  return (
    <div className="sketchfab-embed-wrapper">
      <iframe
        title={title}
        width={width}
        height={height}
        src={embedUrl}
        frameBorder="0"
        allow="autoplay; fullscreen; vr"
        mozallowfullscreen="true"
        webkitallowfullscreen="true"
      />
    </div>
  );
};

// Main App component
const App = () => {
  const [modelUrl, setModelUrl] = useState('https://sketchfab.com/3d-models/box-10d7da510e6d480b86a44eed7268452f');

  const handleUrlChange = (e) => {
    setModelUrl(e.target.value);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sketchfab Model Viewer</h1>
      
      <div className="mb-4">
        <label htmlFor="modelUrl" className="block mb-2">Enter Sketchfab Model URL:</label>
        <input
          type="text"
          id="modelUrl"
          value={modelUrl}
          onChange={handleUrlChange}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-4">
        <SketchfabEmbed 
          url={modelUrl}
          title="Sketchfab Model"
          height="500px"
        />
      </div>
      
      <p className="text-sm text-gray-600">
        Try changing the URL to view different Sketchfab models. Make sure to use the full Sketchfab URL.
      </p>
    </div>
  );
};

export default App;