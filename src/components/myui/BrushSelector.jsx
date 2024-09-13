import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import DraggableContainer from "./DraggableContainer";
import { openDB } from "idb";
import { convertAbrToBrush, loadAbrBrushes } from "../../lib/brushes/convert-abr";
import Brush from "../../lib/brushes/Brush";
import BrushEditor from "./BrushEditor";
import * as ContextMenu from "@radix-ui/react-context-menu";

const dbPromise = openDB("BrushDB", 1, {
  upgrade(db) {
    db.createObjectStore("brushes", { keyPath: "id" });
  },
});

const BrushSelector = ({ selectedBrush, onBrushSelect }) => {
  const [brushes, setBrushes] = useState([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [editingBrush, setEditingBrush] = useState(null);

  useEffect(() => {
    loadBrushes();
  }, []);

  useEffect(() => {
    const setDragging = (e) => {
      setIsDraggingFile(e.dataTransfer.types.includes("Files"));
    };
    document.addEventListener("dragenter", setDragging);
    document.addEventListener("dragover", setDragging);
    document.addEventListener("dragleave", setDragging);
    document.addEventListener("drop", setDragging);
    return () => {
      document.removeEventListener("dragenter", setDragging);
      document.removeEventListener("dragover", setDragging);
      document.removeEventListener("dragleave", setDragging);
      document.removeEventListener("drop", setDragging);
    };
  }, []);

  const loadBrushes = async () => {
    const db = await dbPromise;
    const storedBrushes = await db.getAll("brushes");
    setBrushes(storedBrushes.map((brush) => Brush.fromJSON(brush)));
  };

  const saveBrush = async (brush) => {
    const db = await dbPromise;
    await db.put("brushes", brush);
    loadBrushes();
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const abrBrushes = [];
    for (const file of acceptedFiles) {
      if (file.name.endsWith(".abr")) {
        abrBrushes.push(...(await loadAbrBrushes(file)));
      }
    }

    for (const brush of abrBrushes) {
      await saveBrush(brush.toJSON());
    }
    setIsDraggingFile(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    onDragEnter: () => setIsDraggingFile(true),
    onDragLeave: () => setIsDraggingFile(false),
  });

  const dropzoneProps = isDraggingFile ? getRootProps() : {};

  const renderBrushPreview = (brush) => {
    if (brush.type === "stamp" && brush.stamp) {
      return <img src={brush.stamp.src} alt={brush.name} className="w-12 h-12 object-contain mb-1" />;
    } else {
      return <span className="text-2xl mb-1">🖌️</span>;
    }
  };

  const handleEditBrush = (brush) => {
    setEditingBrush(brush.toJSON());
  };

  const handleSaveBrush = async (editedBrush) => {
    await saveBrush(editedBrush);
    setEditingBrush(null);
  };

  return (
    <DraggableContainer initialX={20} initialY={100} initialWidth={200} initialHeight={300} minWidth={150} minHeight={200}>
      <h2 className="text-lg font-semibold mb-2">Brush Selector</h2>

      <div {...dropzoneProps} className={`p-4 border-2 ${isDraggingFile ? "border-dashed border-blue-500 bg-blue-100" : "border-solid border-gray-300"}`}>
        {isDraggingFile && <input {...getInputProps()} />}
        {isDraggingFile && <p className="text-sm mb-2">Drop ABR files here to add new brushes</p>}
        <div className="grid grid-cols-2 gap-2">
          {brushes.map((brush) => (
            <ContextMenu.Root key={brush.id}>
              <ContextMenu.Trigger asChild>
                <button
                  className={`w-full h-20 flex flex-col items-center justify-center border-2 rounded ${
                    selectedBrush === brush.id ? "border-blue-500 bg-blue-100" : "border-gray-300 hover:bg-gray-100"
                  }`}
                  onClick={() => onBrushSelect(brush.id)}
                >
                  {renderBrushPreview(brush)}
                  <span className="text-sm">{brush.name}</span>
                </button>
              </ContextMenu.Trigger>
              <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-[120px] bg-white rounded-md overflow-hidden p-1 shadow-md z-20">
                  <ContextMenu.Item
                    className="text-sm cursor-pointer px-2 py-1 hover:bg-blue-500 hover:text-white rounded"
                    onSelect={() => handleEditBrush(brush)}
                  >
                    Edit Brush
                  </ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          ))}
        </div>
      </div>

      {editingBrush && <BrushEditor brush={editingBrush} isOpen={!!editingBrush} onClose={() => setEditingBrush(null)} onSave={handleSaveBrush} />}
    </DraggableContainer>
  );
};

export default BrushSelector;
