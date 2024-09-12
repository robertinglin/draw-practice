import React, { useRef, useEffect, useState, useCallback } from "react";
import DraggableContainer from "./DraggableContainer";
import useDisableScrollOnDrag from "../../hooks/useDisableScrollOnDrag";

const hslStringToHSL = (hslString) => {
  const match = hslString.match(/^hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)$/);
  if (!match) return [0, 100, 50];
  return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])];
};

const hslToHslString = ([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`;

const AdvancedColorSelector = ({ value = "hsl(0, 100%, 50%)", onChange, quickSwatches = [] }) => {
  const [colorPosition, setColorPosition] = useState(() => {
    const savedPosition = localStorage.getItem("colorPosition");
    return savedPosition ? JSON.parse(savedPosition) : { x: 20, y: 20, w: 260, h: 300 };
  });

  const onMove = (x, y, w, h) => {
    setColorPosition({ x, y, w, h });
    localStorage.setItem("colorPosition", JSON.stringify({ x, y, w, h }));
  };

  const wheelRef = useRef(null);
  const slRef = useRef(null);
  const [hsl, setHsl] = useState(() => hslStringToHSL(value));
  const [dragTarget, setDragTarget] = useState(null);

  useDisableScrollOnDrag(!!dragTarget);

  const wheelSize = 200;
  const wheelThickness = 20;
  const slSize = 112;

  const hslRef = useRef(hsl);
  hslRef.current = hsl;

  useEffect(() => {
    drawWheel();
    drawSlSpace();
  }, [hsl]);

  useEffect(() => {
    const newHsl = hslStringToHSL(value);
    setHsl(newHsl);
  }, [value]);

  const drawWheel = useCallback(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const center = wheelSize / 2;
    const outerRadius = center;
    const innerRadius = center - wheelThickness;

    ctx.clearRect(0, 0, wheelSize, wheelSize);

    for (let i = 0; i < 360; i++) {
      const angle = (i - 180) * (Math.PI / 180);
      ctx.beginPath();
      ctx.arc(center, center, outerRadius, angle, angle + 0.03);
      ctx.arc(center, center, innerRadius, angle + 0.03, angle, true);
      ctx.fillStyle = `hsl(${i}, 100%, 50%)`;
      ctx.fill();
    }

    // Draw hue indicator
    const hueAngle = (hsl[0] - 180) * (Math.PI / 180);
    const indicatorOuterX = center + outerRadius * Math.cos(hueAngle);
    const indicatorOuterY = center + outerRadius * Math.sin(hueAngle);
    const indicatorInnerX = center + innerRadius * Math.cos(hueAngle);
    const indicatorInnerY = center + innerRadius * Math.sin(hueAngle);

    // Draw black outline
    ctx.beginPath();
    ctx.moveTo(indicatorInnerX, indicatorInnerY);
    ctx.lineTo(indicatorOuterX, indicatorOuterY);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw white center
    ctx.beginPath();
    ctx.moveTo(indicatorInnerX, indicatorInnerY);
    ctx.lineTo(indicatorOuterX, indicatorOuterY);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [hsl, wheelSize, wheelThickness]);

  const getColorAtPosition = (x, y, hue, size) => {
    x = Math.max(0, Math.min(x, size));
    y = Math.max(0, Math.min(y, size));

    const s = (x / size) * 100;
    const v = 100 - (y / size) * 100;

    if (x === 0 && y === 0) return `hsl(${hue}, 0%, 100%)`;
    if (y === size) return `hsl(${hue}, ${s}%, 0%)`;

    const l = (v * (200 - s)) / 200;
    const adjustedS = v === 0 ? 0 : (s * v) / (l < 50 ? l * 2 : 200 - l * 2);

    return `hsl(${hue}, ${adjustedS}%, ${l}%)`;
  };

  const getPositionAtColor = (color, size) => {
    const [hue, s, l] = hslStringToHSL(color);

    if (l === 0) return { x: (s / 100) * size, y: size, hue };

    const v = l + (s * Math.min(l, 100 - l)) / 100;
    const s_hsv = v === 0 ? 0 : 2 * (1 - l / v);

    return { x: s_hsv * size, y: ((100 - v) / 100) * size, hue };
  };

  const drawSlSpace = useCallback(() => {
    const canvas = slRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    for (let x = 0; x < slSize; x++) {
      for (let y = 0; y < slSize; y++) {
        ctx.fillStyle = getColorAtPosition(x, y, hsl[0], slSize);
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const { x, y } = getPositionAtColor(hslToHslString(hslRef.current), slSize);

    // Draw SL selector with black and white outline
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsl]);
  const handlePointerDown = (e, target) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (target === "wheel") {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const outerRadius = wheelSize / 2;
      const innerRadius = outerRadius - wheelThickness;

      if (distance >= innerRadius && distance <= outerRadius) {
        setDragTarget("wheel");
        handleHueChange(x, y);
      }
    } else if (target === "sl") {
      setDragTarget("sl");
      handleSlChange(x, y);
    }
  };

  const handlePointerMove = useCallback(
    (e) => {
      if (dragTarget) {
        let x, y;
        if (dragTarget === "wheel") {
          const rect = wheelRef.current.getBoundingClientRect();
          x = e.clientX - rect.left;
          y = e.clientY - rect.top;
          handleHueChange(x, y);
        } else if (dragTarget === "sl") {
          const rect = slRef.current.getBoundingClientRect();
          x = Math.max(0, Math.min(slSize, e.clientX - rect.left));
          y = Math.max(0, Math.min(slSize, e.clientY - rect.top));
          handleSlChange(x, y);
        }
      }
    },
    [dragTarget]
  );

  const handleHueChange = (x, y) => {
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const angle = Math.atan2(y - centerY, x - centerX);
    const hue = ((angle * 180) / Math.PI + 180) % 360;
    setHsl([hue, hsl[1], hsl[2]]);
  };
  const handleSlChange = (x, y) => {
    const color = getColorAtPosition(x, y, hslRef.current[0], slSize);
    const [, newS, newL] = hslStringToHSL(color);
    setHsl([hslRef.current[0], newS, newL]);
  };

  const handlePointerUp = () => {
    if (dragTarget) {
      const currentHsl = hslToHslString(hslRef.current);
      onChange?.(currentHsl);
    }
    setDragTarget(null);
  };

  useEffect(() => {
    if (dragTarget) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    }
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragTarget, handlePointerMove]);

  const currentHsl = hslToHslString(hsl);

  return (
    <DraggableContainer
      initialX={colorPosition.x}
      initialY={colorPosition.y}
      minWidth={260}
      minHeight={300}
      initialHeight={colorPosition.h}
      initialWidth={colorPosition.w}
      onMove={onMove}
    >
      <div className="mb-2">Advanced Color Selector</div>
      <div className="relative h-full">
        <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
          <canvas
            ref={wheelRef}
            width={wheelSize}
            height={wheelSize}
            className="absolute top-0 left-0 cursor-pointer"
            onPointerDown={(e) => handlePointerDown(e, "wheel")}
          />
          <canvas
            ref={slRef}
            width={slSize}
            height={slSize}
            className="absolute cursor-pointer"
            style={{
              top: (wheelSize - slSize) / 2,
              left: (wheelSize - slSize) / 2,
            }}
            onPointerDown={(e) => handlePointerDown(e, "sl")}
          />
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <div className="w-8 h-8 rounded-sm border border-gray-600" style={{ backgroundColor: currentHsl }}></div>
        </div>

        {/* Quick Swatches */}
        <div className="absolute top-0 bottom-0 right-0 w-8 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <div className="flex flex-col space-y-1 py-1">
            {quickSwatches.map((color, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-sm cursor-pointer border border-gray-600 mx-auto"
                style={{ backgroundColor: color }}
                onClick={() => {
                  const newHsl = hslStringToHSL(color);
                  setHsl(newHsl);
                  onChange?.(color);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </DraggableContainer>
  );
};

export default AdvancedColorSelector;
