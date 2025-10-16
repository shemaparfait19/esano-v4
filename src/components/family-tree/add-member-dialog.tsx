"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FamilyMember } from "@/types/family-tree";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Partial<FamilyMember>;
  onMemberChange: (member: Partial<FamilyMember>) => void;
  onSave: () => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  member,
  onMemberChange,
  onSave,
}: AddMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={member.firstName || ""}
                onChange={(e) =>
                  onMemberChange({ ...member, firstName: e.target.value })
                }
                placeholder="First name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={member.lastName || ""}
                onChange={(e) =>
                  onMemberChange({ ...member, lastName: e.target.value })
                }
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={member.birthDate || ""}
                onChange={(e) =>
                  onMemberChange({ ...member, birthDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="deathDate">Death Date</Label>
              <Input
                id="deathDate"
                type="date"
                value={member.deathDate || ""}
                onChange={(e) =>
                  onMemberChange({ ...member, deathDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={member.gender}
              onValueChange={(value) =>
                onMemberChange({ ...member, gender: value as "male" | "female" | "other" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={member.notes || ""}
              onChange={(e) =>
                onMemberChange({ ...member, notes: e.target.value })
              }
              placeholder="Additional notes"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={onSave} className="flex-1">
              Add Member
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
