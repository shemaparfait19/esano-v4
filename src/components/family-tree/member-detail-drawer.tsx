"use client";

import React, { useMemo, useState } from "react";
import type { FamilyMember, FamilyEdge } from "@/types/family-tree";
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
  members?: FamilyMember[];
  edges?: FamilyEdge[];
  onAddEdge?: (edge: {
    fromId: string;
    toId: string;
    type: FamilyEdge["type"];
  }) => void;
  onRemoveEdge?: (edgeId: string) => void;
}

export function MemberDetailDrawer({
  open,
  onOpenChange,
  member,
  ownerId,
  readonly,
  onSave,
  onDelete,
  members = [],
  edges = [],
  onAddEdge,
  onRemoveEdge,
}: MemberDetailDrawerProps) {
  const [draft, setDraft] = useState<FamilyMember | null>(member);
  const [uploading, setUploading] = useState(false);
  const [relSpouse, setRelSpouse] = useState<string | "">("");
  const [relParent1, setRelParent1] = useState<string | "">("");
  const [relParent2, setRelParent2] = useState<string | "">("");
  const [relExtraType, setRelExtraType] = useState<FamilyEdge["type"] | "">("");
  const [relExtraTarget, setRelExtraTarget] = useState<string | "">("");

  React.useEffect(() => {
    setDraft(member);
    if (!member) return;
    const curSpouses = edges
      .filter(
        (e) =>
          e.type === "spouse" &&
          (e.fromId === member.id || e.toId === member.id)
      )
      .map((e) => (e.fromId === member.id ? e.toId : e.fromId));
    setRelSpouse(curSpouses[0] || "");
    const curParents = edges
      .filter((e) => e.type === "parent" && e.toId === member.id)
      .map((e) => e.fromId)
      .slice(0, 2);
    setRelParent1(curParents[0] || "");
    setRelParent2(curParents[1] || "");
  }, [member, edges]);

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
      // Update local draft so user sees the media immediately
      setDraft((prev) => {
        if (!prev) return prev;
        if (kind === "voice") {
          const list = Array.isArray(prev.voiceUrls) ? prev.voiceUrls : [];
          return { ...prev, voiceUrls: [...list, data.url] } as any;
        }
        if (kind === "timeline") {
          const list = Array.isArray(prev.timeline) ? prev.timeline : [];
          return {
            ...prev,
            timeline: [
              ...list,
              {
                id: `tl_${Date.now()}`,
                type: file.type.startsWith("audio")
                  ? "audio"
                  : file.type.startsWith("video")
                  ? "video"
                  : "photo",
                date: new Date().toISOString(),
                url: data.url,
              },
            ],
          } as any;
        }
        const list = Array.isArray(prev.mediaUrls) ? prev.mediaUrls : [];
        return { ...prev, mediaUrls: [...list, data.url] } as any;
      });
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

  function saveRelationships() {
    if (!draft) return;
    const me = draft.id;
    const desiredParents = [relParent1, relParent2].filter(Boolean) as string[];
    const currentParentEdges = edges.filter(
      (e) => e.type === "parent" && e.toId === me
    );
    currentParentEdges.forEach((e) => {
      if (!desiredParents.includes(e.fromId)) onRemoveEdge?.(e.id);
    });
    desiredParents.forEach((pid) => {
      const exists = currentParentEdges.some((e) => e.fromId === pid);
      if (!exists) onAddEdge?.({ fromId: pid, toId: me, type: "parent" });
    });

    const desiredSpouse = relSpouse || "";
    const currentSpouseEdges = edges.filter(
      (e) => e.type === "spouse" && (e.fromId === me || e.toId === me)
    );
    currentSpouseEdges.forEach((e) => {
      const other = e.fromId === me ? e.toId : e.fromId;
      if (!desiredSpouse || other !== desiredSpouse) onRemoveEdge?.(e.id);
    });
    if (desiredSpouse) {
      const exists = currentSpouseEdges.some((e) => {
        const other = e.fromId === me ? e.toId : e.fromId;
        return other === desiredSpouse;
      });
      if (!exists)
        onAddEdge?.({ fromId: me, toId: desiredSpouse, type: "spouse" });
    }
    toast({ title: "Relationships updated" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl"
        aria-describedby="member-detail-desc"
      >
        <DialogHeader>
          <DialogTitle>Edit member</DialogTitle>
        </DialogHeader>
        <p id="member-detail-desc" className="sr-only">
          Edit personal details, upload memories and manage timeline for this
          family member.
        </p>
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
            {/* Relationship Manager */}
            <div className="space-y-2">
              <Label className="font-medium">Relationships</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Parent 1</Label>
                  <Select
                    value={relParent1}
                    onValueChange={(v) => setRelParent1(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent" />
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
                  <Label>Parent 2</Label>
                  <Select
                    value={relParent2}
                    onValueChange={(v) => setRelParent2(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent" />
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
                <div className="md:col-span-2">
                  <Label>Spouse</Label>
                  <Select
                    value={relSpouse}
                    onValueChange={(v) => setRelSpouse(v)}
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
                <div>
                  <Label>Extra relation</Label>
                  <Select
                    value={(relExtraType as any) || ""}
                    onValueChange={(v) => setRelExtraType(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="big_brother">Big Brother</SelectItem>
                      <SelectItem value="little_brother">
                        Little Brother
                      </SelectItem>
                      <SelectItem value="big_sister">Big Sister</SelectItem>
                      <SelectItem value="little_sister">
                        Little Sister
                      </SelectItem>
                      <SelectItem value="aunt">Aunt</SelectItem>
                      <SelectItem value="uncle">Uncle</SelectItem>
                      <SelectItem value="cousin_big">Cousin (Older)</SelectItem>
                      <SelectItem value="cousin_little">
                        Cousin (Younger)
                      </SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target member</Label>
                  <Select
                    value={relExtraTarget}
                    onValueChange={(v) => setRelExtraTarget(v)}
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
              </div>
            </div>
            <div>
              <Label>Upload photo/video</Label>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2 * 1024 * 1024) {
                    toast({
                      title: "File too large",
                      description: "Max 2MB",
                      variant: "destructive",
                    });
                    return;
                  }
                  upload("media", f);
                }}
                disabled={readonly || uploading}
              />
            </div>
            <div>
              <Label>Upload voice</Label>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2 * 1024 * 1024) {
                    toast({
                      title: "File too large",
                      description: "Max 2MB",
                      variant: "destructive",
                    });
                    return;
                  }
                  upload("voice", f);
                }}
                disabled={readonly || uploading}
              />
            </div>
            <div>
              <Label>Add timeline media</Label>
              <Input
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2 * 1024 * 1024) {
                    toast({
                      title: "File too large",
                      description: "Max 2MB",
                      variant: "destructive",
                    });
                    return;
                  }
                  upload("timeline", f);
                }}
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
              {!readonly && (onAddEdge || onRemoveEdge) && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    saveRelationships();
                    if (relExtraType && relExtraTarget) {
                      onAddEdge?.({
                        fromId: draft.id,
                        toId: relExtraTarget,
                        type: relExtraType as any,
                      });
                    }
                  }}
                >
                  Save Relationships
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
