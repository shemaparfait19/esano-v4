/**
 * Comprehensive Relationship Inference Engine
 * Automatically infers all family relationships from direct parent-child and spouse connections
 */

import type { FamilyMember, FamilyEdge } from "@/types/family-tree";

export type RelationshipType =
  | "self"
  | "spouse"
  | "parent"
  | "child"
  | "grandparent"
  | "grandchild"
  | "great-grandparent"
  | "great-grandchild"
  | "sibling"
  | "half-sibling"
  | "aunt"
  | "uncle"
  | "niece"
  | "nephew"
  | "cousin"
  | "second-cousin"
  | "in-law"
  | "step-parent"
  | "step-child"
  | "step-sibling";

export interface InferredRelationship {
  fromId: string;
  toId: string;
  type: RelationshipType;
  path: string[]; // IDs showing how the relationship was inferred
  distance: number; // Generational distance
  isDirect: boolean; // True if directly specified in edges
  description: string; // Human-readable description
}

export class RelationshipInferenceEngine {
  private members: Map<string, FamilyMember>;
  private parentsOf: Map<string, Set<string>>; // child -> parents
  private childrenOf: Map<string, Set<string>>; // parent -> children
  private spousesOf: Map<string, Set<string>>; // person -> spouses
  private relationships: Map<string, Map<string, InferredRelationship>>;

  constructor(members: FamilyMember[], edges: FamilyEdge[]) {
    this.members = new Map(members.map((m) => [m.id, m]));
    this.parentsOf = new Map();
    this.childrenOf = new Map();
    this.spousesOf = new Map();
    this.relationships = new Map();

    this.buildDirectRelationships(edges);
    this.inferAllRelationships();
  }

  private buildDirectRelationships(edges: FamilyEdge[]) {
    edges.forEach((edge) => {
      if (edge.type === "parent") {
        // fromId is parent of toId
        if (!this.childrenOf.has(edge.fromId)) {
          this.childrenOf.set(edge.fromId, new Set());
        }
        this.childrenOf.get(edge.fromId)!.add(edge.toId);

        if (!this.parentsOf.has(edge.toId)) {
          this.parentsOf.set(edge.toId, new Set());
        }
        this.parentsOf.get(edge.toId)!.add(edge.fromId);
      } else if (edge.type === "spouse") {
        if (!this.spousesOf.has(edge.fromId)) {
          this.spousesOf.set(edge.fromId, new Set());
        }
        this.spousesOf.get(edge.fromId)!.add(edge.toId);

        if (!this.spousesOf.has(edge.toId)) {
          this.spousesOf.set(edge.toId, new Set());
        }
        this.spousesOf.get(edge.toId)!.add(edge.fromId);
      }
    });
  }

  private inferAllRelationships() {
    // For each member, infer all their relationships
    this.members.forEach((_, memberId) => {
      this.inferRelationshipsFor(memberId);
    });
  }

  private inferRelationshipsFor(memberId: string) {
    if (!this.relationships.has(memberId)) {
      this.relationships.set(memberId, new Map());
    }

    const visited = new Set<string>();
    const queue: Array<{
      id: string;
      path: string[];
      distance: number;
    }> = [{ id: memberId, path: [memberId], distance: 0 }];

    visited.add(memberId);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Self
      if (current.id === memberId) {
        this.addRelationship(memberId, current.id, {
          fromId: memberId,
          toId: current.id,
          type: "self",
          path: [memberId],
          distance: 0,
          isDirect: true,
          description: "Self",
        });
      }

      // Direct parents
      const parents = this.parentsOf.get(current.id);
      if (parents) {
        parents.forEach((parentId) => {
          if (!visited.has(parentId)) {
            visited.add(parentId);
            const newPath = [...current.path, parentId];
            const distance = current.distance - 1;

            this.inferAncestorRelationship(
              memberId,
              parentId,
              newPath,
              distance
            );

            queue.push({ id: parentId, path: newPath, distance });
          }
        });
      }

      // Direct children
      const children = this.childrenOf.get(current.id);
      if (children) {
        children.forEach((childId) => {
          if (!visited.has(childId)) {
            visited.add(childId);
            const newPath = [...current.path, childId];
            const distance = current.distance + 1;

            this.inferDescendantRelationship(
              memberId,
              childId,
              newPath,
              distance
            );

            queue.push({ id: childId, path: newPath, distance });
          }
        });
      }

      // Spouses - ONLY add if it's a direct spouse relationship (not through traversal)
      const spouses = this.spousesOf.get(current.id);
      if (spouses && current.id === memberId) {
        // Only process spouses of the original member, not spouses discovered through traversal
        spouses.forEach((spouseId) => {
          if (!visited.has(spouseId)) {
            visited.add(spouseId);
            const newPath = [...current.path, spouseId];

            this.addRelationship(memberId, spouseId, {
              fromId: memberId,
              toId: spouseId,
              type: "spouse",
              path: newPath,
              distance: 0,
              isDirect: true,
              description: "Spouse",
            });

            queue.push({ id: spouseId, path: newPath, distance: 0 });
          }
        });
      } else if (spouses && current.distance !== 0) {
        // If we reached someone's spouse through parent/child traversal,
        // infer them as step-parent or parent (co-parent)
        spouses.forEach((spouseId) => {
          if (!visited.has(spouseId)) {
            visited.add(spouseId);
            const newPath = [...current.path, spouseId];
            
            // If current is a parent (distance -1), spouse is also a parent
            if (current.distance < 0) {
              this.inferAncestorRelationship(
                memberId,
                spouseId,
                newPath,
                current.distance // Same distance as the parent
              );
            }
            // If current is a child (distance +1), spouse is step-parent
            else if (current.distance > 0) {
              this.inferDescendantRelationship(
                memberId,
                spouseId,
                newPath,
                current.distance // Same distance as the child
              );
            }
            
            // Continue traversal from spouse
            queue.push({ id: spouseId, path: newPath, distance: current.distance });
          }
        });
      }
    }

