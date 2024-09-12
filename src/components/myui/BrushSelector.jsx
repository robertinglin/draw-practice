import React from "react";
import DraggableContainer from "./DraggableContainer";

const brushTypes = [
  { id: "standard", name: "Standard", icon: "🖌️" },
  { id: "airbrush", name: "Airbrush", icon: "🌬️" },
  { id: "marker", name: "Marker", icon: "✒️" },
  { id: "pencil", name: "Pencil", icon: "✏️" },
  { id: "chalk", name: "Chalk", icon: "🖍️" },
  { id: "watercolor", name: "Watercolor", icon: "💦" },
];

const BrushSelector = ({ selectedBrush, onBrushSelect }) => {
  return (
    <DraggableContainer initialX={20} initialY={100} initialWidth={200} initialHeight={300} minWidth={150} minHeight={200}>
      <h2 className="text-lg font-semibold mb-2">Brush Selector</h2>
      <div className="grid grid-cols-2 gap-2">
        {brushTypes.map((brush) => (
          <button
            key={brush.id}
            className={`w-full h-20 flex flex-col items-center justify-center border-2 rounded ${
              selectedBrush === brush.id ? "border-blue-500 bg-blue-100" : "border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => onBrushSelect(brush.id)}
          >
            <span className="text-2xl mb-1">{brush.icon}</span>
            <span className="text-sm">{brush.name}</span>
          </button>
        ))}
      </div>
    </DraggableContainer>
  );
};

export default BrushSelector;
