"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  useFamilyTreeStore, 
  selectMembers, 
  selectGenerations 
} from "@/lib/family-tree-store";
import { 
  Plus, 
  Trash2, 
  Save, 
  Edit, 
  ChevronDown, 
  ChevronUp,
  Users,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FamilyMember } from "@/types/family-tree";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Generation = {
  generation: number;
  name: string;
  subHeadId?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function GenerationManager() {
  const members = useFamilyTreeStore(selectMembers);
  const generations = useFamilyTreeStore(selectGenerations);
  const addGeneration = useFamilyTreeStore((state) => state.addGeneration);
  const updateGeneration = useFamilyTreeStore((state) => state.updateGeneration);
  const removeGeneration = useFamilyTreeStore((state) => state.removeGeneration);
  const tree = useFamilyTreeStore((state) => state.tree);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedGenerations, setExpandedGenerations] = useState<Record<number, boolean>>({});
  const [newGeneration, setNewGeneration] = useState<Generation>({
    generation: 0,
    name: "",
    subHeadId: "",
    description: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const handleSaveGeneration = () => {
    if (editingIndex !== null && editingIndex >= 0) {
      // Update existing generation
      updateGeneration(editingIndex, {
        ...newGeneration,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Add new generation
      addGeneration({
        ...newGeneration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Reset form
    setNewGeneration({
      generation: 0,
      name: "",
      subHeadId: "",
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewGeneration(generations[index]);
  };

  const handleDelete = (index: number) => {
    removeGeneration(index);
  };

  const toggleExpandGeneration = (index: number) => {
    setExpandedGenerations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getMembersInGeneration = (generationNumber: number): FamilyMember[] => {
    return members.filter(member => member.generation === generationNumber);
  };

  const getSubHead = (generation: Generation): FamilyMember | undefined => {
    if (!generation.subHeadId) return undefined;
    return members.find(m => m.id === generation.subHeadId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Generations
        </h3>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setEditingIndex(-1)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Generation
        </Button>
      </div>

      {(editingIndex !== null) && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium mb-4">
            {editingIndex >= 0 ? 'Edit Generation' : 'Add New Generation'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="generation-number">Generation Number *</Label>
              <Input
                id="generation-number"
                type="number"
                value={newGeneration.generation}
                onChange={(e) => setNewGeneration({
                  ...newGeneration, 
                  generation: parseInt(e.target.value) || 0
                })}
                min="0"
                placeholder="e.g., 1, 2, 3..."
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers represent older generations
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="generation-name">Generation Name *</Label>
              <Input
                id="generation-name"
                value={newGeneration.name}
                onChange={(e) => setNewGeneration({
                  ...newGeneration, 
                  name: e.target.value
                })}
                placeholder="e.g., Great Grandparents"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subhead">Sub-Head</Label>
              <Select
                value={newGeneration.subHeadId || "none"}
                onValueChange={(value) => setNewGeneration({
                  ...newGeneration, 
                  subHeadId: value === "none" ? "" : value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a family member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">None selected</span>
                  </SelectItem>
                  {members
                    .filter(member => member.generation === newGeneration.generation)
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                            <AvatarFallback>
                              {member.fullName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {member.fullName}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional: Select a representative for this generation
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="generation-description">Description</Label>
              <textarea
                id="generation-description"
                value={newGeneration.description || ''}
                onChange={(e) => setNewGeneration({
                  ...newGeneration, 
                  description: e.target.value
                })}
                placeholder="Add notes about this generation..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingIndex(null);
                setNewGeneration({
                  generation: 0,
                  name: "",
                  subHeadId: "",
                  description: "",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              }}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handleSaveGeneration}
              disabled={!newGeneration.name || newGeneration.generation === undefined}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {editingIndex >= 0 ? 'Update' : 'Add'} Generation
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {generations.length === 0 ? (
          <div className="text-center p-6 border rounded-lg bg-muted/20">
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No generations added yet</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={() => setEditingIndex(-1)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Generation
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {generations
              .sort((a, b) => a.generation - b.generation)
              .map((gen, index) => {
                const isExpanded = expandedGenerations[index] || false;
                const membersInGeneration = getMembersInGeneration(gen.generation);
                const subHead = getSubHead(gen);
                
                return (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/20 transition-colors",
                      isExpanded && "bg-muted/10"
                    )}>
                      <div 
                        className="flex-1 flex items-center gap-3"
                        onClick={() => toggleExpandGeneration(index)}
                      >
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {gen.generation}
                            </span>
                            {gen.name}
                            {subHead && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {subHead.fullName}
                              </Badge>
                            )}
                          </div>
                          
                          {gen.description && !isExpanded && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {gen.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {membersInGeneration.length} member{membersInGeneration.length !== 1 ? 's' : ''}
                        </Badge>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(index);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete the "${gen.name}" generation?`)) {
                              handleDelete(index);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t p-3 bg-muted/5">
                        {gen.description && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {gen.description}
                          </p>
                        )}
                        
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Members ({membersInGeneration.length})
                          </h4>
                          
                          {membersInGeneration.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {membersInGeneration.map(member => (
                                <div 
                                  key={member.id} 
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-md hover:bg-muted/30",
                                    member.id === gen.subHeadId && "bg-primary/5 border border-primary/10"
                                  )}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                                    <AvatarFallback>
                                      {member.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {member.fullName}
                                      {member.id === gen.subHeadId && (
                                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                          Sub-Head
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {member.birthDate && (
                                        <span>Born {new Date(member.birthDate).getFullYear()}</span>
                                      )}
                                      {member.deathDate && (
                                        <span> - {new Date(member.deathDate).getFullYear()}</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <p className="text-sm">No members assigned to this generation</p>
                              <p className="text-xs mt-1">Add members and set their generation number</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div>
                              {gen.createdAt && (
                                <span>Created: {new Date(gen.createdAt).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div>
                              {gen.updatedAt && gen.updatedAt !== gen.createdAt && (
                                <span>Updated: {new Date(gen.updatedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
