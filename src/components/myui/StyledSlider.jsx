import React, { useState, useRef, useEffect, useCallback } from 'react';

const StyledSlider = ({ 
  label, 
  min, 
  max, 
  step, 
  defaultValue, 
  onChange, 
  showAsPercent = false,
  linear = true
}) => {
  const [value, setValue] = useState(defaultValue);
  const [isInteracting, setIsInteracting] = useState(false);
  const sliderRef = useRef(null);

  const handleChange = (newValue) => {
    const clampedValue = Math.min(Math.max(newValue, min), max);
    setValue(clampedValue);
    onChange(clampedValue);
  };

  const valueToPosition = (val) => {
    if (linear) {
      return (val - min) / (max - min);
    } else {
      // Custom logarithmic-like scale
      const normalizedValue = (val - min) / (max - min);
      return Math.log1p(normalizedValue * 99) / Math.log(100);
    }
  };

  const positionToValue = (pos) => {
    if (linear) {
      return min + pos * (max - min);
    } else {
      // Inverse of the custom logarithmic-like scale
      const exponentialValue = Math.expm1(pos * Math.log(100)) / 99;
      return min + exponentialValue * (max - min);
    }
  };

  const handleSliderInteraction = (clientX) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newValue = positionToValue(position);
      handleChange(adjustValueToStep(newValue));
    }
  };

  const adjustValueToStep = (value) => {
    if (linear) {
      return Math.round(value / step) * step;
    } else {
      const range = max - min;
      const logarithmicStep = Math.max(range * 0.001, step) * (1 + Math.log1p((value - min) / range) / Math.log(100));
      return Math.round(value / logarithmicStep) * logarithmicStep;
    }
  };

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const getDecimalPlaces = () => {
    if (step >= 0.01) return 0;
    if (step >= 0.001) return 1;
    return 2;
  };

  const getDisplayValue = () => {
    const decimalPlaces = getDecimalPlaces();
    if (showAsPercent) {
      return `${((value - min) / (max - min) * 100).toFixed(decimalPlaces)}%`;
    }
    return value.toFixed(2);
  };

  const getSliderWidth = () => {
    return `${valueToPosition(value) * 100}%`;
  };

  // Function to disable body scroll
  const disableBodyScroll = useCallback(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';
  }, []);

  // Function to enable body scroll
  const enableBodyScroll = useCallback(() => {
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      if (isInteracting) {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        handleSliderInteraction(clientX);
      }
    };

    const handleEnd = () => {
      setIsInteracting(false);
    };

    if (isInteracting) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('pointerup', handleEnd);
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('pointerup', handleEnd);
      enableBodyScroll();
    };
  }, [isInteracting, disableBodyScroll, enableBodyScroll]);

  const handleStart = (e) => {
    setIsInteracting(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    handleSliderInteraction(clientX);
  };

  return (
    <div className="p-2 bg-gray-300 rounded-md w-80 inline-block mr-1" style={{position: 'relative'}}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        <span className="text-sm font-medium text-white select-none">
          {label}: {getDisplayValue()}
        </span>
      </div>
      <div 
        className="relative h-6 bg-gray-500 rounded-sm cursor-pointer" 
        ref={sliderRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        onPointerDown={handleStart}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-sm"
          style={{ width: getSliderWidth() }}
        />
        <div 
          className="absolute top-0 right-0 w-4 h-full bg-white rounded-full shadow-md cursor-grab opacity-0"
          style={{ left: getSliderWidth(), transform: 'translateX(-50%)' }}
        />
      </div>
    </div>
  );
};

export default StyledSlider;