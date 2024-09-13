import Brush from "./Brush";
import { loadAbrBrushes as loadBrushes } from "abr-js";

export const loadAbrBrushes = async (file: File): Promise<Brush[]> => {
  const abrBrushes = await loadBrushes(file);
  return abrBrushes.map(convertAbrToBrush);
};

export function convertAbrToBrush(abrBrush: any): Brush {
  const commonProps = {
    id: crypto.randomUUID(),
    name: abrBrush.name,
    modifier: {
      spacing: abrBrush.spacing,
    },
    blendMode: "normal", // Default blend mode
  } as { [key: string]: any };

  if (abrBrush.brushType === 2) {
    // Sampled Brush
    return new Brush({
      ...commonProps,
      type: "stamp",
      stamp: abrBrush.brushTipImage, // Using the brushTipImage as the stamp
      antiAliasing: abrBrush.antiAliasing,
      valid: abrBrush.valid,
    });
  } else if (abrBrush.brushType === 1) {
    // Computed Brush
    return new Brush({
      ...commonProps,
      type: "computed", // We'll add 'computed' as a new brush type
      diameter: abrBrush.diameter,
      roundness: abrBrush.roundness,
      angle: abrBrush.angle,
      hardness: abrBrush.hardness,
    });
  }
}
