import React, { useState, useCallback, useEffect, useRef } from 'react';
import useDisableScrollOnDrag from '../../hooks/useDisableScrollOnDrag';

const DraggableContainer = ({ 
  children, 
  initialX = 20, 
  initialY = 20, 
  initialWidth = 300, 
  initialHeight = 200, 
  minWidth = 100, 
  minHeight = 100, 
  onMove, 
  onResize 
}) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const titleRef = useRef(null);

  useDisableScrollOnDrag(isDragging || isResizing);

  useEffect(() => {
    const handleDocumentPointerMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setPosition(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        e.preventDefault();
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setSize(prev => ({
          width: Math.max(minWidth, prev.width + dx),
          height: Math.max(minHeight, prev.height + dy)
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleDocumentPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onMove?.(position.x, position.y);
      } else if (isResizing) {
        setIsResizing(false);
        onResize?.(size.width, size.height);
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('pointermove', handleDocumentPointerMove);
      document.addEventListener('pointerup', handleDocumentPointerUp);
    }

    return () => {
      document.removeEventListener('pointermove', handleDocumentPointerMove);
      document.removeEventListener('pointerup', handleDocumentPointerUp);
    };
  }, [isDragging, isResizing, dragStart, position, size, onMove, onResize, minWidth, minHeight]);

  const handleTitlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizePointerDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-50 shadow-lg"
      style={{ 
        left: position.x, 
        top: position.y, 
        width: size.width, 
        height: size.height 
      }}
    >
      <div
        ref={titleRef}
        className="bg-gray-700 text-white px-4 py-2 cursor-move select-none"
        onPointerDown={handleTitlePointerDown}
      >
        {children[0]}
      </div>
      <div className="bg-gray-800 p-4 rounded-b-lg overflow-auto" style={{ height: 'calc(100% - 40px)' }}>
        {children.slice(1)}
      </div>
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onPointerDown={handleResizePointerDown}
        style={{
          backgroundImage: 'linear-gradient(135deg, transparent 50%, #718096 50%)',
        }}
      />
    </div>
  );
};

export default DraggableContainer;