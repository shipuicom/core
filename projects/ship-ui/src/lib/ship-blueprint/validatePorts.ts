import { BlueprintNode } from './ship-blueprint.component';

export type PortValidationError = {
  nodeId: string;
  duplicatePortIds: string[];
};

export function findDuplicatePortIDs(nodes: BlueprintNode[]): PortValidationError[] {
  const errors: PortValidationError[] = [];

  for (const node of nodes) {
    const portIdCounts = new Map<string, number>();
    const allPorts = [...node.inputs, ...node.outputs];

    for (const port of allPorts) {
      const count = portIdCounts.get(port.id) || 0;
      portIdCounts.set(port.id, count + 1);
    }

    const duplicatePortIds: string[] = [];
    for (const [id, count] of portIdCounts.entries()) {
      if (count > 1) {
        duplicatePortIds.push(id);
      }
    }

    if (duplicatePortIds.length > 0) {
      errors.push({
        nodeId: node.id,
        duplicatePortIds: duplicatePortIds,
      });
    }
  }

  return errors;
}

export function findDuplicateNodeIDs(nodes: BlueprintNode[]): string[] {
  const nodeIdCounts = new Map<string, number>();

  for (const node of nodes) {
    const count = nodeIdCounts.get(node.id) || 0;
    nodeIdCounts.set(node.id, count + 1);
  }

  const duplicateNodeIds: string[] = [];
  for (const [id, count] of nodeIdCounts.entries()) {
    if (count > 1) {
      duplicateNodeIds.push(id);
    }
  }

  return duplicateNodeIds;
}
