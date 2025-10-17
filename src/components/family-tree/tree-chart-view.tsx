"use client";

import { useMemo } from "react";
import { FamilyMember, FamilyEdge } from "@/types/family-tree";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users, Heart, Eye } from "lucide-react";

interface TreeChartViewProps {
  members: FamilyMember[];
  edges: FamilyEdge[];
  onViewMember: (id: string) => void;
}

export function TreeChartView({ members, edges, onViewMember }: TreeChartViewProps) {
  // Build tree structure by generations
  const treeStructure = useMemo(() => {
    const memberMap = new Map(members.map(m => [m.id, m]));
    const childrenMap = new Map<string, string[]>();
    const parentsMap = new Map<string, string[]>();
    
    // Build parent-child relationships
    edges.forEach(edge => {
      if (edge.type === "parent") {
        const children = childrenMap.get(edge.fromId) || [];
        children.push(edge.toId);
        childrenMap.set(edge.fromId, children);
        
        const parents = parentsMap.get(edge.toId) || [];
        parents.push(edge.fromId);
        parentsMap.set(edge.toId, parents);
      }
    });
    
    // Find root members (those without parents)
    const roots = members.filter(m => !parentsMap.has(m.id));
    
    // Build generations
    const generations: FamilyMember[][] = [];
    let currentGen = roots;
    const visited = new Set<string>();
    
    while (currentGen.length > 0) {
      generations.push(currentGen);
      currentGen.forEach(m => visited.add(m.id));
      
      const nextGen: FamilyMember[] = [];
      currentGen.forEach(member => {
        const children = childrenMap.get(member.id) || [];
        children.forEach(childId => {
          if (!visited.has(childId)) {
            const child = memberMap.get(childId);
            if (child) nextGen.push(child);
          }
        });
      });
      
      currentGen = nextGen;
    }
    
    return generations;
  }, [members, edges]);
  
  const getSpouseIds = (memberId: string) => {
    return edges
      .filter(e => e.type === "spouse" && (e.fromId === memberId || e.toId === memberId))
      .map(e => e.fromId === memberId ? e.toId : e.fromId);
  };

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold text-lg mb-2">No Family Members Yet</h3>
        <p className="text-muted-foreground text-sm">
          Switch to Table view to start adding family members
        </p>
      </div>
    );
  }

  if (treeStructure.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold text-lg mb-2">Unable to Build Tree</h3>
        <p className="text-muted-foreground text-sm">
          There might be an issue with the relationships. Switch to Table view to review.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-8">
      <div className="min-w-max p-8 space-y-12">
        {treeStructure.map((generation, genIndex) => (
          <div key={genIndex} className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-primary/10 px-4 py-1 rounded-full">
                <span className="text-sm font-semibold text-primary">
                  Generation {genIndex + 1}
                </span>
              </div>
              <div className="h-px flex-1 bg-border"></div>
            </div>
            
            <div className="flex flex-wrap gap-6 justify-center">
              {generation.map((member) => {
                const spouseIds = getSpouseIds(member.id);
                const spouses = members.filter(m => spouseIds.includes(m.id));
                
                return (
                  <div key={member.id} className="flex flex-col items-center gap-3">
                    <Card className="w-64 p-4 hover:shadow-lg transition-all border-2 hover:border-primary/50">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base truncate">
                            {member.fullName || `${member.firstName} ${member.lastName}`}
                          </h4>
                          <div className="text-xs text-muted-foreground space-y-1 mt-1">
                            {member.birthDate && (
                              <div>Born: {member.birthDate}</div>
                            )}
                            {member.deathDate && (
                              <div>Died: {member.deathDate}</div>
                            )}
                            {member.location && (
                              <div className="truncate">📍 {typeof member.location === 'string' ? member.location : `${member.location.village || ''}, ${member.location.sector || ''}, ${member.location.district || ''}`.replace(/, ,/g, ',').replace(/^, |, $/g, '')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => onViewMember(member.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </Card>
                    
                    {/* Show spouses */}
                    {spouses.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div className="flex gap-2">
                          {spouses.map(spouse => (
                            <Card key={spouse.id} className="px-3 py-2 text-sm bg-red-50 border-red-200">
                              <div className="font-medium">{spouse.fullName}</div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
