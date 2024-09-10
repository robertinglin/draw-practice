import { useState, useCallback, useMemo, useEffect } from 'react';

export interface Layer {
  id: number;
  strokes: Stroke[];
  visible: boolean;
  blendMode: string;
}

export interface Stroke {
  type: 'draw' | 'erase';
  points: [number, number, number][];
  opacity: number;
  brushSize: number;
  color: string;
}

interface LayersState {
  layers: Layer[];
  activeLayer: number;
}

const layersStore: { [fileId: string]: LayersState } = {};
const listeners: { [fileId: string]: Set<() => void> } = {};

const notifyListeners = (fileId: string) => {
  listeners[fileId]?.forEach(listener => listener());
};

export const useLayers = (fileId: string, initialLayers: Layer[] = []) => {
  const [, forceUpdate] = useState({});

  const state = useMemo(() => {
    if (!layersStore[fileId]) {
      layersStore[fileId] = {
        layers: initialLayers.length > 0 ? initialLayers : [{ id: 1, strokes: [], visible: true, blendMode: 'normal' }],
        activeLayer: 1
      };
    }
    return layersStore[fileId];
  }, [fileId, initialLayers]);

  useEffect(() => {
    if (!listeners[fileId]) {
      listeners[fileId] = new Set();
    }
    listeners[fileId].add(forceUpdate as () => void);
    return () => {
      listeners[fileId].delete(forceUpdate as () => void);
      if (listeners[fileId].size === 0) {
        delete listeners[fileId];
      }
    };
  }, [fileId]);

  const setLayers = useCallback((newLayers: Layer[]) => {
    state.layers = newLayers;
    notifyListeners(fileId);
  }, [state, fileId]);

  const setActiveLayer = useCallback((layerId: number) => {
    state.activeLayer = layerId;
    notifyListeners(fileId);
  }, [state, fileId]);

  const addLayer = useCallback(() => {
    setLayers([
      ...state.layers,
      {
        id: state.layers.length + 1,
        strokes: [],
        visible: true,
        blendMode: 'normal'
      }
    ]);
  }, [state, setLayers]);

  const removeLayer = useCallback((layerId: number) => {
    const updatedLayers = state.layers.filter(layer => layer.id !== layerId);
    setLayers(updatedLayers);
    if (state.activeLayer === layerId && updatedLayers.length > 0) {
      setActiveLayer(updatedLayers[0].id);
    }
  }, [state, setLayers, setActiveLayer]);

  const toggleLayerVisibility = useCallback((layerId: number) => {
    setLayers(state.layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  }, [state, setLayers]);

  const changeLayerBlendMode = useCallback((layerId: number, blendMode: string) => {
    setLayers(state.layers.map(layer =>
      layer.id === layerId ? { ...layer, blendMode } : layer
    ));
  }, [state, setLayers]);

  const addStrokeToLayer = useCallback((layerId: number, stroke: Stroke) => {
    setLayers(state.layers.map(layer =>
      layer.id === layerId ? { ...layer, strokes: [...layer.strokes, stroke] } : layer
    ));
  }, [state, setLayers]);

  const undoLastStroke = useCallback(() => {
    setLayers(state.layers.map(layer =>
      layer.id === state.activeLayer ? { ...layer, strokes: layer.strokes.slice(0, -1) } : layer
    ));
  }, [state, setLayers]);

  return {
    layers: state.layers,
    activeLayer: state.activeLayer,
    setActiveLayer,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    changeLayerBlendMode,
    addStrokeToLayer,
    undoLastStroke
  };
};