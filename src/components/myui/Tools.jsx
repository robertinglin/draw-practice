import React from "react";
import StyledSlider from "./StyledSlider";
import { EraserIcon } from "../../lib/drawing-utils";
import { Pipette as EyeDropper, PaintBucket as Fill } from "lucide-react";

export const ColorPickerTool = ({ onColorPick }) => (
  <button className="w-8 h-8 flex items-center justify-center rounded bg-blue-500" onClick={onColorPick} aria-label="Color picker tool">
    <EyeDropper className="w-6 h-6 pointer-events-none" />
  </button>
);

export const BrushTool = ({ opacity, setOpacity, brushSize, setBrushSize, isErasing, setIsErasing }) => (
  <div className="flex items-center space-x-2">
    <button
      className={`w-8 h-8 flex items-center justify-center rounded ${isErasing ? "bg-blue-500" : "bg-gray-600"}`}
      onClick={() => setIsErasing(!isErasing)}
      aria-label="Eraser tool"
    >
      <EraserIcon className="w-6 h-6 pointer-events-none" />
    </button>
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
);

export const FillTool = ({ opacity, setOpacity, contiguous, setContiguous, tolerance, setTolerance }) => (
  <div className="flex items-center space-x-2">
    <button className="w-8 h-8 flex items-center justify-center rounded bg-blue-500" aria-label="Fill tool">
      <Fill className="w-6 h-6 pointer-events-none" />
    </button>
    <StyledSlider label="Opacity" min={0} max={1} step={0.01} showAsPercent={true} defaultValue={opacity} onChange={setOpacity} />
    <label className="flex items-center">
      <input type="checkbox" checked={contiguous} onChange={(e) => setContiguous(e.target.checked)} className="mr-2" />
      Contiguous
    </label>
    <StyledSlider label="Tolerance" min={0} max={1} step={0.01} showAsPercent={true} defaultValue={tolerance} onChange={setTolerance} />
  </div>
);
