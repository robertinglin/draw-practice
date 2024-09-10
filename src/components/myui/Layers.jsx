import React, { useState } from 'react';
import { Layers as LayersIcon } from 'lucide-react';
import DraggableContainer from './DraggableContainer';
import { useLayers } from '../../hooks/useLayers';

const BLEND_MODES = [
    'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
    'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

const Layers = ({ fileId }) => {
    const {
        layers,
        activeLayer,
        setActiveLayer,
        addLayer,
        removeLayer,
        toggleLayerVisibility,
        changeLayerBlendMode
    } = useLayers(fileId);

    const [position, setPosition] = useState(() => {
        const savedPosition = localStorage.getItem('layersPosition');
        return savedPosition ? JSON.parse(savedPosition) : { x: 20, y: 20 };
    });

    const handleMove = (x, y, w, h) => {
        setPosition({ x, y, w, h });
        localStorage.setItem('layersPosition', JSON.stringify({ x, y, w, h }));
    };

    return (
        <DraggableContainer initialX={position.x} initialY={position.y}
            initialHeight={position.h} initialWidth={position.w}
        onMove={handleMove}>
            <div className="cursor-move">Layers</div>
            <div className="w-64">
                <button onClick={addLayer} className="px-3 py-1 bg-green-500 rounded hover:bg-green-600 mr-2 mb-2">
                    Add Layer
                </button>
                {layers.map((layer, index) => (
                    <div key={layer.id} className="flex items-center mt-1">
                        <button
                            className={`px-3 py-1 ${activeLayer === layer.id ? 'bg-blue-500' : 'bg-gray-600'} rounded mr-2`}
                            onPointerDown={() => setActiveLayer(layer.id)}
                        >
                            Layer {index + 1}
                        </button>
                        <button
                            className={`px-2 py-1 ${layer.visible ? 'bg-yellow-500' : 'bg-gray-600'} rounded mr-2`}
                            onPointerDown={() => toggleLayerVisibility(layer.id)}
                        >
                            <LayersIcon className="w-4 h-4" />
                        </button>
                        <select
                            value={layer.blendMode}
                            onChange={(e) => changeLayerBlendMode(layer.id, e.target.value)}
                            className="bg-gray-700 text-white rounded mr-2"
                        >
                            {BLEND_MODES.map(mode => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </select>
                        {layers.length > 1 && (
                            <button
                                className="px-2 py-1 bg-red-500 rounded"
                                onClick={() => removeLayer(layer.id)}
                            >
                                X
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </DraggableContainer>
    );
};

export default Layers;