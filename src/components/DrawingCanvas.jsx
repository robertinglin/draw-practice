import React, { useRef, useState, useEffect, useCallback } from "react";
import StyledSlider from "./myui/StyledSlider";
import AdvancedColorSelector from "./myui/AdvancedColorSelector";
import { parseColorHistory, EraserIcon, RefreshCcw, RefreshCw, rgbToHsl } from "../lib/drawing-utils";
import { Pipette as EyeDropper, PaintBucket as Fill, Brush } from "lucide-react";
import Layers from "./myui/Layers";
import { useLayers } from "../hooks/useLayers";
import draw from "../lib/draw";
import BrushSelector from "./myui/BrushSelector";
import { ColorPickerTool, BrushTool, FillTool } from "./myui/Tools";

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;

const DrawingCanvas = () => {
  const fileId = "drawing";
  const { layers, activeLayer, addStrokeToLayer, undo, redo, addFillToLayer } = useLayers(fileId);

  const canvasWrapperRef = useRef(null);
  const canvasCacheRef = useRef({});
  const tempCanvasRef = useRef(null);
  const brushCursorRef = useRef(null);
  const currentPointerTypeRef = useRef(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [opacity, setOpacity] = useState(() => parseFloat(localStorage.getItem("drawingOpacity")) || 1);
  const [brushSize, setBrushSize] = useState(() => parseFloat(localStorage.getItem("drawingBrushSize")) || 15.97);
  const [color, setColor] = useState(() => localStorage.getItem("drawingColor") || "hsl(0, 0%, 100%)");
  const [colorHistory, setColorHistory] = useState(() => parseColorHistory());
  const [selectedBrush, setSelectedBrush] = useState("standard");
  const [cursorHidden, setCursorHidden] = useState(false);
  const [selectedTool, setSelectedTool] = useState("brush");
  const [contiguous, setContiguous] = useState(true);
  const [tolerance, setTolerance] = useState(0.1);

  const handleBrushSelect = (brushType) => {
    setSelectedBrush(brushType);
  };

  useEffect(() => {
    const handleUndo = (e) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        e.stopPropagation();
        if (!currentPointerTypeRef.current) {
          undo();
        }
      }
    };
    document.addEventListener("keydown", handleUndo);
    return () => document.removeEventListener("keydown", handleUndo);
  }, [undo]);

  const redraw = useCallback(() => {
    const activeStroke = currentStroke
      ? {
          type: isErasing ? "erase" : "draw",
          points: currentStroke,
          opacity: opacity,
          brushSize: brushSize,
          color: isErasing ? "black" : color,
          brushType: selectedBrush,
          layerId: activeLayer,
        }
      : undefined;
    canvasCacheRef.current = draw(CANVAS_WIDTH, CANVAS_HEIGHT, { layers }, canvasCacheRef.current, activeStroke);

    // Update the DOM with the new canvas states
    layers.forEach((layer) => {
      const canvas = canvasCacheRef.current[layer.id]?.canvas;
      if (canvas) {
        const domCanvas = document.getElementById(layer.id);
        if (domCanvas && domCanvas instanceof HTMLCanvasElement) {
          const ctx = domCanvas.getContext("2d");
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          ctx.drawImage(canvas, 0, 0);
        }
      }
    });
  }, [layers, fileId, currentStroke]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getCanvasPoint = useCallback(
    (e) => {
      const rect = canvasWrapperRef.current.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    },
    [activeLayer]
  );

  const handleColorPick = useCallback(
    (e) => {
      if (selectedTool !== "color-picker") return;

      const [x, y] = getCanvasPoint(e);

      // Create a temporary canvas to combine all visible layers
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = CANVAS_WIDTH;
      tempCanvas.height = CANVAS_HEIGHT;
      const tempCtx = tempCanvas.getContext("2d");

      layers.forEach((layer) => {
        if (layer.visible) {
          const layerCanvas = canvasCacheRef.current[layer.id].canvas;
          tempCtx.globalCompositeOperation = layer.blendMode;
          tempCtx.drawImage(layerCanvas, 0, 0);
        }
      });

      // Get the pixel data at the clicked position
      const imageData = tempCtx.getImageData(x, y, 1, 1);
      const [r, g, b] = imageData.data;

      // convert hsl to hsl string
      const hsl = rgbToHsl(r, g, b);
      handleColorChange(hsl);
    },
    [selectedTool, getCanvasPoint, layers]
  );

  const handleFill = useCallback(
    (e) => {
      const [x, y] = getCanvasPoint(e);
      addFillToLayer(activeLayer, {
        startPoint: [x, y, 0],
        color,
        opacity,
        tolerance,
        contiguous,
      });
    },
    [getCanvasPoint, activeLayer, addFillToLayer, color, opacity, tolerance, contiguous]
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
        circle.setAttribute("stroke", isErasing && selectedTool === "brush" ? "red" : "black");
      }
    },
    [calculateCursorSize, isErasing, cursorHidden, selectedTool]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (currentPointerTypeRef.current && currentPointerTypeRef.current !== e.pointerType) {
        return; // Ignore input if the current interaction started with a different input
      }
      currentPointerTypeRef.current = e.pointerType;

      if (selectedTool === "color-picker") {
        handleColorPick(e);
      } else if (selectedTool === "fill") {
        handleFill(e);
      } else if (selectedTool === "brush") {
        setIsDrawing(true);
        const [x, y] = getCanvasPoint(e);
        const pressure = e.pressure !== 0 ? e.pressure * e.pressure : 0.5;
        setCurrentStroke([[x, y, pressure]]);
      }
    },
    [selectedTool, handleColorPick, handleFill, getCanvasPoint]
  );

  const handlePointerMove = useCallback(
    (e) => {
      updateBrushCursor(e);
      if (currentPointerTypeRef.current !== e.pointerType) {
        return; // Ignore input if the current interaction started with a different input
      }

      if (isDrawing && selectedTool === "brush") {
        const [x, y] = getCanvasPoint(e);
        const pressure = e.pressure !== 0 ? e.pressure * e.pressure : 0.5;
        setCurrentStroke((prev) => [...prev, [x, y, pressure]]);
      }
    },
    [isDrawing, getCanvasPoint, updateBrushCursor, selectedTool]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (currentPointerTypeRef.current !== e.pointerType) {
        return; // Ignore input if the current interaction started with a different input
      }

      if (selectedTool === "brush" && isDrawing && currentStroke.length > 0) {
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
    [selectedTool, isDrawing, currentStroke, isErasing, opacity, brushSize, color, activeLayer, addStrokeToLayer, selectedBrush]
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
        <AdvancedColorSelector value={color} onChange={handleColorChange} quickSwatches={colorHistory} />
        <BrushSelector selectedBrush={selectedBrush} onBrushSelect={handleBrushSelect} />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button onMouseDown={() => undo()} className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded hover:bg-gray-500">
              <RefreshCcw className="w-6 h-6 pointer-events-none" />
            </button>
            <button onMouseDown={() => redo()} className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded hover:bg-gray-500">
              <RefreshCw className="w-6 h-6 pointer-events-none" />
            </button>

            <button
              className={`w-8 h-8 flex items-center justify-center rounded ${selectedTool === "color-picker" ? "bg-blue-500" : "bg-gray-600"}`}
              onClick={() => setSelectedTool("color-picker")}
              aria-label="Color picker tool"
            >
              <EyeDropper className="w-6 h-6 pointer-events-none" />
            </button>
            <button
              className={`w-8 h-8 flex items-center justify-center rounded ${selectedTool === "brush" ? "bg-blue-500" : "bg-gray-600"}`}
              onClick={() => setSelectedTool("brush")}
              aria-label="Paint brush tool"
            >
              <Brush className="w-6 h-6 pointer-events-none" />
            </button>
            <button
              className={`w-8 h-8 flex items-center justify-center rounded ${selectedTool === "fill" ? "bg-blue-500" : "bg-gray-600"}`}
              onClick={() => setSelectedTool("fill")}
              aria-label="Fill tool"
            >
              <Fill className="w-6 h-6 pointer-events-none" />
            </button>
          </div>

          {selectedTool === "color-picker" && <ColorPickerTool onColorPick={handleColorPick} />}
          {selectedTool === "brush" && (
            <BrushTool
              opacity={opacity}
              setOpacity={setOpacity}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              isErasing={isErasing}
              setIsErasing={setIsErasing}
            />
          )}
          {selectedTool === "fill" && (
            <FillTool
              opacity={opacity}
              setOpacity={setOpacity}
              contiguous={contiguous}
              setContiguous={setContiguous}
              tolerance={tolerance}
              setTolerance={setTolerance}
            />
          )}
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
            id={layer.id}
            className="absolute top-0 left-0 border border-gray-300 touch-none"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
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
