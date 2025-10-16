"use client";

import React, { useMemo, useState } from "react";
import type { FamilyMember } from "@/types/family-tree";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface GenerationFormProps {
  members: FamilyMember[];
  onAdd: (payload: {
    members: FamilyMember[];
    edges: Array<{ fromId: string; toId: string; type: "parent" | "spouse" }>;
  }) => void;
  onSave?: () => void;
  readonly?: boolean;
}

type FamilyMemberForm = Partial<FamilyMember> & {
  spouseId?: string;
  parentIds?: string[];
  role?: string;
};

export function GenerationForm({
  members,
  onAdd,
  onSave,
  readonly,
}: GenerationFormProps) {
  const [generation, setGeneration] = useState<number>(0);
  const [rows, setRows] = useState<FamilyMemberForm[]>([
    {
      firstName: "",
      lastName: "",
      gender: undefined,
      birthDate: "",
      deathDate: "",
      isDeceased: false,
      email: undefined,
      spouseId: undefined,
      parentIds: [],
      role: undefined,
    },
  ]);

  const addRow = () => setRows((r) => [...r, { firstName: "", lastName: "" }]);

  const removeRow = (idx: number) =>
    setRows((r) => r.filter((_, i) => i !== idx));

  const handleChange = (
    idx: number,
    field: keyof FamilyMemberForm,
    value: any
  ) => {
    setRows((r) =>
      r.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = () => {
    const newMembers = rows
      .map((r) => ({
        id: `member_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        firstName: (r.firstName || "").trim(),
        lastName: (r.lastName || "").trim(),
        fullName: `${(r.firstName || "").trim()} ${(
          r.lastName || ""
        ).trim()}`.trim(),
        generation,
        gender: r.gender,
        birthDate: r.birthDate,
        deathDate: r.deathDate,
        isDeceased: !!r.isDeceased,
        tags: Array.isArray(r.tags) ? r.tags : r.role ? [r.role] : [],
        location: r.location,
        notes: r.notes,
        contacts: { email: r.email },
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      .filter((m) => m.fullName.length > 0);

    if (!newMembers.length) {
      toast({
        title: "Nothing to add",
        description: "Enter at least one member",
      });
      return;
    }

    const edges: Array<{
      fromId: string;
      toId: string;
      type: "parent" | "spouse";
    }> = [];

    rows.forEach((r, idx) => {
      const createdId = newMembers[idx]?.id;
      if (!createdId) return;

      if (Array.isArray(r.parentIds)) {
        r.parentIds.forEach((pid) => {
          if (pid) edges.push({ fromId: pid, toId: createdId, type: "parent" });
        });
      }

      if (r.spouseId) {
        edges.push({ fromId: createdId, toId: r.spouseId, type: "spouse" });
      }
    });

    onAdd({ members: newMembers, edges });
    if (onSave) onSave();

    toast({
      title: "Generation added",
      description: `Added ${newMembers.length} member(s)`,
    });

    setRows([{ firstName: "", lastName: "" }]);
  };

  return (
    <Card className="p-4 sm:p-6 space-y-6">
      {/* Generation Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b">
        <Label className="text-base font-semibold min-w-fit">
          Generation Level
        </Label>
        <Input
          type="number"
          min={0}
          value={generation}
          onChange={(e) => setGeneration(parseInt(e.target.value || "0", 10))}
          className="w-full sm:w-32"
          disabled={readonly}
        />
      </div>

      {/* Member Rows */}
      <div className="space-y-6">
        {rows.map((row, idx) => (
          <Card key={idx} className="p-4 sm:p-5 space-y-4 bg-muted/30">
            {/* Header with member number and remove button */}
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Member {idx + 1}
              </h3>
              {!readonly && rows.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(idx)}
                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">First Name</Label>
                  <Input
                    value={row.firstName || ""}
                    onChange={(e) =>
                      handleChange(idx, "firstName", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Last Name</Label>
                  <Input
                    value={row.lastName || ""}
                    onChange={(e) =>
                      handleChange(idx, "lastName", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Gender</Label>
                  <Select
                    value={row.gender || ""}
                    onValueChange={(v) => handleChange(idx, "gender", v)}
                    disabled={readonly}
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
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Important Dates
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Birth Date</Label>
                  <Input
                    type="date"
                    value={row.birthDate || ""}
                    onChange={(e) =>
                      handleChange(idx, "birthDate", e.target.value)
                    }
                    disabled={readonly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Death Date (if applicable)</Label>
                  <Input
                    type="date"
                    value={row.deathDate || ""}
                    onChange={(e) =>
                      handleChange(idx, "deathDate", e.target.value)
                    }
                    disabled={readonly}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Contact & Location
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input
                    type="email"
                    value={row.email || ""}
                    onChange={(e) => handleChange(idx, "email", e.target.value)}
                    disabled={readonly}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Location</Label>
                  <Input
                    value={row.location || ""}
                    onChange={(e) =>
                      handleChange(idx, "location", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            {/* Relationships */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Family Relationships
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Role</Label>
                  <Input
                    value={row.role || ""}
                    onChange={(e) =>
                      setRows((r) =>
                        r.map((it, i) =>
                          i === idx ? { ...it, role: e.target.value } : it
                        )
                      )
                    }
                    disabled={readonly}
                    placeholder="e.g., father, mother, son"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Spouse</Label>
                  <Select
                    value={row.spouseId || ""}
                    onValueChange={(v) =>
                      setRows((r) =>
                        r.map((it, i) =>
                          i === idx ? { ...it, spouseId: v || undefined } : it
                        )
                      )
                    }
                    disabled={readonly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select spouse" />
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
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label className="text-sm">Parents</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={rows[idx]?.parentIds?.[0] || ""}
                      onValueChange={(v) =>
                        setRows((r) =>
                          r.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  parentIds: [
                                    v || undefined,
                                    it.parentIds?.[1] || undefined,
                                  ].filter(Boolean),
                                }
                              : it
                          )
                        )
                      }
                      disabled={readonly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Parent 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={rows[idx]?.parentIds?.[1] || ""}
                      onValueChange={(v) =>
                        setRows((r) =>
                          r.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  parentIds: [
                                    it.parentIds?.[0] || undefined,
                                    v || undefined,
                                  ].filter(Boolean),
                                }
                              : it
                          )
                        )
                      }
                      disabled={readonly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Parent 2" />
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
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes & Memories
              </h4>
              <div className="space-y-2">
                <Textarea
                  value={row.notes || ""}
                  onChange={(e) => handleChange(idx, "notes", e.target.value)}
                  disabled={readonly}
                  placeholder="Add notes, memories, or additional information..."
                  className="min-h-[100px] resize-y"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      {!readonly && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={addRow}
            className="w-full sm:w-auto"
          >
            + Add Another Member
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full sm:w-auto bg-primary"
            size="lg"
          >
            Add Generation
          </Button>
        </div>
      )}
    </Card>
  );
}
