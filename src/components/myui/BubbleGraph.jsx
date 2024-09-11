import React, { useEffect, useState, useCallback, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useLayers } from "../../hooks/useLayers";

const BranchBubbleGraph = ({ fileId }) => {
  const { getBranchingStructure, switchToBranch, subscribeToChanges } = useLayers(fileId);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const generateGraphData = useCallback((branchStructure) => {
    const nodes = [];
    const links = [];

    const addNode = (branch, parentId = null) => {
      const newNode = {
        id: branch.id,
        val: branch.changeCount || 1,
        name: `Branch ${branch.id}`,
        color: branch.isCurrent ? "#4CAF50" : "#2196F3",
        compressedIds: [branch.id],
      };

      if (parentId) {
        links.push({ source: parentId, target: branch.id });
      }

      if (branch.children && branch.children.length === 1) {
        // Compress single-child branches
        const child = branch.children[0];
        newNode.val += child.changeCount || 1;
        newNode.compressedIds.push(child.id);

        // Continue compressing if the child also has a single child
        while (child.children && child.children.length === 1) {
          const grandchild = child.children[0];
          newNode.val += grandchild.changeCount || 1;
          newNode.compressedIds.push(grandchild.id);
          child.children = grandchild.children;
        }

        // Process remaining children (if any)
        if (child.children) {
          child.children.forEach((grandchild) => addNode(grandchild, branch.id));
        }
      } else if (branch.children) {
        // Process multiple children normally
        branch.children.forEach((child) => addNode(child, branch.id));
      }

      nodes.push(newNode);
    };

    addNode(branchStructure);
    return { nodes, links };
  }, []);

  console.log(graphData);

  const updateGraph = useCallback(() => {
    const structure = getBranchingStructure();
    const data = generateGraphData(structure);
    setGraphData(data);
  }, [getBranchingStructure, generateGraphData]);

  useEffect(() => {
    updateGraph();
    const unsubscribe = subscribeToChanges(updateGraph);
    return () => unsubscribe();
  }, [fileId, updateGraph, subscribeToChanges]);

  const handleNodeClick = useCallback(
    (node) => {
      // If the node has compressed IDs, switch to the last (most recent) ID
      const targetId = node.compressedIds ? node.compressedIds[node.compressedIds.length - 1] : node.id;
      switchToBranch(targetId);
    },
    [switchToBranch]
  );

  const graphMemo = useMemo(
    () => (
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(node) => node.color}
        nodeVal={(node) => 5 + node.val}
        onNodeClick={handleNodeClick}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.compressedIds ? `${node.compressedIds.length}` : `${node.val}`;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.2);

          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = node.color;
          ctx.fillText(label, node.x, node.y);
        }}
        linkColor={() => "#999"}
        linkWidth={1}
        width={500}
        height={500}
      />
    ),
    [graphData, handleNodeClick]
  );

  return <div className="branch-bubble-graph">{graphMemo}</div>;
};

export default BranchBubbleGraph;
