"use client";

import { useMemo, useState } from "react";
import { FamilyMember, FamilyEdge } from "@/types/family-tree";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Calendar, MapPin, Eye, Heart, Users, Search } from "lucide-react";

interface CardsViewProps {
  members: FamilyMember[];
  edges: FamilyEdge[];
  onViewMember: (id: string) => void;
}

export function CardsView({ members, edges, onViewMember }: CardsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "birthDate">("name");
  
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = members.filter(m => {
        const locationStr = typeof m.location === 'string' 
          ? m.location 
          : m.location 
            ? `${m.location.village || ''} ${m.location.sector || ''} ${m.location.district || ''} ${m.location.province || ''}` 
            : '';
        return (
          m.fullName?.toLowerCase().includes(query) ||
          m.firstName?.toLowerCase().includes(query) ||
          m.lastName?.toLowerCase().includes(query) ||
          locationStr.toLowerCase().includes(query)
        );
      });
    }
    
    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        const nameA = a.fullName || `${a.firstName} ${a.lastName}`;
        const nameB = b.fullName || `${b.firstName} ${b.lastName}`;
        return nameA.localeCompare(nameB);
      } else {
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return a.birthDate.localeCompare(b.birthDate);
      }
    });
  }, [members, searchQuery, sortBy]);
  
  const getRelationshipsCount = (memberId: string) => {
    let count = 0;
    edges.forEach(edge => {
      if (edge.fromId === memberId || edge.toId === memberId) count++;
    });
    return count;
  };
  
  const getSpouses = (memberId: string) => {
    const spouseIds: string[] = [];
    edges.forEach(edge => {
      if (edge.type === "spouse") {
        if (edge.fromId === memberId) spouseIds.push(edge.toId);
        else if (edge.toId === memberId) spouseIds.push(edge.fromId);
      }
    });
    return members.filter(m => spouseIds.includes(m.id));
  };
  
  const getChildrenCount = (memberId: string) => {
    return edges.filter(e => e.type === "parent" && e.fromId === memberId).length;
  };

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold text-lg mb-2">No Family Members Yet</h3>
        <p className="text-muted-foreground text-sm">
          Switch to Table view to start adding family members
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search family members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("name")}
          >
            Sort by Name
          </Button>
          <Button
            variant={sortBy === "birthDate" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("birthDate")}
          >
            Sort by Date
          </Button>
        </div>
      </div>
      
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedMembers.length} of {members.length} family members
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedMembers.map((member) => {
          const spouses = getSpouses(member.id);
          const childrenCount = getChildrenCount(member.id);
          const relationshipsCount = getRelationshipsCount(member.id);
          
          return (
            <Card key={member.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 pb-4">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-primary/20 p-4 rounded-full">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-bold text-center text-lg">
                  {member.fullName || `${member.firstName} ${member.lastName}`}
                </h3>
                {member.tags && member.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mt-2">
                    {member.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="pt-4 space-y-3">
                {member.birthDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <div>Born: {member.birthDate}</div>
                      {member.deathDate && <div>Died: {member.deathDate}</div>}
                    </div>
                  </div>
                )}
                
                {member.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{typeof member.location === 'string' ? member.location : `${member.location.village || ''}, ${member.location.sector || ''}, ${member.location.district || ''}`.replace(/, ,/g, ',').replace(/^, |, $/g, '')}</span>
                  </div>
                )}
                
                {/* Relationships Summary */}
                <div className="pt-3 border-t space-y-2">
                  {spouses.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span className="text-muted-foreground">
                        Married to {spouses.map(s => s.fullName).join(", ")}
                      </span>
                    </div>
                  )}
                  
                  {childrenCount > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">
                        {childrenCount} {childrenCount === 1 ? "child" : "children"}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    {relationshipsCount} total relationships
                  </div>
                </div>
                
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewMember(member.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredAndSortedMembers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No family members found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
