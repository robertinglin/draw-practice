import Brush from "../lib/brushes/Brush";

type Point = [number, number, number];

interface Stroke {
  id: string;
  type: "draw" | "erase";
  points: Point[];
  opacity: number;
  brushSize: number;
  color: string;
  brushType: string;
}

interface Layer {
  id: string;
  visible: boolean;
  blendMode: string;
  strokes: Stroke[];
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
    modifier: { scatter: 20 },
  }),
} as { [key: string]: Brush };

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  brushes[stroke.brushType].applyStroke(ctx, stroke.points, {
    size: stroke.brushSize,
    opacity: stroke.opacity,
    color: stroke.type === "erase" ? "black" : stroke.color,
    eraser: stroke.type === "erase",
  });
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
    const lastDrawnIndex = layer.strokes.findIndex((stroke) => stroke.id === lastDrawnStrokeId);

    // If lastDrawnStrokeId is not found or doesn't match the last stroke, redraw everything
    if (lastDrawnIndex === -1 || lastDrawnIndex !== layer.strokes.length - 1) {
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
  activeStroke?: Stroke & { layerId: string }
): CanvasCache {
  const canvasCache: CanvasCache = prevCanvasCache || {};

  state.layers.forEach((layer) => {
    if (!canvasCache[layer.id]) {
      canvasCache[layer.id] = {
        canvas: createCanvas(width, height),
        lastDrawnStrokeId: null,
      };
    }

    if (layer.visible) {
      const { canvas, lastDrawnStrokeId } = canvasCache[layer.id];
      const newLastDrawnStrokeId = drawNewStrokes(canvas, layer, lastDrawnStrokeId);
      canvasCache[layer.id].lastDrawnStrokeId = newLastDrawnStrokeId;

      if (activeStroke && activeStroke.layerId === layer.id) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawStroke(ctx, activeStroke);
        }
      }
    }
  });

  return canvasCache;
}
