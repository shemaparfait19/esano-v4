/**
 * Utility to clean up orphaned edges in family tree
 * Removes edges that reference non-existent members
 */

import type { FamilyMember, FamilyEdge } from "@/types/family-tree";

export function cleanupOrphanedEdges(
  members: FamilyMember[],
  edges: FamilyEdge[]
): {
  cleanedEdges: FamilyEdge[];
  removedCount: number;
  removedEdges: FamilyEdge[];
} {
  const memberIds = new Set(members.map((m) => m.id));
  const removedEdges: FamilyEdge[] = [];

  const cleanedEdges = edges.filter((edge) => {
    const fromExists = memberIds.has(edge.fromId);
    const toExists = memberIds.has(edge.toId);

    if (!fromExists || !toExists) {
      console.warn(
        `Removing orphaned edge: ${edge.type} from ${edge.fromId} to ${edge.toId}`,
        {
          fromExists,
          toExists,
        }
      );
      removedEdges.push(edge);
      return false;
    }

    return true;
  });

  return {
    cleanedEdges,
    removedCount: removedEdges.length,
    removedEdges,
  };
}

export function validateEdge(
  edge: FamilyEdge,
  members: FamilyMember[]
): { valid: boolean; error?: string } {
  const memberIds = new Set(members.map((m) => m.id));

  if (!memberIds.has(edge.fromId)) {
    return {
      valid: false,
      error: `Source member not found: ${edge.fromId}`,
    };
  }

  if (!memberIds.has(edge.toId)) {
    return {
      valid: false,
      error: `Target member not found: ${edge.toId}`,
    };
  }

  if (edge.fromId === edge.toId) {
    return {
      valid: false,
      error: "Cannot create relationship to self",
    };
  }

  return { valid: true };
}
