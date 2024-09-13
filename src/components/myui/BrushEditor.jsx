import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as Slider from "@radix-ui/react-slider";

const BrushEditor = ({ brush, isOpen, onClose, onSave }) => {
  const [editedBrush, setEditedBrush] = useState(brush);

  useEffect(() => {
    setEditedBrush(brush);
  }, [brush]);

  const handleChange = (name, value) => {
    setEditedBrush((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(editedBrush);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50 max-w-md w-full">
          <Dialog.Title className="text-xl font-bold mb-4">Edit Brush: {brush.name}</Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={editedBrush.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <Select.Root value={editedBrush.type} onValueChange={(value) => handleChange("type", value)}>
                <Select.Trigger className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                  <Select.Value />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white p-2 rounded-md shadow-lg z-[60]">
                    <Select.Viewport>
                      <Select.Item value="standard" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Standard</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="stamp" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Stamp</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="airbrush" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Airbrush</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="texture" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Texture</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="softbrush" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Soft Brush</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="computed" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Computed</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Blend Mode</label>
              <Select.Root value={editedBrush.blendMode} onValueChange={(value) => handleChange("blendMode", value)}>
                <Select.Trigger className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                  <Select.Value />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white p-2 rounded-md shadow-lg z-[60]">
                    <Select.Viewport>
                      <Select.Item value="normal" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Normal</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="multiply" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Multiply</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="screen" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Screen</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="overlay" className="cursor-pointer p-2 hover:bg-gray-100">
                        <Select.ItemText>Overlay</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
            {editedBrush.type === "computed" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diameter</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={editedBrush.diameter}
                    onChange={(e) => handleChange("diameter", parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Roundness</label>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[editedBrush.roundness || 1]}
                    onValueChange={([value]) => handleChange("roundness", value)}
                    max={1}
                    step={0.01}
                  >
                    <Slider.Track className="bg-gray-200 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-5 h-5 bg-white shadow-lg rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </Slider.Root>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Angle</label>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[editedBrush.angle || 0]}
                    onValueChange={([value]) => handleChange("angle", value)}
                    max={360}
                  >
                    <Slider.Track className="bg-gray-200 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-5 h-5 bg-white shadow-lg rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </Slider.Root>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hardness</label>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[editedBrush.hardness || 1]}
                    onValueChange={([value]) => handleChange("hardness", value)}
                    max={1}
                    step={0.01}
                  >
                    <Slider.Track className="bg-gray-200 relative grow rounded-full h-1">
                      <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-5 h-5 bg-white shadow-lg rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </Slider.Root>
                </div>
              </>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BrushEditor;
