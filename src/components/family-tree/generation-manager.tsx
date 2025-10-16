"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFamilyTreeStore } from "@/lib/family-tree-store";
import { Plus, Trash2, Save, Edit } from "lucide-react";

export function GenerationManager() {
  const members = useFamilyTreeStore(selectMembers);
  const generations = useFamilyTreeStore(selectGenerations);
  const updateTree = useFamilyTreeStore((state) => state.setTree);
  const tree = useFamilyTreeStore((state) => state.tree);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newGeneration, setNewGeneration] = useState({
    generation: 0,
    name: "",
    subHeadId: "",
    description: ""
  });

  const handleSaveGeneration = () => {
    if (!tree) return;

    const updatedGenerations = [...(tree.generations || [])];
    
    if (editingIndex !== null) {
      updatedGenerations[editingIndex] = newGeneration;
    } else {
      updatedGenerations.push(newGeneration);
    }

    updateTree({
      ...tree,
      generations: updatedGenerations
    });

    setNewGeneration({
      generation: 0,
      name: "",
      subHeadId: "",
      description: ""
    });
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewGeneration(generations[index]);
  };

  const handleDelete = (index: number) => {
    if (!tree) return;
    
    const updatedGenerations = [...generations];
    updatedGenerations.splice(index, 1);
    
    updateTree({
      ...tree,
      generations: updatedGenerations
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Generations</h3>
        <Button 
          size="sm" 
          onClick={() => setEditingIndex(-1)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Generation
        </Button>
      </div>

      {(editingIndex !== null) && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="generation-number">Generation Number</Label>
              <Input
                id="generation-number"
                type="number"
                value={newGeneration.generation}
                onChange={(e) => setNewGeneration({...newGeneration, generation: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generation-name">Generation Name</Label>
              <Input
                id="generation-name"
                value={newGeneration.name}
                onChange={(e) => setNewGeneration({...newGeneration, name: e.target.value})}
                placeholder="e.g., Great Grandparents"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subhead">Sub-Head</Label>
              <Select
                value={newGeneration.subHeadId}
                onValueChange={(value) => setNewGeneration({...newGeneration, subHeadId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-head" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="generation-description">Description</Label>
              <Input
                id="generation-description"
                value={newGeneration.description}
                onChange={(e) => setNewGeneration({...newGeneration, description: e.target.value})}
                placeholder="Brief description of this generation"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingIndex(null);
                setNewGeneration({
                  generation: 0,
                  name: "",
                  subHeadId: "",
                  description: ""
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveGeneration}
              disabled={!newGeneration.name || newGeneration.generation === undefined}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingIndex >= 0 ? 'Update' : 'Add'} Generation
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {generations
          .sort((a, b) => a.generation - b.generation)
          .map((gen, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">
                  Generation {gen.generation}: {gen.name}
                </div>
                {gen.subHeadId && (
                  <div className="text-sm text-muted-foreground">
                    Sub-Head: {members.find(m => m.id === gen.subHeadId)?.fullName || 'Not set'}
                  </div>
                )}
                {gen.description && (
                  <p className="text-sm text-muted-foreground mt-1">{gen.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleEdit(index)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  variant="destructive"
                  onClick={() => handleDelete(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
