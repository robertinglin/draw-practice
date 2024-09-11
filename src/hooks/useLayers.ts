import { useState, useCallback, useMemo, useEffect } from "react";

export interface Layer {
  id: number;
  strokes: Stroke[];
  visible: boolean;
  blendMode: string;
}

export interface Stroke {
  id: string;
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
}

interface HistoryNode {
  id: string;
  action: Action;
  state: LayersState;
  children: HistoryNode[];
  parent: HistoryNode | null;
  editCount: number;
  isCurrent: boolean;
}

interface LayersState {
  layers: Layer[];
  activeLayer: number;
}

interface BranchingHistory {
  root: HistoryNode;
  current: HistoryNode;
}

const layersStore: { [fileId: string]: BranchingHistory } = {};
const listeners: { [fileId: string]: Set<() => void> } = {};
let strokeCounter = 0; // Atomic counter for stroke IDs

const notifyListeners = (fileId: string) => {
  listeners[fileId]?.forEach((listener) => listener());
};

const getUniqueStrokeId = () => {
  strokeCounter += 1;
  return `stroke_${Date.now()}_${strokeCounter}`;
};

export const useLayers = (fileId: string, initialLayers: Layer[] = []) => {
  const [, forceUpdate] = useState({});

  const history = useMemo(() => {
    if (!layersStore[fileId]) {
      const initialState: LayersState = {
        layers: initialLayers.length > 0 ? initialLayers : [{ id: 1, strokes: [], visible: true, blendMode: "normal" }],
        activeLayer: 1,
      };
      const root: HistoryNode = {
        id: "root",
        action: { type: "ADD_LAYER", data: initialState.layers[0] },
        state: initialState,
        children: [],
        parent: null,
        editCount: 1,
        isCurrent: true,
      };
      layersStore[fileId] = { root, current: root };
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

  const applyAction = useCallback(
    (action: Action) => {
      const currentState = history.current.state;
      let newState: LayersState = { ...currentState };

      switch (action.type) {
        case "ADD_LAYER":
          newState.layers = [...newState.layers, action.data];
          newState.activeLayer = action.data.id;
          break;
        case "REMOVE_LAYER":
          newState.layers = newState.layers.filter((layer) => layer.id !== action.layerId);
          newState.activeLayer = newState.activeLayer === action.layerId ? newState.layers[newState.layers.length - 1].id : newState.activeLayer;
          break;
        case "TOGGLE_VISIBILITY":
          newState.layers = newState.layers.map((layer) => (layer.id === action.layerId ? { ...layer, visible: !layer.visible } : layer));
          break;
        case "CHANGE_BLEND_MODE":
          newState.layers = newState.layers.map((layer) => (layer.id === action.layerId ? { ...layer, blendMode: action.data } : layer));
          break;
        case "ADD_STROKE":
          newState.layers = newState.layers.map((layer) => (layer.id === action.layerId ? { ...layer, strokes: [...layer.strokes, action.data] } : layer));
          break;
        case "SET_ACTIVE_LAYER":
          newState.activeLayer = action.layerId!;
          break;
      }

      const newNode: HistoryNode = {
        id: `node_${Date.now()}`,
        action,
        state: newState,
        children: [],
        parent: history.current,
        editCount: history.current.editCount + 1,
        isCurrent: true,
      };
      history.current.isCurrent = false;
      history.current.children.push(newNode);
      history.current = newNode;

      notifyListeners(fileId);
    },
    [history, fileId]
  );

  const undo = useCallback(() => {
    if (history.current.parent) {
      history.current.isCurrent = false;
      history.current = history.current.parent;
      history.current.isCurrent = true;
      notifyListeners(fileId);
    }
  }, [history, fileId]);

  const redo = useCallback(
    (index: number = 0) => {
      if (history.current.children.length > index) {
        history.current.isCurrent = false;
        history.current = history.current.children[index];
        history.current.isCurrent = true;
        notifyListeners(fileId);
      }
    },
    [history, fileId]
  );

  const getBranchingStructure = useCallback(() => {
    const buildBranchStructure = (node: HistoryNode): any => {
      return {
        id: node.id,
        editCount: node.editCount,
        isCurrent: node.isCurrent,
        parentId: node.parent?.id || null,
        children: node.children.map(buildBranchStructure),
      };
    };

    return buildBranchStructure(history.root);
  }, [history]);

  const switchToBranch = useCallback(
    (branchId: string) => {
      const findAndSwitchToBranch = (node: HistoryNode): boolean => {
        if (node.id === branchId) {
          history.current.isCurrent = false;
          node.isCurrent = true;
          history.current = node;
          notifyListeners(fileId);
          return true;
        }
        for (const child of node.children) {
          if (findAndSwitchToBranch(child)) {
            return true;
          }
        }
        return false;
      };

      findAndSwitchToBranch(history.root);
    },
    [history, fileId]
  );

  const subscribeToChanges = useCallback(
    (callback: () => void) => {
      if (!listeners[fileId]) {
        listeners[fileId] = new Set();
      }
      listeners[fileId].add(callback);
      return () => {
        listeners[fileId].delete(callback);
        if (listeners[fileId].size === 0) {
          delete listeners[fileId];
        }
      };
    },
    [fileId]
  );

  const setActiveLayer = useCallback(
    (layerId: number) => {
      if (history.current.state.layers.some((layer) => layer.id === layerId)) {
        applyAction({ type: "SET_ACTIVE_LAYER", layerId });
      }
    },
    [history, applyAction]
  );

  const addLayer = useCallback(() => {
    const newId = Math.max(...history.current.state.layers.map((layer) => layer.id), 0) + 1;
    const newLayer = {
      id: newId,
      strokes: [] as Stroke[],
      visible: true,
      blendMode: "normal",
    };
    applyAction({ type: "ADD_LAYER", data: newLayer });
  }, [history, applyAction]);

  const removeLayer = useCallback(
    (layerId: number) => {
      const layerToRemove = history.current.state.layers.find((layer) => layer.id === layerId);
      if (layerToRemove && layerToRemove.strokes.length === 0) {
        applyAction({ type: "REMOVE_LAYER", layerId });
      }
    },
    [history, applyAction]
  );

  const toggleLayerVisibility = useCallback(
    (layerId: number) => {
      applyAction({ type: "TOGGLE_VISIBILITY", layerId });
    },
    [applyAction]
  );

  const changeLayerBlendMode = useCallback(
    (layerId: number, blendMode: string) => {
      applyAction({ type: "CHANGE_BLEND_MODE", layerId, data: blendMode });
    },
    [applyAction]
  );

  const addStrokeToLayer = useCallback(
    (layerId: number, stroke: Omit<Stroke, "id">) => {
      const newStroke: Stroke = {
        ...stroke,
        id: getUniqueStrokeId(), // Use the new function to generate a unique id
      };
      applyAction({ type: "ADD_STROKE", layerId, data: newStroke });
    },
    [applyAction]
  );

  return {
    layers: history.current.state.layers,
    activeLayer: history.current.state.activeLayer,
    setActiveLayer,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    changeLayerBlendMode,
    addStrokeToLayer,
    undo,
    redo,
    getBranchingStructure,
    switchToBranch,
    subscribeToChanges,
  };
};
