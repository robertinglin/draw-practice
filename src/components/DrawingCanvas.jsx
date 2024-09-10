import React, { useRef, useState, useEffect, useCallback } from 'react';
import StyledSlider from './myui/StyledSlider';
import AdvancedColorSelector from './myui/AdvancedColorSelector';
import {
    parseColorHistory,
    getStrokePoints,
    drawStroke,
    saveDrawing,
    loadDrawing,
    EraserIcon,
    RefreshCcw
} from '../lib/drawing-utils';
import { Pipette as EyeDropper } from 'lucide-react';
import Layers from './myui/Layers';
import { useLayers } from '../hooks/useLayers';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;

const DrawingCanvas = () => {
    const fileId = 'drawing';
    const {
        layers,
        activeLayer,
        addStrokeToLayer,
        undoLastStroke
    } = useLayers(fileId);
    

    const canvasRefs = useRef({});
    const tempCanvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isErasing, setIsErasing] = useState(false);
    const [isColorPicking, setIsColorPicking] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);
    const [opacity, setOpacity] = useState(() => parseFloat(localStorage.getItem('drawingOpacity')) || 1);
    const [brushSize, setBrushSize] = useState(() => parseFloat(localStorage.getItem('drawingBrushSize')) || 15.97);
    const [color, setColor] = useState(() => localStorage.getItem('drawingColor') || 'hsl(0, 0%, 100%)');
    const [colorHistory, setColorHistory] = useState(() => parseColorHistory());

    useEffect(() => {
        layers.forEach(layer => {
            const canvas = canvasRefs.current[layer.id];
            if (canvas) {
                canvas.width = CANVAS_WIDTH;
                canvas.height = CANVAS_HEIGHT;
            }
        });

        const tempCanvas = tempCanvasRef.current;
        if (tempCanvas) {
            tempCanvas.width = CANVAS_WIDTH;
            tempCanvas.height = CANVAS_HEIGHT;
        }
    }, [layers]);

    const redrawCanvas = useCallback(() => {
        layers.forEach(layer => {
            if (layer.visible) {
                const canvas = canvasRefs.current[layer.id];
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    layer.strokes.forEach(stroke => {
                        const strokePoints = getStrokePoints(stroke.points, stroke.brushSize);
                        if (stroke.type === 'draw') {
                            drawStroke(ctx, strokePoints, stroke.color, stroke.opacity);
                        } else if (stroke.type === 'erase') {
                            ctx.globalCompositeOperation = 'destination-out';
                            drawStroke(ctx, strokePoints, 'black', stroke.opacity);
                            ctx.globalCompositeOperation = 'source-over';
                        }
                    });
                }
            }
        });

        if (currentStroke.length > 0) {
            const activeCanvas = canvasRefs.current[activeLayer];
            if (activeCanvas) {
                const ctx = activeCanvas.getContext('2d');
                const strokePoints = getStrokePoints(currentStroke, brushSize);
                if (isErasing) {
                    ctx.globalCompositeOperation = 'destination-out';
                    drawStroke(ctx, strokePoints, 'black', opacity);
                    ctx.globalCompositeOperation = 'source-over';
                } else {
                    drawStroke(ctx, strokePoints, color, opacity);
                }
            }
        }
    }, [layers, currentStroke, isErasing, opacity, brushSize, color, activeLayer]);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    const getCanvasPoint = useCallback((e) => {
        const activeCanvas = canvasRefs.current[activeLayer];
        if (!activeCanvas) return [0, 0];

        const rect = activeCanvas.getBoundingClientRect();
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }, [activeLayer]);

    const handleColorPick = useCallback((e) => {
        if (!isColorPicking) return;

        const [x, y] = getCanvasPoint(e);

        // Create a temporary canvas to combine all visible layers
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = CANVAS_WIDTH;
        tempCanvas.height = CANVAS_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');

        layers.forEach(layer => {
            if (layer.visible) {
                const layerCanvas = canvasRefs.current[layer.id];
                tempCtx.globalCompositeOperation = layer.blendMode;
                tempCtx.drawImage(layerCanvas, 0, 0);
            }
        });

        // Get the pixel data at the clicked position
        const imageData = tempCtx.getImageData(x, y, 1, 1);
        const [r, g, b] = imageData.data;

        // Convert RGB to hex
        const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

        setColor(hex);
        setIsColorPicking(false);
    }, [isColorPicking, getCanvasPoint, layers]);

    const handlePointerDown = useCallback((e) => {
        if (isColorPicking) {
            handleColorPick(e);
        } else {
            setIsDrawing(true);
            const [x, y] = getCanvasPoint(e);
            const pressure = e.pressure !== 0 ? e.pressure * e.pressure : 0.5;
            setCurrentStroke([[x, y, pressure]]);
        }
    }, [isColorPicking, getCanvasPoint, handleColorPick]);

    const handlePointerMove = useCallback((e) => {
        if (isDrawing) {
            const [x, y] = getCanvasPoint(e);
            const pressure = e.pressure !== 0 ? e.pressure * e.pressure : 0.5;
            setCurrentStroke(prev => [...prev, [x, y, pressure]]);
        }
    }, [isDrawing, getCanvasPoint]);

    const handlePointerUp = useCallback(() => {
        if (isColorPicking) {
          setIsColorPicking(false);
        } else if (isDrawing && currentStroke.length > 0) {
          const newStroke = {
            type: isErasing ? 'erase' : 'draw',
            points: currentStroke,
            opacity: opacity,
            brushSize: brushSize,
            color: isErasing ? 'black' : color
          };
          addStrokeToLayer(activeLayer, newStroke);
          if (!isErasing) {
            setColorHistory(prev => {
              const prevColorIndex = prev.findIndex(c => c === color);
              if (prevColorIndex !== -1) {
                prev.splice(prevColorIndex, 1);
              }
              const nextHistory = [color, ...prev];
              localStorage.setItem('colorHistory', JSON.stringify(nextHistory));
              return nextHistory;
            });
          }
        }
        setIsDrawing(false);
        setCurrentStroke([]);
      }, [isDrawing, currentStroke, isErasing, opacity, brushSize, color, isColorPicking, activeLayer, addStrokeToLayer]);

    const handleColorChange = useCallback((newColor) => {
        setColor(newColor);
        localStorage.setItem('drawingColor', newColor);
    }, []);

    const handleColorMove = useCallback((x, y) => {
        setColorPosition({ x, y });
        localStorage.setItem('colorPosition', JSON.stringify({ x, y }));
    }, []);

    const handleSave = useCallback(() => {
        // Implement save functionality
    }, []);

    const handleLoad = useCallback((e) => {
        // Implement load functionality
    }, []);

    return (
        <>
            <div className="w-full bg-gray-800 text-white p-2">
                <AdvancedColorSelector
                    value={color}
                    onChange={handleColorChange}
                    onMove={handleColorMove}
                    quickSwatches={colorHistory}
                />
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <button
                            className={`w-8 h-8 flex items-center justify-center rounded ${isErasing ? 'bg-blue-500' : 'bg-gray-600'}`}
                            onClick={() => setIsErasing(!isErasing)}
                            aria-label="Eraser tool"
                        >
                            <EraserIcon className="w-6 h-6 pointer-events-none" />
                        </button>
                        <button
                            onClick={() => undoLastStroke()}
                            className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded hover:bg-gray-500"
                        >
                            <RefreshCcw className="w-6 h-6 pointer-events-none" />
                        </button>
                        <button
                            className={`w-8 h-8 flex items-center justify-center rounded ${isColorPicking ? 'bg-blue-500' : 'bg-gray-600'}`}
                            onClick={() => setIsColorPicking(!isColorPicking)}
                            aria-label="Color picker tool"
                        >
                            <EyeDropper className="w-6 h-6 pointer-events-none" />
                        </button>
                    </div>

                    <div className="flex-grow flex items-center space-x-4">
                        <StyledSlider
                            label="Opacity"
                            min={0}
                            max={1}
                            step={0.01}
                            showAsPercent={true}
                            defaultValue={opacity}
                            onChange={(value) => {
                                setOpacity(value);
                                localStorage.setItem('drawingOpacity', value);
                            }}
                        />

                        <StyledSlider
                            label="Brush Size"
                            min={0}
                            max={500}
                            linear={false}
                            step={0.01}
                            defaultValue={brushSize}
                            onChange={(value) => {
                                setBrushSize(value);
                                localStorage.setItem('drawingBrushSize', value);
                            }}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <button onClick={handleSave} className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600">
                            Save
                        </button>
                        <label className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 cursor-pointer">
                            Load
                            <input type="file" onChange={handleLoad} accept=".gz" className="hidden" />
                        </label>
                    </div>
                </div>
            </div>

            <Layers fileId={fileId} />

            <div
                className="mt-4 relative"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                {layers.map((layer, index) => (
                    <canvas
                        key={layer.id}
                        ref={el => canvasRefs.current[layer.id] = el}
                        className="absolute top-0 left-0 border border-gray-300 touch-none"
                        style={{
                            zIndex: index + 1,
                            display: layer.visible ? 'block' : 'none',
                            mixBlendMode: layer.blendMode
                        }}
                    />
                ))}
                <canvas
                    ref={tempCanvasRef}
                    className="hidden"
                />
            </div>
        </>
    );
};

export default DrawingCanvas;