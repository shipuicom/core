import { BlueprintNode } from './ship-blueprint.component';

export function layoutNodes(nodes: BlueprintNode[]): BlueprintNode[] {
  if (!nodes || nodes.length === 0) return nodes;

  const layoutedNodes = structuredClone(nodes);
  const visited = new Set<string>();
  const unconnectedNodes: BlueprintNode[] = [];
  const connectedGraphs: BlueprintNode[][] = [];

  const allToNodes = new Set(layoutedNodes.flatMap((node) => node.connections).map((conn) => conn.toNode));
  const rootNodes = layoutedNodes.filter((node) => !allToNodes.has(node.id));

  for (const node of layoutedNodes) {
    if (!node.connections.length) {
      unconnectedNodes.push(node);
    }
  }

  for (const root of rootNodes) {
    if (!visited.has(root.id)) {
      const graph: BlueprintNode[] = [];
      traverseGraph(root, graph, visited, layoutedNodes);
      if (graph.length > 0) {
        connectedGraphs.push(graph);
      }
    }
  }

  positionUnconnectedNodes(unconnectedNodes);

  let currentX = 20;
  let currentY = 20;
  connectedGraphs.forEach((graph) => {
    const layoutedGraph = traverseAndLayout(graph);
    positionGraph(layoutedGraph, currentX, currentY);
    currentY += getGraphHeight(layoutedGraph) + 200;
  });

  return layoutedNodes;
}

function traverseGraph(
  startNode: BlueprintNode,
  graph: BlueprintNode[],
  visited: Set<string>,
  allNodes: BlueprintNode[]
) {
  const queue = [startNode];
  visited.add(startNode.id);
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    graph.push(node);
    node.connections.forEach((conn) => {
      const toNode = allNodes.find((n) => n.id === conn.toNode);
      if (toNode && !visited.has(toNode.id)) {
        visited.add(toNode.id);
        queue.push(toNode);
      }
    });
  }
}

function positionUnconnectedNodes(nodes: BlueprintNode[]) {
  nodes.forEach((node, index) => {
    node.coordinates[0] = 20 + index * 200;
    node.coordinates[1] = 20;
  });
}

function traverseAndLayout(graph: BlueprintNode[]): BlueprintNode[] {
  const graphNodeMap = new Map<string, BlueprintNode>(graph.map((n) => [n.id, n]));
  const incomingConnectionCount = new Map<string, number>();

  graph.forEach((node) => {
    incomingConnectionCount.set(node.id, 0);
  });
  graph
    .flatMap((n) => n.connections)
    .forEach((conn) => {
      if (graphNodeMap.has(conn.toNode)) {
        incomingConnectionCount.set(conn.toNode, (incomingConnectionCount.get(conn.toNode) || 0) + 1);
      }
    });

  const roots = graph.filter((node) => (incomingConnectionCount.get(node.id) || 0) === 0);
  const layoutedNodes = new Set<string>();

  const queue = [...roots];
  let head = 0;

  while (head < queue.length) {
    const currentNode = queue[head++];
    layoutedNodes.add(currentNode.id);

    let outputConnectionIndex = 0;
    const connectedNodes: BlueprintNode[] = [];

    currentNode.connections.forEach((conn) => {
      const toNode = graphNodeMap.get(conn.toNode);
      if (toNode && !layoutedNodes.has(toNode.id)) {
        connectedNodes.push(toNode);
      }
    });

    connectedNodes.forEach((toNode) => {
      toNode.coordinates[0] = currentNode.coordinates[0] + 200;
      if (connectedNodes.length > 1) {
        const verticalOffset = (outputConnectionIndex - (connectedNodes.length - 1) / 2) * 200;
        toNode.coordinates[1] = currentNode.coordinates[1] + verticalOffset;
      } else {
        toNode.coordinates[1] = currentNode.coordinates[1];
      }

      queue.push(toNode);
      outputConnectionIndex++;
    });
  }
  return graph;
}

function positionGraph(graph: BlueprintNode[], startX: number, startY: number) {
  const minX = Math.min(...graph.map((n) => n.coordinates[0]));
  const minY = Math.min(...graph.map((n) => n.coordinates[1]));
  graph.forEach((node) => {
    node.coordinates[0] += startX - minX;
    node.coordinates[1] += startY - minY;
  });
}

function getGraphHeight(graph: BlueprintNode[]): number {
  if (!graph.length) return 0;
  const maxY = Math.max(...graph.map((n) => n.coordinates[1]));
  const minY = Math.min(...graph.map((n) => n.coordinates[1]));
  return maxY - minY;
}
