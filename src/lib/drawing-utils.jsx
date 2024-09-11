// drawing-utils.js

import pako from "pako";
import { getStroke } from "perfect-freehand";
import polygonClipping from "polygon-clipping";

export const MIN_DISTANCE = 1; // Minimum distance between points in pixels

export const parseColorHistory = () => {
  const history = localStorage.getItem("colorHistory");
  return history ? JSON.parse(history) : [];
};

export const average = (a, b) => (a + b) / 2;

export function _getSvgPathFromStroke(points, closed = true) {
  const len = points.length;

  if (len < 4) {
    return ``;
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(
    2
  )} T`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
  }

  if (closed) {
    result += "Z";
  }

  return result;
}

export function getSvgPathFromStroke(stroke) {
  try {
    const faces = polygonClipping.union([stroke]);
    const d = [];
    faces.forEach((face) =>
      face.forEach((points) => {
        d.push(_getSvgPathFromStroke(points));
      })
    );
    return d.join(" ");
  } catch (error) {
    console.warn("Polygon clipping failed, falling back to original stroke:", error);
    return _getSvgPathFromStroke(stroke);
  }
}

export const getStrokePoints = (stroke, size) => {
  return getStroke(stroke, {
    size: size,
    smoothing: 0.5,
    thinning: 0.5,
    streamline: 0.5,
    simulatePressure: false,
    easing: (t) => t,
    start: {
      taper: 0,
      cap: true,
    },
    end: {
      taper: 0,
      cap: true,
    },
  });
};

export const drawStroke = (ctx, strokePoints, strokeColor, strokeOpacity) => {
  ctx.fillStyle = strokeColor;
  ctx.globalAlpha = strokeOpacity;

  const pathData = getSvgPathFromStroke(strokePoints);
  const path = new Path2D(pathData);
  ctx.fill(path);
  ctx.globalAlpha = 1;
};

export const saveDrawing = (strokes) => {
  const data = JSON.stringify(strokes);
  const compressed = pako.gzip(data);
  const blob = new Blob([compressed], { type: "application/gzip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "drawing.json.gz";
  link.click();
  URL.revokeObjectURL(url);
};

export const loadDrawing = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const compressed = new Uint8Array(event.target.result);
        const decompressed = pako.ungzip(compressed, { to: "string" });
        const loadedStrokes = JSON.parse(decompressed);
        resolve(loadedStrokes);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const EraserIcon = (props) => (
  <span {...props}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 13L11 20L4 13L11 6L18 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 20H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

export const RefreshCcw = (props) => (
  <span {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
    </svg>
  </span>
);

const colorConversionCanvas = document.createElement("canvas");
const colorConversionCtx = colorConversionCanvas.getContext("2d");

export const anyToRgb = (color) => {
  colorConversionCtx.fillStyle = color;
  let hex = colorConversionCtx.fillStyle;

  hex = hex.replace(/^#/, "");

  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    // Short notation
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    // Full notation
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    console.error("Invalid hex color");
    return [0, 0, 0];
  }

  return [r, g, b];
};
