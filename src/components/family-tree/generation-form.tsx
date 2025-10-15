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
  onAddMembers: (newMembers: FamilyMember[]) => void;
  onSave?: () => void;
  readonly?: boolean;
}

export function GenerationForm({
  members,
  onAddMembers,
  onSave,
  readonly,
}: GenerationFormProps) {
  const [generation, setGeneration] = useState<number>(0);
  const [rows, setRows] = useState<Array<Partial<FamilyMember>>>([
    {
      firstName: "",
      lastName: "",
      gender: undefined,
      birthDate: "",
      deathDate: "",
      isDeceased: false,
      email: undefined as any,
    },
  ]);

  const addRow = () => setRows((r) => [...r, { firstName: "", lastName: "" }]);
  const removeRow = (idx: number) =>
    setRows((r) => r.filter((_, i) => i !== idx));

  const handleChange = (idx: number, field: keyof FamilyMember, value: any) => {
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
        tags: Array.isArray(r.tags as any) ? (r.tags as any as string[]) : [],
        location: r.location,
        notes: r.notes as any,
        contacts: { email: (r as any).email },
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
    onAddMembers(newMembers as any);
    if (onSave) onSave();
    toast({
      title: "Generation added",
      description: `Added ${newMembers.length} member(s)`,
    });
    setRows([{ firstName: "", lastName: "" }]);
  };

  return (
    <Card className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Label>Generation</Label>
        <Input
          type="number"
          min={0}
          value={generation}
          onChange={(e) => setGeneration(parseInt(e.target.value || "0", 10))}
          className="w-24"
          disabled={readonly}
        />
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-2 md:grid-cols-6 gap-2 items-start"
          >
            <div className="space-y-1">
              <Label>First name</Label>
              <Input
                value={row.firstName || ""}
                onChange={(e) => handleChange(idx, "firstName", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-1">
              <Label>Last name</Label>
              <Input
                value={row.lastName || ""}
                onChange={(e) => handleChange(idx, "lastName", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-1">
              <Label>Gender</Label>
              <Select
                value={(row.gender as any) || ""}
                onValueChange={(v) => handleChange(idx, "gender", v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Birth date</Label>
              <Input
                type="date"
                value={row.birthDate || ""}
                onChange={(e) => handleChange(idx, "birthDate", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-1">
              <Label>Death date</Label>
              <Input
                type="date"
                value={row.deathDate || ""}
                onChange={(e) => handleChange(idx, "deathDate", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={(row as any).email || ""}
                onChange={(e) =>
                  handleChange(idx, "email" as any, e.target.value)
                }
                disabled={readonly}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Location</Label>
              <Input
                value={row.location || ""}
                onChange={(e) => handleChange(idx, "location", e.target.value)}
                disabled={readonly}
              />
            </div>
            <div className="space-y-1 md:col-span-4">
              <Label>Notes / memories</Label>
              <Textarea
                value={(row.notes as any) || ""}
                onChange={(e) =>
                  handleChange(idx, "notes" as any, e.target.value)
                }
                disabled={readonly}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              {!readonly && (
                <Button variant="outline" onClick={() => removeRow(idx)}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readonly && (
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={addRow}>
            Add another
          </Button>
          <Button onClick={handleSubmit}>Add generation</Button>
        </div>
      )}
    </Card>
  );
}
