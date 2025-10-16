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
import { RelationshipInferenceEngine } from "@/lib/relationship-inference-engine";
import { Sparkles, Info } from "lucide-react";

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
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize relationship inference engine
  const relationshipEngine = useMemo(() => {
    if (members.length === 0 || !member) return null;
    return new RelationshipInferenceEngine(members, edges);
  }, [members, edges, member]);

  // Get all inferred relationships for this member
  const inferredRelationships = useMemo(() => {
    if (!relationshipEngine || !member) return [];
    return relationshipEngine.getAllRelationshipsFor(member.id);
  }, [relationshipEngine, member]);

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
    
    console.log('💾 Saving relationships for:', draft.fullName);
    console.log('  Parents:', [relParent1, relParent2].filter(Boolean));
    console.log('  Spouse:', relSpouse);
    
    const desiredParents = [relParent1, relParent2].filter(Boolean) as string[];
    const currentParentEdges = edges.filter(
      (e) => e.type === "parent" && e.toId === me
    );
    
    // Remove old parent edges
    currentParentEdges.forEach((e) => {
      if (!desiredParents.includes(e.fromId)) {
        console.log('  ➖ Removing parent edge:', e.fromId);
        onRemoveEdge?.(e.id);
      }
    });
    
    // Add new parent edges
    desiredParents.forEach((pid) => {
      const exists = currentParentEdges.some((e) => e.fromId === pid);
      if (!exists) {
        console.log('  ➕ Adding parent edge:', pid);
        onAddEdge?.({ fromId: pid, toId: me, type: "parent" });
      }
    });

    const desiredSpouse = relSpouse || "";
    const currentSpouseEdges = edges.filter(
      (e) => e.type === "spouse" && (e.fromId === me || e.toId === me)
    );
    
    // Remove old spouse edges
    currentSpouseEdges.forEach((e) => {
      const other = e.fromId === me ? e.toId : e.fromId;
      if (!desiredSpouse || other !== desiredSpouse) {
        console.log('  ➖ Removing spouse edge:', other);
        onRemoveEdge?.(e.id);
      }
    });
    
    // Add new spouse edge
    if (desiredSpouse) {
      const exists = currentSpouseEdges.some((e) => {
        const other = e.fromId === me ? e.toId : e.fromId;
        return other === desiredSpouse;
      });
      if (!exists) {
        console.log('  ➕ Adding spouse edge:', desiredSpouse);
        onAddEdge?.({ fromId: me, toId: desiredSpouse, type: "spouse" });
      }
    }
    
    toast({ title: "Relationships updated", description: "Changes will be saved automatically" });
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
            {/* AI-Powered Relationship Manager */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  AI-Powered Relationships
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-xs"
                >
                  <Info className="w-3 h-3 mr-1" />
                  {showSuggestions ? "Hide" : "Show"} Detected
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select direct relationships. AI will automatically detect extended family (grandparents, aunts, uncles, cousins, etc.)
              </p>
              
              {/* Show AI-detected relationships */}
              {showSuggestions && inferredRelationships.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                    <Sparkles className="w-3 h-3" />
                    AI-Detected Relationships ({inferredRelationships.length})
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {inferredRelationships.slice(0, 20).map((rel) => {
                      const relMember = members.find(m => m.id === rel.toId);
                      if (!relMember) return null;
                      return (
                        <div key={rel.toId} className="text-xs bg-white rounded px-2 py-1 border border-amber-100">
                          <span className="font-medium">{relMember.fullName}</span>
                          <span className="text-amber-700 ml-1">({rel.description})</span>
                        </div>
                      );
                    })}
                  </div>
                  {inferredRelationships.length > 20 && (
                    <p className="text-xs text-amber-600">
                      +{inferredRelationships.length - 20} more relationships detected
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Parent 1</Label>
                  <Select
                    value={relParent1}
                    onValueChange={(v) => setRelParent1(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {members.filter(m => m.id !== draft?.id).map((m) => (
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
                    onValueChange={(v) => setRelParent2(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {members.filter(m => m.id !== draft?.id).map((m) => (
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
                    onValueChange={(v) => setRelSpouse(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select spouse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {members.filter(m => m.id !== draft?.id).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Extra relation (optional)</Label>
                  <Select
                    value={(relExtraType as any) || ""}
                    onValueChange={(v) => setRelExtraType(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="grandchild">Grandchild</SelectItem>
                      <SelectItem value="great_grandparent">Great-Grandparent</SelectItem>
                      <SelectItem value="great_grandchild">Great-Grandchild</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="big_brother">Big Brother</SelectItem>
                      <SelectItem value="little_brother">Little Brother</SelectItem>
                      <SelectItem value="big_sister">Big Sister</SelectItem>
                      <SelectItem value="little_sister">Little Sister</SelectItem>
                      <SelectItem value="half_sibling">Half-Sibling</SelectItem>
                      <SelectItem value="aunt">Aunt</SelectItem>
                      <SelectItem value="uncle">Uncle</SelectItem>
                      <SelectItem value="niece">Niece</SelectItem>
                      <SelectItem value="nephew">Nephew</SelectItem>
                      <SelectItem value="cousin">Cousin</SelectItem>
                      <SelectItem value="cousin_big">Cousin (Older)</SelectItem>
                      <SelectItem value="cousin_little">Cousin (Younger)</SelectItem>
                      <SelectItem value="second_cousin">Second Cousin</SelectItem>
                      <SelectItem value="in_law">In-Law</SelectItem>
                      <SelectItem value="step_parent">Step-Parent</SelectItem>
                      <SelectItem value="step_child">Step-Child</SelectItem>
                      <SelectItem value="step_sibling">Step-Sibling</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="godparent">Godparent</SelectItem>
                      <SelectItem value="godchild">Godchild</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target member</Label>
                  <Select
                    value={relExtraTarget}
                    onValueChange={(v) => setRelExtraTarget(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {members.filter(m => m.id !== draft?.id).map((m) => (
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
