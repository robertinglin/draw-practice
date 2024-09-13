import React, { useState, useEffect, useRef } from "react";
import useDisableScrollOnDrag from "../../hooks/useDisableScrollOnDrag";

const DraggableContainer = ({ children, initialX = 20, initialY = 20, initialWidth = 300, initialHeight = 200, minWidth = 100, minHeight = 100, onMove }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const activePointerId = useRef(null);
  const originalPosition = useRef({ x: initialX, y: initialY });
  const lastUserSetPosition = useRef({ x: initialX, y: initialY });

  useDisableScrollOnDrag(isDragging || isResizing);

  const adjustPosition = (newPosition, newSize) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate the maximum allowed position
    const maxX = windowWidth - newSize.width;
    const maxY = windowHeight - newSize.height;

    // Determine the position closest to the original, within bounds
    let adjustedX = Math.max(0, Math.min(originalPosition.current.x, maxX));
    let adjustedY = Math.max(0, Math.min(originalPosition.current.y, maxY));

    // If the new position is further from the original than the adjusted position, use the new position
    if (Math.abs(newPosition.x - originalPosition.current.x) > Math.abs(adjustedX - originalPosition.current.x)) {
      adjustedX = Math.max(0, Math.min(newPosition.x, maxX));
    }
    if (Math.abs(newPosition.y - originalPosition.current.y) > Math.abs(adjustedY - originalPosition.current.y)) {
      adjustedY = Math.max(0, Math.min(newPosition.y, maxY));
    }

    return { x: adjustedX, y: adjustedY };
  };

  useEffect(() => {
    const handleResize = () => {
      setPosition((prevPosition) => {
        const adjustedPosition = adjustPosition(lastUserSetPosition.current, size);
        return adjustedPosition;
      });
    };

    window.addEventListener("resize", handleResize);

    // Initial position check
    setPosition((prevPosition) => adjustPosition(prevPosition, size));

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [size]);

  useEffect(() => {
    const handleDocumentPointerMove = (e) => {
      if (e.pointerId !== activePointerId.current) return;

      if (isDragging) {
        e.preventDefault();
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setPosition((prev) => {
          const newPosition = { x: prev.x + dx, y: prev.y + dy };
          lastUserSetPosition.current = newPosition;
          return adjustPosition(newPosition, size);
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        e.preventDefault();
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setSize((prev) => ({
          width: Math.max(minWidth, prev.width + dx),
          height: Math.max(minHeight, prev.height + dy),
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleDocumentPointerUp = (e) => {
      if (e.pointerId !== activePointerId.current) return;

      if (isDragging) {
        setIsDragging(false);
        onMove?.(position.x, position.y, size.width, size.height);
      } else if (isResizing) {
        setIsResizing(false);
        onMove?.(position.x, position.y, size.width, size.height);
      }
      activePointerId.current = null;
    };

    if (isDragging || isResizing) {
      document.addEventListener("pointermove", handleDocumentPointerMove);
      document.addEventListener("pointerup", handleDocumentPointerUp);
      document.addEventListener("pointercancel", handleDocumentPointerUp);
    }

    return () => {
      document.removeEventListener("pointermove", handleDocumentPointerMove);
      document.removeEventListener("pointerup", handleDocumentPointerUp);
      document.removeEventListener("pointercancel", handleDocumentPointerUp);
    };
  }, [isDragging, isResizing, dragStart, position, size, onMove, minWidth, minHeight]);

  const handleTitlePointerDown = (e) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    activePointerId.current = e.pointerId;
  };

  const handleResizePointerDown = (e) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    activePointerId.current = e.pointerId;
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-10 shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        touchAction: "none",
      }}
    >
      <div
        ref={titleRef}
        className="bg-gray-700 text-white px-4 py-2 cursor-move select-none"
        onPointerDown={handleTitlePointerDown}
        style={{ touchAction: "none" }}
      >
        {children[0]}
      </div>
      <div className="bg-gray-800 p-4 rounded-b-lg overflow-auto" style={{ height: "calc(100% - 40px)" }}>
        {children.slice(1)}
      </div>
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onPointerDown={handleResizePointerDown}
        style={{
          backgroundImage: "linear-gradient(135deg, transparent 50%, #718096 50%)",
          touchAction: "none",
        }}
      />
    </div>
  );
};

export default DraggableContainer;
