"use client";

import { useMemo } from "react";
import { FamilyMember, FamilyEdge } from "@/types/family-tree";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Calendar, MapPin, Eye, Heart } from "lucide-react";

interface TimelineViewProps {
  members: FamilyMember[];
  edges: FamilyEdge[];
  onViewMember: (id: string) => void;
}

export function TimelineView({ members, edges, onViewMember }: TimelineViewProps) {
  // Sort members by birth date
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (!a.birthDate) return 1;
      if (!b.birthDate) return -1;
      return a.birthDate.localeCompare(b.birthDate);
    });
  }, [members]);
  
  const getRelationships = (memberId: string) => {
    const relationships: { type: string; name: string }[] = [];
    
    // Find spouses
    edges.forEach(edge => {
      if (edge.type === "spouse") {
        if (edge.fromId === memberId) {
          const spouse = members.find(m => m.id === edge.toId);
          if (spouse) relationships.push({ type: "Spouse", name: spouse.fullName || `${spouse.firstName} ${spouse.lastName}` });
        } else if (edge.toId === memberId) {
          const spouse = members.find(m => m.id === edge.fromId);
          if (spouse) relationships.push({ type: "Spouse", name: spouse.fullName || `${spouse.firstName} ${spouse.lastName}` });
        }
      }
    });
    
    // Find parents
    edges.forEach(edge => {
      if (edge.type === "parent" && edge.toId === memberId) {
        const parent = members.find(m => m.id === edge.fromId);
        if (parent) relationships.push({ type: "Parent", name: parent.fullName || `${parent.firstName} ${parent.lastName}` });
      }
    });
    
    // Find children
    edges.forEach(edge => {
      if (edge.type === "parent" && edge.fromId === memberId) {
        const child = members.find(m => m.id === edge.toId);
        if (child) relationships.push({ type: "Child", name: child.fullName || `${child.firstName} ${child.lastName}` });
      }
    });
    
    return relationships;
  };
  
  const calculateAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    return age;
  };

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No family members to display
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20"></div>
        
        <div className="space-y-8">
          {sortedMembers.map((member, index) => {
            const relationships = getRelationships(member.id);
            const age = calculateAge(member.birthDate, member.deathDate);
            
            return (
              <div key={member.id} className="relative pl-20">
                {/* Timeline dot */}
                <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-primary border-4 border-background shadow-lg z-10"></div>
                
                <Card className="p-6 hover:shadow-lg transition-all border-l-4 border-l-primary">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            {member.fullName || `${member.firstName} ${member.lastName}`}
                          </h3>
                          {member.birthDate && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Born: {member.birthDate}
                              </span>
                              {member.deathDate && (
                                <span>Died: {member.deathDate}</span>
                              )}
                              {age && (
                                <span className="bg-primary/10 px-2 py-0.5 rounded text-primary text-xs">
                                  {member.deathDate ? `Lived ${age} years` : `${age} years old`}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {member.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{typeof member.location === 'string' ? member.location : `${member.location.village || ''}, ${member.location.sector || ''}, ${member.location.district || ''}`.replace(/, ,/g, ',').replace(/^, |, $/g, '')}</span>
                          </div>
                        )}
                        
                        {member.notes && (
                          <div className="mt-2 p-3 bg-muted/30 rounded-lg text-sm">
                            <p className="text-muted-foreground">{member.notes}</p>
                          </div>
                        )}
                        
                        {relationships.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="font-medium text-xs text-muted-foreground mb-2">Relationships:</div>
                            <div className="flex flex-wrap gap-2">
                              {relationships.map((rel, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                                >
                                  {rel.type === "Spouse" && <Heart className="h-3 w-3" />}
                                  {rel.type}: {rel.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewMember(member.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
