import Brush from "../lib/brushes/Brush";
import { anyToRgb } from "./drawing-utils";

type Point = [number, number, number];

interface Stroke {
  id: string;
  type: "draw" | "erase" | "fill";
  points: Point[];
  opacity: number;
  brushSize: number;
  color: string;
  brushType: string;
}

interface FillStroke extends Omit<Stroke, "brushSize" | "brushType"> {
  type: "fill";
  points: [Point];
  tolerance: number;
  contiguous: boolean;
}

type AnyStroke = Stroke | FillStroke;

interface Layer {
  id: string;
  visible: boolean;
  blendMode: string;
  strokes: AnyStroke[];
}

interface DrawingState {
  layers: Layer[];
}

interface CanvasCache {
  [key: string]: {
    canvas: HTMLCanvasElement;
    lastDrawnStrokeId: string | null;
  };
}

const brushes = {
  standard: new Brush({ type: "standard", name: "Standard Brush" }),
  airbrush: new Brush({
    type: "softbrush",
    name: "Airbrush",
  }),
} as { [key: string]: Brush };

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: AnyStroke): void {
  if (stroke.type === "fill") {
    fillArea(ctx, stroke as FillStroke);
  } else {
    brushes[stroke.brushType].applyStroke(ctx, stroke.points, {
      size: stroke.brushSize,
      opacity: stroke.opacity,
      color: stroke.type === "erase" ? "black" : stroke.color,
      eraser: stroke.type === "erase",
    });
  }
}
function fillArea(ctx: CanvasRenderingContext2D, fillStroke: FillStroke): void {
  const [startPoint] = fillStroke.points;
  const startX = Math.round(startPoint[0]);
  const startY = Math.round(startPoint[1]);
  const startColor = getPixelColor(ctx, startX, startY);
  const fillColor = anyToRgb(fillStroke.color);
  const fillColorWithOpacity = [...fillColor, Math.round(fillStroke.opacity * 255)];

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const { width, height } = ctx.canvas;

  if (fillStroke.contiguous) {
    const visited = new Set<number>();
    const pixelStack: number[] = [startX, startY];

    while (pixelStack.length > 0) {
      const y = pixelStack.pop()!;
      const x = pixelStack.pop()!;
      const currentIndex = (y * width + x) * 4;

      if (visited.has(currentIndex)) continue;

      if (colorMatch(imageData.data, currentIndex, startColor, fillStroke.tolerance)) {
        setPixelColor(imageData.data, currentIndex, fillColorWithOpacity);
        visited.add(currentIndex);

        if (x > 0) pixelStack.push(x - 1, y);
        if (x < width - 1) pixelStack.push(x + 1, y);
        if (y > 0) pixelStack.push(x, y - 1);
        if (y < height - 1) pixelStack.push(x, y + 1);
      }
    }
  } else {
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (colorMatch(imageData.data, i, startColor, fillStroke.tolerance)) {
        setPixelColor(imageData.data, i, fillColorWithOpacity);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function getPixelColor(ctx: CanvasRenderingContext2D, x: number, y: number): number[] {
  const imageData = ctx.getImageData(x, y, 1, 1);
  return Array.from(imageData.data);
}

function hexToRgba(hex: string, opacity: number): number[] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, Math.round(opacity * 255)];
}

function colorMatch(data: Uint8ClampedArray, index: number, target: number[], tolerance: number): boolean {
  const r = Math.abs(data[index] - target[0]);
  const g = Math.abs(data[index + 1] - target[1]);
  const b = Math.abs(data[index + 2] - target[2]);
  return Math.max(r, g, b) <= tolerance * 255;
}

function setPixelColor(data: Uint8ClampedArray, index: number, color: number[]): void {
  data[index] = color[0];
  data[index + 1] = color[1];
  data[index + 2] = color[2];
  data[index + 3] = color[3];
}

function drawLayer(canvas: HTMLCanvasElement, layer: Layer): string | null {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layer.strokes.forEach((stroke) => drawStroke(ctx, stroke));
    return layer.strokes.length > 0 ? layer.strokes[layer.strokes.length - 1].id : null;
  }
  return null;
}

function drawNewStrokes(canvas: HTMLCanvasElement, layer: Layer, lastDrawnStrokeId: string | null): string | null {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    if (layer.strokes.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return null;
    }

    const lastDrawnIndex = layer.strokes.findIndex((stroke) => stroke.id === lastDrawnStrokeId);
    if (lastDrawnIndex === -1) {
      return drawLayer(canvas, layer);
    }

    // Otherwise, just draw the new strokes
    const newStrokes = layer.strokes.slice(lastDrawnIndex + 1);
    newStrokes.forEach((stroke) => drawStroke(ctx, stroke));

    return newStrokes.length > 0 ? newStrokes[newStrokes.length - 1].id : lastDrawnStrokeId;
  }
  return lastDrawnStrokeId;
}

export default function draw(
  width: number,
  height: number,
  state: DrawingState,
  prevCanvasCache?: CanvasCache,
  activeStroke?: AnyStroke & { layerId: string }
): CanvasCache {
  const canvasCache: CanvasCache = prevCanvasCache || {};

  state.layers.forEach((layer) => {
    if (!canvasCache[layer.id]) {
      canvasCache[layer.id] = {
        canvas: createCanvas(width, height),
        lastDrawnStrokeId: null,
      };
    }
    if (canvasCache["@" + layer.id]) {
      canvasCache[layer.id] = canvasCache["@" + layer.id];
      delete canvasCache["@" + layer.id];
    }

    if (layer.visible) {
      const { canvas, lastDrawnStrokeId } = canvasCache[layer.id];
      const newLastDrawnStrokeId = drawNewStrokes(canvas, layer, lastDrawnStrokeId);
      canvasCache[layer.id].lastDrawnStrokeId = newLastDrawnStrokeId;

      if (activeStroke && activeStroke.layerId === layer.id) {
        canvasCache["@" + layer.id] = canvasCache[layer.id];
        canvasCache[layer.id] = {
          canvas: createCanvas(width, height),
          lastDrawnStrokeId: null,
        };

        const overlayCanvas = canvasCache[layer.id].canvas;

        const ctx = overlayCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, 0);
        if (ctx) {
          drawStroke(ctx, activeStroke);
        }
      }
    }
  });

  return canvasCache;
}