    // Infer siblings (shared parents)
    this.inferSiblings(memberId);

    // Infer aunts/uncles (parents' siblings)
    this.inferAuntsUncles(memberId);

    // Infer nieces/nephews (siblings' children)
    this.inferNiecesNephews(memberId);

    // Infer cousins (aunts/uncles' children)
    this.inferCousins(memberId);
  }

  private inferAncestorRelationship(
    memberId: string,
    ancestorId: string,
    path: string[],
    distance: number
  ) {
    const absDistance = Math.abs(distance);
    let type: RelationshipType;
    let description: string;

    if (absDistance === 0) {
      // Skip self-relationship in ancestor inference
      return;
    } else if (absDistance === 1) {
      type = "parent";
      description = "Parent";
    } else if (absDistance === 2) {
      type = "grandparent";
      description = "Grandparent";
    } else if (absDistance === 3) {
      type = "great-grandparent";
      description = "Great-Grandparent";
    } else if (absDistance > 3) {
      type = "great-grandparent";
      const greats = "Great-".repeat(absDistance - 2);
      description = `${greats}Grandparent`;
    } else {
      // Invalid distance, skip
      return;
    }

    this.addRelationship(memberId, ancestorId, {
      fromId: memberId,
      toId: ancestorId,
      type,
      path,
      distance,
      isDirect: absDistance === 1,
      description,
    });
  }

  private inferDescendantRelationship(
    memberId: string,
    descendantId: string,
    path: string[],
    distance: number
  ) {
    const absDistance = Math.abs(distance);
    let type: RelationshipType;
    let description: string;

    if (absDistance === 0) {
      // Skip self-relationship in descendant inference
      return;
    } else if (absDistance === 1) {
      type = "child";
      description = "Child";
    } else if (absDistance === 2) {
      type = "grandchild";
      description = "Grandchild";
    } else if (absDistance === 3) {
      type = "great-grandchild";
      description = "Great-Grandchild";
    } else if (absDistance > 3) {
      type = "great-grandchild";
      const greats = "Great-".repeat(absDistance - 2);
      description = `${greats}Grandchild`;
    } else {
      // Invalid distance, skip
      return;
    }

    this.addRelationship(memberId, descendantId, {
      fromId: memberId,
      toId: descendantId,
      type,
      path,
      distance,
      isDirect: absDistance === 1,
      description,
    });
  }

  private inferSiblings(memberId: string) {
    const myParents = this.parentsOf.get(memberId);
    if (!myParents || myParents.size === 0) return;

    // Find all people who share at least one parent
    const siblings = new Set<string>();
    const fullSiblings = new Set<string>();

    myParents.forEach((parentId) => {
      const parentChildren = this.childrenOf.get(parentId);
      if (parentChildren) {
        parentChildren.forEach((siblingId) => {
          if (siblingId !== memberId) {
            siblings.add(siblingId);

            // Check if full sibling (shares both parents)
            const siblingParents = this.parentsOf.get(siblingId);
            if (siblingParents && myParents.size === 2 && siblingParents.size === 2) {
              const sharedParents = Array.from(myParents).filter((p) =>
                siblingParents.has(p)
              );
              if (sharedParents.length === 2) {
                fullSiblings.add(siblingId);
              }
            }
          }
        });
      }
    });

    siblings.forEach((siblingId) => {
      const isFull = fullSiblings.has(siblingId);
      this.addRelationship(memberId, siblingId, {
        fromId: memberId,
        toId: siblingId,
        type: isFull ? "sibling" : "half-sibling",
        path: [memberId, siblingId],
        distance: 0,
        isDirect: false,
        description: isFull ? "Sibling" : "Half-Sibling",
      });
    });
  }

  private inferAuntsUncles(memberId: string) {
    const myParents = this.parentsOf.get(memberId);
    if (!myParents) return;

    myParents.forEach((parentId) => {
      const parentSiblings = this.getRelationshipsFor(parentId, "sibling");
      parentSiblings.forEach((rel) => {
        const auntUncleId = rel.toId;
        const member = this.members.get(auntUncleId);
        const gender = member?.gender;

        this.addRelationship(memberId, auntUncleId, {
          fromId: memberId,
          toId: auntUncleId,
          type: gender === "female" ? "aunt" : "uncle",
          path: [memberId, parentId, auntUncleId],
          distance: 0,
          isDirect: false,
          description: gender === "female" ? "Aunt" : "Uncle",
        });
      });
    });
  }

  private inferNiecesNephews(memberId: string) {
    const mySiblings = this.getRelationshipsFor(memberId, "sibling");

    mySiblings.forEach((siblingRel) => {
      const siblingId = siblingRel.toId;
      const siblingChildren = this.childrenOf.get(siblingId);

      if (siblingChildren) {
        siblingChildren.forEach((childId) => {
          const child = this.members.get(childId);
          const gender = child?.gender;

          this.addRelationship(memberId, childId, {
            fromId: memberId,
            toId: childId,
            type: gender === "female" ? "niece" : "nephew",
            path: [memberId, siblingId, childId],
            distance: 0,
            isDirect: false,
            description: gender === "female" ? "Niece" : "Nephew",
          });
        });
      }
    });
  }

  private inferCousins(memberId: string) {
    const myAuntsUncles = [
      ...this.getRelationshipsFor(memberId, "aunt"),
      ...this.getRelationshipsFor(memberId, "uncle"),
    ];

    myAuntsUncles.forEach((auntUncleRel) => {
      const auntUncleId = auntUncleRel.toId;
      const cousins = this.childrenOf.get(auntUncleId);

      if (cousins) {
        cousins.forEach((cousinId) => {
          this.addRelationship(memberId, cousinId, {
            fromId: memberId,
            toId: cousinId,
            type: "cousin",
            path: [memberId, ...auntUncleRel.path.slice(1), cousinId],
            distance: 0,
            isDirect: false,
            description: "Cousin",
          });
        });
      }
    });
  }

  private addRelationship(
    fromId: string,
    toId: string,
    relationship: InferredRelationship
  ) {
    if (!this.relationships.has(fromId)) {
      this.relationships.set(fromId, new Map());
    }
    this.relationships.get(fromId)!.set(toId, relationship);
  }

  private getRelationshipsFor(
    memberId: string,
    type: RelationshipType
  ): InferredRelationship[] {
    const memberRels = this.relationships.get(memberId);
    if (!memberRels) return [];

    return Array.from(memberRels.values()).filter((rel) => rel.type === type);
  }

  // Public API
  public getRelationship(fromId: string, toId: string): InferredRelationship | null {
    return this.relationships.get(fromId)?.get(toId) || null;
  }

  public getAllRelationshipsFor(memberId: string): InferredRelationship[] {
    const memberRels = this.relationships.get(memberId);
    if (!memberRels) return [];
    return Array.from(memberRels.values()).filter((rel) => rel.type !== "self");
  }

  public getRelationshipsByType(
    memberId: string,
    type: RelationshipType
  ): InferredRelationship[] {
    return this.getRelationshipsFor(memberId, type);
  }

  public getRelationshipDescription(fromId: string, toId: string): string {
    const rel = this.getRelationship(fromId, toId);
    if (!rel) return "No relation";

    const toMember = this.members.get(toId);
    const name = toMember?.fullName || toMember?.firstName || "Unknown";

    return `${name} (${rel.description})`;
  }

  public exportAllRelationships(): Map<string, InferredRelationship[]> {
    const result = new Map<string, InferredRelationship[]>();
    this.relationships.forEach((rels, memberId) => {
      result.set(memberId, Array.from(rels.values()));
    });
    return result;
  }
}

// Helper function to create and use the engine
export function inferRelationships(
  members: FamilyMember[],
  edges: FamilyEdge[]
): RelationshipInferenceEngine {
  return new RelationshipInferenceEngine(members, edges);
}
