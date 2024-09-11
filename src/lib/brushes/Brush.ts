// Brush.ts

import { getStroke } from "perfect-freehand";
import DeterministicRandom from "./deterministic-random";
import { anyToRgb, drawStroke } from "../drawing-utils";

function rgbToHsb(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, v];
}

function hsbToRgb(h: number, s: number, v: number): [number, number, number] {
  let r = 0,
    g = 0,
    b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function bilinearInterpolation(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  q11: [number, number, number],
  q12: [number, number, number],
  q21: [number, number, number],
  q22: [number, number, number]
): [number, number, number] {
  const x2x1 = x2 - x1;
  const y2y1 = y2 - y1;
  const x2x = x2 - x;
  const y2y = y2 - y;
  const yy1 = y - y1;
  const xx1 = x - x1;
  return [
    (q11[0] * x2x * y2y + q21[0] * xx1 * y2y + q12[0] * x2x * yy1 + q22[0] * xx1 * yy1) / (x2x1 * y2y1),
    (q11[1] * x2x * y2y + q21[1] * xx1 * y2y + q12[1] * x2x * yy1 + q22[1] * xx1 * yy1) / (x2x1 * y2y1),
    (q11[2] * x2x * y2y + q21[2] * xx1 * y2y + q12[2] * x2x * yy1 + q22[2] * xx1 * yy1) / (x2x1 * y2y1),
  ];
}

type BrushType = "standard" | "stamp" | "airbrush" | "texture" | "softbrush";
type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

interface BrushModifier {
  jitter?: number;
  scatter?: number;
  hueShift?: number;
  rotation?: number;
  spacing?: number;
  pressure?: number;
}

type Point = [number, number, number]; // [x, y, pressure]

interface StrokeOptions {
  size: number;
  opacity: number;
  color: string;
  variablePressure: boolean;
  eraser: boolean;
}

class Brush {
  id: string;
  name: string;
  type: BrushType;
  blendMode: BlendMode;
  modifier: BrushModifier;
  texture?: HTMLImageElement;
  stamp?: HTMLImageElement;
  fillCount = 0;

  constructor(params: Partial<Brush>) {
    this.id = params.id || crypto.randomUUID();
    this.name = params.name || "Untitled Brush";
    this.type = params.type || "standard";
    this.blendMode = params.blendMode || "normal";
    this.modifier = params.modifier || {};
    this.texture = params.texture;
    this.stamp = params.stamp;
  }

  applyStroke(ctx: CanvasRenderingContext2D, points: Point[], options: StrokeOptions): void {
    if (points.length === 0) return;

    if (options.eraser) {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = this.blendMode === "normal" ? "source-over" : this.blendMode;
    }

    // Use the first point's coordinates as seed for our PRNG
    const [seedX, seedY] = points[0];
    const seed = seedX * 1000000 + seedY;
    const random = new DeterministicRandom(seed);

    this.fillCount = 0;

    switch (this.type) {
      case "standard":
        this.applyStandardStroke(ctx, points, options);
        break;
      case "stamp":
        this.applyStampStroke(ctx, points, options, random);
        break;
      case "airbrush":
        this.applyAirbrushStroke(ctx, points, options, random);
        break;
      case "texture":
        this.applyTextureStroke(ctx, points, options, random);
        break;

      case "softbrush":
        this.applySoftBrushStroke(ctx, points, options);
        break;
    }

    // console.log(this.fillCount);

    ctx.globalCompositeOperation = "source-over";
  }

  private applyStandardStroke(ctx: CanvasRenderingContext2D, points: Point[], options: StrokeOptions): void {
    if (this.modifier.pressure) {
      points = points.map(([x, y, p]) => [x, y, this.modifier.pressure]);
    }
    const stroke = getStroke(points, {
      size: options.size,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: false,
      easing: (t) => t,
      start: {
        taper: 0,
        easing: (t) => t,
        cap: true,
      },
      end: {
        taper: 0,
        easing: (t) => t,
        cap: true,
      },
    });
    drawStroke(ctx, stroke, options.color, options.opacity);
  }

  private applyStampStroke(ctx: CanvasRenderingContext2D, points: Point[], options: StrokeOptions, random: DeterministicRandom): void {
    if (!this.stamp) return;

    const { spacing = options.size, rotation = 0 } = this.modifier;
    let distance = 0;

    for (let i = 1; i < points.length; i++) {
      const [x0, y0, p0] = points[i - 1];
      const [x1, y1, p1] = points[i];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      while (distance < segmentLength) {
        const t = distance / segmentLength;
        const x = x0 + dx * t;
        const y = y0 + dy * t;
        const pressure = p0 + (p1 - p0) * t;

        const size = options.size * pressure;
        ctx.globalAlpha = options.opacity * pressure;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation + random.random() * Math.PI * 2);
        ctx.drawImage(this.stamp, -size / 2, -size / 2, size, size);
        ctx.restore();

        distance += spacing;
      }
      distance -= segmentLength;
    }
  }

  private applyAirbrushStroke(
    ctx: CanvasRenderingContext2D,
    points: [number, number, number][],
    options: {
      size: number;
      opacity: number;
      color: string;
      scatter?: number;
      hueShift?: number;
    },
    random: { random: () => number }
  ): void {
    const baseColor = anyToRgb(options.color) as [number, number, number];
    const baseHsb = rgbToHsb(...baseColor);

    options = {
      hueShift: 0,
      scatter: options.size * 0.75,
      ...options,
    };

    for (const [x, y, pressure] of points) {
      const particleCount = Math.floor(20 * pressure);

      // Create a small quadrilateral around the current point
      const halfSize = (options.size * pressure) / 2;
      const corners = [
        [x - halfSize, y - halfSize],
        [x + halfSize, y - halfSize],
        [x + halfSize, y + halfSize],
        [x - halfSize, y + halfSize],
      ];

      // Calculate HSB values for corners with some randomness
      const cornerColors = corners.map(() => {
        const hue = (baseHsb[0] + options.hueShift + (random.random() - 0.5) * 0.1 + 1) % 1;
        const saturation = Math.max(0, Math.min(1, baseHsb[1] + (random.random() - 0.5) * 0.2));
        const brightness = Math.max(0, Math.min(1, baseHsb[2] + (random.random() - 0.5) * 0.2));
        return [hue, saturation, brightness] as [number, number, number];
      });

      for (let i = 0; i < particleCount; i++) {
        const offsetX = (random.random() - 0.5) * options.scatter * pressure;
        const offsetY = (random.random() - 0.5) * options.scatter * pressure;
        const px = x + offsetX;
        const py = y + offsetY;

        // Bilinear interpolation for color
        const normalizedX = (px - (x - halfSize)) / (2 * halfSize);
        const normalizedY = (py - (y - halfSize)) / (2 * halfSize);
        const interpolatedHsb = bilinearInterpolation(normalizedX, normalizedY, 0, 0, 1, 1, cornerColors[0], cornerColors[1], cornerColors[3], cornerColors[2]);

        const [r, g, b] = hsbToRgb(...interpolatedHsb);

        const radius = (random.random() * options.size * pressure) / 10;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.globalAlpha = options.opacity * pressure * 0.1;
        ctx.fill();
      }
    }
  }
  private applyTextureStroke(ctx: CanvasRenderingContext2D, points: Point[], options: StrokeOptions, random: DeterministicRandom): void {
    if (!this.texture) return;

    const { spacing = options.size, rotation = 0 } = this.modifier;
    let distance = 0;

    for (let i = 1; i < points.length; i++) {
      const [x0, y0, p0] = points[i - 1];
      const [x1, y1, p1] = points[i];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      while (distance < segmentLength) {
        const t = distance / segmentLength;
        const x = x0 + dx * t;
        const y = y0 + dy * t;
        const pressure = p0 + (p1 - p0) * t;

        const size = options.size * pressure;
        ctx.globalAlpha = options.opacity * pressure;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation + random.random() * Math.PI * 2);
        ctx.drawImage(this.texture, -size / 2, -size / 2, size, size);
        ctx.restore();

        distance += spacing;
      }
      distance -= segmentLength;
    }
  }
  private addAdditionalPoints(points: Point[], options: { size: number }): Point[] {
    if (points.length < 2) return points;
    const radius = options.size / 2;
    const result: Point[] = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const [x1, y1] = prevPoint;
      const [x2, y2] = currentPoint;
      const distance = Math.hypot(x2 - x1, y2 - y1);
      const maxDistance = radius * 0.3; // Adjust this factor as needed
      if (distance > maxDistance) {
        const numInterpolatedPoints = Math.ceil(distance / maxDistance);
        for (let j = 1; j <= numInterpolatedPoints; j++) {
          const t = j / (numInterpolatedPoints + 1);
          const x = x1 + (x2 - x1) * t;
          const y = y1 + (y2 - y1) * t;
          const pressure = prevPoint[2] + (currentPoint[2] - prevPoint[2]) * t;
          result.push([x, y, pressure]);
        }
      }
      result.push(currentPoint);
    }
    return result;
  }

  private applySoftBrushStroke(ctx: CanvasRenderingContext2D, points: Point[], options: StrokeOptions): void {
    points = this.addAdditionalPoints(points, options);
    const baseColor = anyToRgb(options.color);
    const radius = options.size / 2;
    const minDistance = radius / 3;
    const gradientCache = new Map<number, CanvasGradient>();
    const getGradient = (pressure: number): CanvasGradient => {
      const key = Math.round(pressure * 20) / 20; // Round to nearest 0.05
      if (!gradientCache.has(key)) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        const innerOpacity = options.opacity * pressure * 0.5;
        gradient.addColorStop(0, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${innerOpacity})`);
        gradient.addColorStop(0.6, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${innerOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0)`);
        gradientCache.set(key, gradient);
      }
      return gradientCache.get(key)!;
    };
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastPressure = 0;
    ctx.save();
    for (let i = 0; i < points.length; i++) {
      const [x, y, pressure] = points[i];
      const distance = lastX !== null ? Math.hypot(x - lastX, y - lastY) : 0;
      const pressureDiff = Math.abs(pressure - lastPressure);
      if (lastX === null || distance >= minDistance || pressureDiff >= 0.05) {
        ctx.fillStyle = getGradient(pressure);
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.translate(-x, -y);
        this.fillCount++;
        lastX = x;
        lastY = y;
        lastPressure = pressure;
      }
    }
    ctx.restore();
  }
}

export default Brush;
