"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FamilyMember, FamilyEdge } from "@/types/family-tree";

interface AddRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship: Partial<FamilyEdge>;
  onRelationshipChange: (relationship: Partial<FamilyEdge>) => void;
  members: FamilyMember[];
  onSave: () => void;
  suggestion?: string | null;
}

export function AddRelationshipDialog({
  open,
  onOpenChange,
  relationship,
  onRelationshipChange,
  members,
  onSave,
  suggestion,
}: AddRelationshipDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Relationship Type</Label>
            <Select
              value={relationship.type}
              onValueChange={(value) =>
                onRelationshipChange({ ...relationship, type: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent → Child</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>From</Label>
            <Select
              value={relationship.fromId}
              onValueChange={(value) =>
                onRelationshipChange({ ...relationship, fromId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>To</Label>
            <Select
              value={relationship.toId}
              onValueChange={(value) =>
                onRelationshipChange({ ...relationship, toId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {suggestion && (
            <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
              {suggestion}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={onSave} className="flex-1">
              Add Relationship
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
