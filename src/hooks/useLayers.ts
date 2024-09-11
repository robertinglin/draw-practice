import { useState, useCallback, useMemo, useEffect } from "react";

export interface Layer {
  id: number;
  strokes: Stroke[];
  visible: boolean;
  blendMode: string;
}

export interface Stroke {
  type: "draw" | "erase";
  points: [number, number, number][];
  opacity: number;
  brushSize: number;
  color: string;
}

interface Action {
  type: "ADD_LAYER" | "REMOVE_LAYER" | "TOGGLE_VISIBILITY" | "CHANGE_BLEND_MODE" | "ADD_STROKE" | "SET_ACTIVE_LAYER";
  layerId?: number;
  data?: any;
  prevState?: Partial<LayersState>;
}

interface LayersState {
  layers: Layer[];
  activeLayer: number;
  history: Action[];
  historyIndex: number;
}

const layersStore: { [fileId: string]: LayersState } = {};
const listeners: { [fileId: string]: Set<() => void> } = {};

const notifyListeners = (fileId: string) => {
  listeners[fileId]?.forEach((listener) => listener());
};

export const useLayers = (fileId: string, initialLayers: Layer[] = []) => {
  const [, forceUpdate] = useState({});

  const state = useMemo(() => {
    if (!layersStore[fileId]) {
      const initialState = {
        layers: initialLayers.length > 0 ? initialLayers : [{ id: 1, strokes: [], visible: true, blendMode: "normal" }],
        activeLayer: 1,
        history: [] as Action[],
        historyIndex: -1,
      };
      layersStore[fileId] = initialState;
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

  const updateState = useCallback(
    (newState: Partial<LayersState>) => {
      Object.assign(state, newState);
      notifyListeners(fileId);
    },
    [state, fileId]
  );

  const pushAction = useCallback(
    (action: Action) => {
      const prevState = {
        layers: JSON.parse(JSON.stringify(state.layers)),
        activeLayer: state.activeLayer,
      };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ ...action, prevState });
      updateState({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },
    [state, updateState]
  );

  const applyAction = useCallback(
    (action: Action, isUndo: boolean = false) => {
      let newState: Partial<LayersState> = {};

      switch (action.type) {
        case "ADD_LAYER":
          if (isUndo) {
            newState.layers = state.layers.filter((layer) => layer.id !== action.data.id);
            newState.activeLayer = action.prevState!.activeLayer;
          } else {
            newState.layers = [...state.layers, action.data];
            newState.activeLayer = action.data.id;
          }
          break;
        case "REMOVE_LAYER":
          if (isUndo) {
            newState.layers = [...state.layers, action.data];
            newState.activeLayer = action.prevState!.activeLayer;
          } else {
            newState.layers = state.layers.filter((layer) => layer.id !== action.layerId);
            newState.activeLayer = state.activeLayer === action.layerId ? state.layers[state.layers.length - 1].id : state.activeLayer;
          }
          break;
        case "TOGGLE_VISIBILITY":
          newState.layers = state.layers.map((layer) => (layer.id === action.layerId ? { ...layer, visible: !layer.visible } : layer));
          break;
        case "CHANGE_BLEND_MODE":
          newState.layers = state.layers.map((layer) =>
            layer.id === action.layerId
              ? { ...layer, blendMode: isUndo ? action.prevState!.layers.find((l) => l.id === action.layerId)!.blendMode : action.data }
              : layer
          );
          break;
        case "ADD_STROKE":
          if (isUndo) {
            newState.layers = state.layers.map((layer) => (layer.id === action.layerId ? { ...layer, strokes: layer.strokes.slice(0, -1) } : layer));
          } else {
            newState.layers = state.layers.map((layer) => (layer.id === action.layerId ? { ...layer, strokes: [...layer.strokes, action.data] } : layer));
          }
          break;
        case "SET_ACTIVE_LAYER":
          newState.activeLayer = isUndo ? action.prevState!.activeLayer : action.layerId!;
          break;
      }

      updateState(newState);
    },
    [state, updateState]
  );

  const undo = useCallback(() => {
    if (state.historyIndex >= 0) {
      const action = state.history[state.historyIndex];
      applyAction(action, true);
      updateState({ historyIndex: state.historyIndex - 1 });
    }
  }, [state, applyAction, updateState]);

  const redo = useCallback(() => {
    if (state.historyIndex < state.history.length - 1) {
      const action = state.history[state.historyIndex + 1];
      applyAction(action);
      updateState({ historyIndex: state.historyIndex + 1 });
    }
  }, [state, applyAction, updateState]);

  const setActiveLayer = useCallback(
    (layerId: number) => {
      if (state.layers.some((layer) => layer.id === layerId)) {
        pushAction({ type: "SET_ACTIVE_LAYER", layerId });
        applyAction({ type: "SET_ACTIVE_LAYER", layerId });
      }
    },
    [state, pushAction, applyAction]
  );

  const addLayer = useCallback(() => {
    const newId = Math.max(...state.layers.map((layer) => layer.id), 0) + 1;
    const newLayer = {
      id: newId,
      strokes: [] as Stroke[],
      visible: true,
      blendMode: "normal",
    };
    pushAction({ type: "ADD_LAYER", data: newLayer });
    applyAction({ type: "ADD_LAYER", data: newLayer });
  }, [state, pushAction, applyAction]);

  const removeLayer = useCallback(
    (layerId: number) => {
      const layerToRemove = state.layers.find((layer) => layer.id === layerId);
      if (layerToRemove && layerToRemove.strokes.length === 0) {
        pushAction({ type: "REMOVE_LAYER", layerId, data: layerToRemove });
        applyAction({ type: "REMOVE_LAYER", layerId, data: layerToRemove });
      }
    },
    [state, pushAction, applyAction]
  );

  const toggleLayerVisibility = useCallback(
    (layerId: number) => {
      pushAction({ type: "TOGGLE_VISIBILITY", layerId });
      applyAction({ type: "TOGGLE_VISIBILITY", layerId });
    },
    [pushAction, applyAction]
  );

  const changeLayerBlendMode = useCallback(
    (layerId: number, blendMode: string) => {
      pushAction({ type: "CHANGE_BLEND_MODE", layerId, data: blendMode });
      applyAction({ type: "CHANGE_BLEND_MODE", layerId, data: blendMode });
    },
    [pushAction, applyAction]
  );

  const addStrokeToLayer = useCallback(
    (layerId: number, stroke: Stroke) => {
      pushAction({ type: "ADD_STROKE", layerId, data: stroke });
      applyAction({ type: "ADD_STROKE", layerId, data: stroke });
    },
    [pushAction, applyAction]
  );

  return {
    layers: state.layers,
    activeLayer: state.activeLayer,
    setActiveLayer,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    changeLayerBlendMode,
    addStrokeToLayer,
    undo,
    redo,
  };
};
