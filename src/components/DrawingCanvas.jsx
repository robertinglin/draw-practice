import React, { useRef, useState, useEffect, useCallback } from "react";
import StyledSlider from "./myui/StyledSlider";
import AdvancedColorSelector from "./myui/AdvancedColorSelector";
import { parseColorHistory, EraserIcon, RefreshCcw } from "../lib/drawing-utils";
import { Pipette as EyeDropper } from "lucide-react";
import Layers from "./myui/Layers";
import { useLayers } from "../hooks/useLayers";
import Brush from "../lib/brushes/Brush";

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;

const DrawingCanvas = () => {
  const fileId = "drawing";
  const { layers, activeLayer, addStrokeToLayer, undo } = useLayers(fileId);

  const canvasWrapperRef = useRef(null);
  const canvasRefs = useRef({});
  const tempCanvasRef = useRef(null);
  const brushCursorRef = useRef(null);
  const currentPointerTypeRef = useRef(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isColorPicking, setIsColorPicking] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [opacity, setOpacity] = useState(() => parseFloat(localStorage.getItem("drawingOpacity")) || 1);
  const [brushSize, setBrushSize] = useState(() => parseFloat(localStorage.getItem("drawingBrushSize")) || 15.97);
  const [color, setColor] = useState(() => localStorage.getItem("drawingColor") || "hsl(0, 0%, 100%)");
  const [colorHistory, setColorHistory] = useState(() => parseColorHistory());
  const [selectedBrush, setSelectedBrush] = useState("standard");
  const [cursorHidden, setCursorHidden] = useState(false);

  const brushes = {
    standard: new Brush({ type: "standard", name: "Standard Brush" }),
    airbrush: new Brush({
      type: "softbrush",
      name: "Airbrush",
      modifier: { scatter: 20 },
    }),
  };

  useEffect(() => {
    const _undo = (e) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        e.stopPropagation();
        if (!currentPointerTypeRef.current) {
          undo();
        }
      }
    };
    document.addEventListener("keydown", _undo);
    return () => document.removeEventListener("keydown", _undo);
  }, []);

  useEffect(() => {
    layers.forEach((layer) => {
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
    layers.forEach((layer) => {
      if (layer.visible) {
        const canvas = canvasRefs.current[layer.id];
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          console.log(layer.strokes);

          layer.strokes.forEach((stroke) => {
            brushes[stroke.brushType].applyStroke(ctx, stroke.points, {
              size: stroke.brushSize,
              opacity: stroke.opacity,
              color: stroke.type === "erase" ? "black" : stroke.color,
              eraser: stroke.type === "erase",
            });
          });
        }
      }
    });

    if (currentStroke.length > 0) {
      const activeCanvas = canvasRefs.current[activeLayer];
      if (activeCanvas) {
        const ctx = activeCanvas.getContext("2d");

        brushes[selectedBrush].applyStroke(ctx, currentStroke, {
          size: brushSize,
          opacity: opacity,
          color: isErasing ? "black" : color,
          eraser: isErasing,
        });
      }
    }
  }, [layers, currentStroke, isErasing, opacity, brushSize, color, activeLayer, selectedBrush]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasPoint = useCallback(
    (e) => {
      const activeCanvas = canvasRefs.current[activeLayer];
      if (!activeCanvas) return [0, 0];

      const rect = activeCanvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    },
    [activeLayer]
  );

  const handleColorPick = useCallback(
    (e) => {
      if (!isColorPicking) return;

      const [x, y] = getCanvasPoint(e);

      // Create a temporary canvas to combine all visible layers
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = CANVAS_WIDTH;
      tempCanvas.height = CANVAS_HEIGHT;
      const tempCtx = tempCanvas.getContext("2d");

      layers.forEach((layer) => {
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
    },
    [isColorPicking, getCanvasPoint, layers]
  );

  const calculateCursorSize = useCallback(
    (pressure) => {
      return Math.max(4, brushSize * Math.max(pressure, 0.5));
    },
    [brushSize]
  );

  const updateBrushCursor = useCallback(
    (e) => {
      if (cursorHidden) {
        setCursorHidden(false);
      }
      if (!brushCursorRef.current) return;

      const pressure = e?.pressure !== undefined ? e?.pressure : 0.5;
      const size = calculateCursorSize(pressure);

      const rect = canvasWrapperRef.current.getBoundingClientRect();

      if (e) {
        cursorPositionRef.current.x = e.clientX;
        cursorPositionRef.current.y = e.clientY;
      }
      const left = cursorPositionRef.current.x - rect.left - size / 2;
      const top = cursorPositionRef.current.y - rect.top - size / 2;

      brushCursorRef.current.style.left = `${left}px`;
      brushCursorRef.current.style.top = `${top}px`;
      brushCursorRef.current.style.display = "block";
      brushCursorRef.current.setAttribute("width", size);
      brushCursorRef.current.setAttribute("height", size);

      const circle = brushCursorRef.current.firstElementChild;
      if (circle) {
        circle.setAttribute("cx", size / 2);
        circle.setAttribute("cy", size / 2);
        circle.setAttribute("r", size / 2 - 1);
        circle.setAttribute("stroke-opacity", "1");
        circle.setAttribute("stroke", isErasing ? "red" : "black");
      }
    },
    [calculateCursorSize, isErasing, cursorHidden]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (currentPointerTypeRef.current !== "mouse" && e.pointerType === "mouse") {
        return; // Ignore mouse input if the current interaction started with a non-mouse input
      }
      currentPointerTypeRef.current = e.pointerType;

      if (isColorPicking) {
        handleColorPick(e);
      } else {
        setIsDrawing(true);
        const [x, y] = getCanvasPoint(e);
        const pressure = e.pressure !== 0 ? e.pressure * e.pressure : 0.5;
        setCurrentStroke([[x, y, pressure]]);
      }
    },
    [isColorPicking, getCanvasPoint, handleColorPick]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (currentPointerTypeRef.current !== "mouse" && e.pointerType === "mouse") {
        return; // Ignore mouse input if the current interaction started with a non-mouse input
      }

      updateBrushCursor(e);

      if (isDrawing) {
        const [x, y] = getCanvasPoint(e);
        const pressure = e.pressure !== 0 ? e.pressure * e.pressure : 0.5;
        setCurrentStroke((prev) => [...prev, [x, y, pressure]]);
      }
    },
    [isDrawing, getCanvasPoint]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (currentPointerTypeRef.current !== "mouse" && e.pointerType === "mouse") {
        console.log("here?");
        return; // Ignore mouse input if the current interaction started with a non-mouse input
      }

      if (isColorPicking) {
        setIsColorPicking(false);
      } else if (isDrawing && currentStroke.length > 0) {
        const newStroke = {
          type: isErasing ? "erase" : "draw",
          points: currentStroke,
          opacity: opacity,
          brushSize: brushSize,
          color: isErasing ? "black" : color,
          brushType: selectedBrush,
        };
        addStrokeToLayer(activeLayer, newStroke);
        if (!isErasing) {
          setColorHistory((prev) => {
            const prevColorIndex = prev.findIndex((c) => c === color);
            if (prevColorIndex !== -1) {
              prev.splice(prevColorIndex, 1);
            }
            const nextHistory = [color, ...prev];
            localStorage.setItem("colorHistory", JSON.stringify(nextHistory));
            return nextHistory;
          });
        }
      }
      setIsDrawing(false);
      setCurrentStroke([]);
      currentPointerTypeRef.current = null;
    },
    [isDrawing, currentStroke, isErasing, opacity, brushSize, color, isColorPicking, activeLayer, addStrokeToLayer, selectedBrush]
  );

  const handlePointerLeave = useCallback(() => {
    setCursorHidden(true);
  }, []);

  const handleColorChange = useCallback((newColor) => {
    setColor(newColor);
    localStorage.setItem("drawingColor", newColor);
  }, []);

  const handleColorMove = useCallback((x, y) => {
    setColorPosition({ x, y });
    localStorage.setItem("colorPosition", JSON.stringify({ x, y }));
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
        <AdvancedColorSelector value={color} onChange={handleColorChange} onMove={handleColorMove} quickSwatches={colorHistory} />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              className={`w-8 h-8 flex items-center justify-center rounded ${isErasing ? "bg-blue-500" : "bg-gray-600"}`}
              onClick={() => setIsErasing(!isErasing)}
              aria-label="Eraser tool"
            >
              <EraserIcon className="w-6 h-6 pointer-events-none" />
            </button>
            <button onMouseDown={() => undo()} className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded hover:bg-gray-500">
              <RefreshCcw className="w-6 h-6 pointer-events-none" />
            </button>
            <button
              className={`w-8 h-8 flex items-center justify-center rounded ${isColorPicking ? "bg-blue-500" : "bg-gray-600"}`}
              onClick={() => setIsColorPicking(!isColorPicking)}
              aria-label="Color picker tool"
            >
              <EyeDropper className="w-6 h-6 pointer-events-none" />
            </button>
            <select className="bg-gray-600 rounded p-1" value={selectedBrush} onChange={(e) => setSelectedBrush(e.target.value)}>
              <option value="standard">Standard</option>
              <option value="airbrush">Airbrush</option>
            </select>
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
                localStorage.setItem("drawingOpacity", value);
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
                localStorage.setItem("drawingBrushSize", value);
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
        className="mt-4 relative cursor-none"
        ref={canvasWrapperRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {layers.map((layer, index) => (
          <canvas
            key={layer.id}
            ref={(el) => (canvasRefs.current[layer.id] = el)}
            className="absolute top-0 left-0 border border-gray-300 touch-none"
            style={{
              zIndex: index + 1,
              display: layer.visible ? "block" : "none",
              mixBlendMode: layer.blendMode,
            }}
          />
        ))}
        <canvas ref={tempCanvasRef} className="hidden" />
        {!cursorHidden && (
          <svg ref={brushCursorRef} className="absolute pointer-events-none" style={{ zIndex: layers.length + 2 }}>
            <circle cx="20" cy="20" r="19" fill="none" stroke="black" strokeWidth="1" />
          </svg>
        )}
      </div>
    </>
  );
};

export default DrawingCanvas;
