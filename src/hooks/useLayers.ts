import { useState, useCallback, useEffect } from "react";

export interface Layer {
  id: number;
  strokes: Stroke[];
  visible: boolean;
  blendMode: string;
}

export interface Stroke {
  id: string;
  type: "draw" | "erase" | "fill";
  points: [number, number, number][];
  opacity: number;
  brushSize: number;
  color: string;
}

export interface FillStroke extends Omit<Stroke, "brushSize"> {
  type: "fill";
  points: [[number, number, number]];
  tolerance: number;
  contiguous: boolean;
}

export type AnyStroke = Stroke | FillStroke;

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

export interface Fill {
  id: string;
  startPoint: [number, number];
  color: string;
  opacity: number;
  tolerance: number;
  contiguous: boolean;
  mode: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten";
}

// Global state store
const globalStore: { [fileId: string]: BranchingHistory } = {};

// Custom hook for managing global state
const useGlobalStore = (fileId: string, initialLayers: Layer[] = []) => {
  const [store, setStore] = useState<BranchingHistory>(() => {
    if (!globalStore[fileId]) {
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
      globalStore[fileId] = { root, current: root };
    }
    return globalStore[fileId];
  });

  useEffect(() => {
    return () => {
      // Clean up the store when the component unmounts
      delete globalStore[fileId];
    };
  }, [fileId]);

  const updateStore = useCallback(
    (newStore: BranchingHistory) => {
      setStore(newStore);
      globalStore[fileId] = newStore;
    },
    [fileId]
  );

  return [store, updateStore] as const;
};

let strokeCounter = 0;

const getUniqueStrokeId = () => {
  strokeCounter += 1;
  return `stroke_${Date.now()}_${strokeCounter}`;
};

export const useLayers = (fileId: string, initialLayers: Layer[] = []) => {
  const [history, updateHistory] = useGlobalStore(fileId, initialLayers);

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
        case "ADD_STROKE":
          newState.layers = newState.layers.map((layer) => (layer.id === action.layerId ? { ...layer, strokes: [...layer.strokes, action.data] } : layer));
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

      updateHistory({
        ...history,
        current: newNode,
      });
    },
    [history, updateHistory]
  );

  const undo = useCallback(() => {
    if (history.current.parent) {
      history.current.isCurrent = false;
      const parent = history.current.parent;
      parent.isCurrent = true;
      updateHistory({
        ...history,
        current: parent,
      });
    }
  }, [history, updateHistory]);

  const redo = useCallback(
    (index: number = 0) => {
      if (history.current.children.length > index) {
        history.current.isCurrent = false;
        const child = history.current.children[index];
        child.isCurrent = true;
        updateHistory({
          ...history,
          current: child,
        });
      }
    },
    [history, updateHistory]
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
          updateHistory({
            ...history,
            current: node,
          });
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
    [history, updateHistory]
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
    (layerId: number, stroke: Omit<Stroke, "id"> | Omit<FillStroke, "id">) => {
      const newStroke: AnyStroke = {
        ...stroke,
        id: getUniqueStrokeId(),
      };
      applyAction({ type: "ADD_STROKE", layerId, data: newStroke });
    },
    [applyAction]
  );

  const addFillToLayer = useCallback(
    (
      layerId: number,
      fillOptions: {
        startPoint: [number, number, number];
        color: string;
        opacity: number;
        tolerance: number;
        contiguous: boolean;
      }
    ) => {
      const fillStroke: Omit<FillStroke, "id"> = {
        type: "fill",
        points: [fillOptions.startPoint],
        color: fillOptions.color,
        opacity: fillOptions.opacity,
        tolerance: fillOptions.tolerance,
        contiguous: fillOptions.contiguous,
      };
      addStrokeToLayer(layerId, fillStroke);
    },
    [addStrokeToLayer]
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
    addFillToLayer,
    undo,
    redo,
    getBranchingStructure,
    switchToBranch,
  };
};
