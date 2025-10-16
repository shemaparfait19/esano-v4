"use client";

import React, { useMemo } from "react";
import { FamilyMember, FamilyEdge } from "@/types/family-tree";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { RelationshipInferenceEngine } from "@/lib/relationship-inference-engine";

interface RelationshipsTableProps {
  members: FamilyMember[];
  edges: FamilyEdge[];
  onRemoveEdge: (edgeId: string) => void;
  readonly?: boolean;
}

export function RelationshipsTable({
  members,
  edges,
  onRemoveEdge,
  readonly = false,
}: RelationshipsTableProps) {
  // Initialize relationship inference engine
  const relationshipEngine = useMemo(() => {
    if (members.length === 0) return null;
    return new RelationshipInferenceEngine(members, edges);
  }, [members, edges]);

  const getMemberName = (id: string) => {
    const member = members.find((m) => m.id === id);
    return member?.fullName || "Unknown";
  };

  const getRelationshipLabel = (type: string) => {
    const labels: Record<string, string> = {
      parent: "Parent",
      child: "Child",
      spouse: "Spouse",
      sibling: "Sibling",
      grandparent: "Grandparent",
      grandchild: "Grandchild",
      "great-grandparent": "Great-Grandparent",
      "great-grandchild": "Great-Grandchild",
      aunt: "Aunt/Uncle",
      uncle: "Aunt/Uncle",
      niece: "Niece/Nephew",
      nephew: "Niece/Nephew",
      cousin: "Cousin",
    };
    return labels[type] || type;
  };

  // Get all relationships with inferred ones
  const allRelationships = useMemo(() => {
    const relationships: Array<{
      id: string;
      fromId: string;
      toId: string;
      type: string;
      isDirect: boolean;
      description?: string;
    }> = [];

    // Add direct edges
    edges.forEach((edge) => {
      relationships.push({
        id: edge.id,
        fromId: edge.fromId,
        toId: edge.toId,
        type: edge.type,
        isDirect: true,
      });
    });

    // Add inferred relationships
    if (relationshipEngine) {
      members.forEach((member) => {
        const inferred = relationshipEngine.getAllRelationshipsFor(member.id);
        inferred.forEach((rel) => {
          // Only add if not already a direct edge
          const exists = edges.some(
            (e) =>
              (e.fromId === member.id && e.toId === rel.toId) ||
              (e.toId === member.id && e.fromId === rel.toId)
          );
          if (!exists) {
            relationships.push({
              id: `inferred-${member.id}-${rel.toId}`,
              fromId: member.id,
              toId: rel.toId,
              type: rel.type,
              isDirect: false,
              description: rel.description,
            });
          }
        });
      });
    }

    return relationships;
  }, [edges, members, relationshipEngine]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Family Relationships</h3>
          <p className="text-sm text-muted-foreground">
            Direct relationships and AI-inferred connections
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {edges.length} direct · {allRelationships.length - edges.length} inferred
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRelationships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No relationships yet. Add members and define their relationships.
                </TableCell>
              </TableRow>
            ) : (
              allRelationships.map((rel) => (
                <TableRow key={rel.id}>
                  <TableCell className="font-medium">
                    {getMemberName(rel.fromId)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        rel.isDirect
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rel.description || getRelationshipLabel(rel.type)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {getMemberName(rel.toId)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs ${
                        rel.isDirect ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      {rel.isDirect ? "Direct" : "AI-Inferred"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {rel.isDirect && !readonly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveEdge(rel.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
          <div>
            <strong>Direct Relationships:</strong> Manually defined connections (parents, spouse, etc.)
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 mt-1" />
          <div>
            <strong>AI-Inferred Relationships:</strong> Automatically detected extended family (grandparents, aunts, uncles, cousins, etc.)
          </div>
        </div>
      </div>
    </div>
  );
}
