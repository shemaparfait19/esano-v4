"use client";

import React, { useMemo, useState } from "react";
import type { FamilyMember } from "@/types/family-tree";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface MemberDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: FamilyMember | null;
  ownerId: string;
  readonly?: boolean;
  onSave?: (member: FamilyMember) => void;
  onDelete?: (memberId: string) => void;
}

export function MemberDetailDrawer({
  open,
  onOpenChange,
  member,
  ownerId,
  readonly,
  onSave,
  onDelete,
}: MemberDetailDrawerProps) {
  const [draft, setDraft] = useState<FamilyMember | null>(member);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => setDraft(member), [member]);

  if (!draft) return null;

  async function upload(kind: "media" | "voice" | "timeline", file: File) {
    try {
      setUploading(true);
      const form = new FormData();
      form.append("userId", ownerId);
      form.append("memberId", draft.id);
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch("/api/family-tree/media", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast({ title: "Uploaded" });
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleField<K extends keyof FamilyMember>(
    key: K,
    value: FamilyMember[K]
  ) {
    setDraft((prev) =>
      prev
        ? { ...prev, [key]: value, updatedAt: new Date().toISOString() }
        : prev
    );
  }

  function save() {
    if (!draft || !onSave) return;
    onSave(draft);
    toast({ title: "Saved" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit member</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input
              value={draft.fullName}
              onChange={(e) => handleField("fullName", e.target.value)}
              disabled={readonly}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Birth date</Label>
                <Input
                  type="date"
                  value={draft.birthDate || ""}
                  onChange={(e) => handleField("birthDate", e.target.value)}
                  disabled={readonly}
                />
              </div>
              <div>
                <Label>Death date</Label>
                <Input
                  type="date"
                  value={draft.deathDate || ""}
                  onChange={(e) => handleField("deathDate", e.target.value)}
                  disabled={readonly}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Gender</Label>
                <Select
                  value={(draft.gender as any) || ""}
                  onValueChange={(v) => handleField("gender", v as any)}
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
              <div>
                <Label>Generation</Label>
                <Input
                  type="number"
                  value={draft.generation ?? 0}
                  onChange={(e) =>
                    handleField(
                      "generation",
                      parseInt(e.target.value || "0", 10) as any
                    )
                  }
                  disabled={readonly}
                />
              </div>
            </div>
            <Label>Location</Label>
            <Input
              value={draft.location || ""}
              onChange={(e) => handleField("location", e.target.value)}
              disabled={readonly}
            />
            <Label>Tags (comma separated)</Label>
            <Input
              value={(draft.tags || []).join(", ")}
              onChange={(e) =>
                handleField(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean) as any
                )
              }
              disabled={readonly}
            />
            <Label>Notes / memories</Label>
            <Textarea
              value={draft.notes || ""}
              onChange={(e) => handleField("notes", e.target.value as any)}
              disabled={readonly}
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label>Upload photo/video</Label>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={(e) =>
                  e.target.files && upload("media", e.target.files[0])
                }
                disabled={readonly || uploading}
              />
            </div>
            <div>
              <Label>Upload voice</Label>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) =>
                  e.target.files && upload("voice", e.target.files[0])
                }
                disabled={readonly || uploading}
              />
            </div>
            <div>
              <Label>Add timeline media</Label>
              <Input
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={(e) =>
                  e.target.files && upload("timeline", e.target.files[0])
                }
                disabled={readonly || uploading}
              />
            </div>
            <div className="flex gap-2">
              {!readonly && <Button onClick={save}>Save</Button>}
              {!readonly && onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => onDelete(draft.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
