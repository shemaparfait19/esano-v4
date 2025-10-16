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
import { LocationSelector } from "./location-selector";

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
  const [relChildren, setRelChildren] = useState<string[]>([]);
  const [relSiblings, setRelSiblings] = useState<string[]>([]);
  const [relExtraType, setRelExtraType] = useState<FamilyEdge["type"] | "">("");
  const [relExtraTarget, setRelExtraTarget] = useState<string | "">("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize relationship inference engine
  const relationshipEngine = useMemo(() => {
    if (members.length === 0 || !member) return null;
    // Filter out invalid members
    const validMembers = members.filter(m => m && typeof m === 'object' && m.id);
    if (validMembers.length === 0) return null;
    return new RelationshipInferenceEngine(validMembers, edges);
  }, [members, edges, member]);

  // Get all inferred relationships for this member
  const inferredRelationships = useMemo(() => {
    if (!relationshipEngine || !member) return [];
    return relationshipEngine.getAllRelationshipsFor(member.id);
  }, [relationshipEngine, member]);

  React.useEffect(() => {
    setDraft(member);
    if (!member) return;
    
    // Initialize relationships from edges
    const parents = edges.filter(e => e.type === "parent" && e.toId === member.id).map(e => e.fromId);
    setRelParent1(parents[0] || "");
    setRelParent2(parents[1] || "");
    
    const spouse = edges.find(e => e.type === "spouse" && (e.fromId === member.id || e.toId === member.id));
    if (spouse) {
      setRelSpouse(spouse.fromId === member.id ? spouse.toId : spouse.fromId);
    } else {
      setRelSpouse("");
    }
    
    const children = edges.filter(e => e.type === "parent" && e.fromId === member.id).map(e => e.toId);
    setRelChildren(children);
    
    const siblings = edges.filter(e => e.type === "sibling" && (e.fromId === member.id || e.toId === member.id))
      .map(e => e.fromId === member.id ? e.toId : e.fromId);
    setRelSiblings(siblings);
  }, [member, edges]);

  if (!draft) return null;

  async function upload(kind: "media" | "voice" | "timeline" | "document", file: File) {
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
        if (kind === "document") {
          const list = Array.isArray(prev.documentUrls) ? prev.documentUrls : [];
          return { ...prev, documentUrls: [...list, { url: data.url, name: file.name, uploadedAt: new Date().toISOString() }] } as any;
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
    if (key === 'location') {
      console.log('📍 Location field updated:', value);
    }
    setDraft((prev) =>
      prev
        ? { ...prev, [key]: value, updatedAt: new Date().toISOString() }
        : prev
    );
  }

  function save() {
    if (!draft || !onSave) return;
    console.log('💾 Saving member:', draft.id, draft.fullName);
    console.log('📍 Location in draft:', draft.location);
    console.log('📦 Full draft object:', JSON.stringify(draft, null, 2));
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

    // Handle spouse
    const desiredSpouse = relSpouse || "";
    const currentSpouseEdges = edges.filter(
      (e) => e.type === "spouse" && (e.fromId === me || e.toId === me)
    );
    
    currentSpouseEdges.forEach((e) => {
      const other = e.fromId === me ? e.toId : e.fromId;
      if (!desiredSpouse || other !== desiredSpouse) {
        console.log('  ➖ Removing spouse edge:', other);
        onRemoveEdge?.(e.id);
      }
    });
    
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
    
    // Handle children
    const currentChildEdges = edges.filter((e) => e.type === "parent" && e.fromId === me);
    
    currentChildEdges.forEach((e) => {
      if (!relChildren.includes(e.toId)) {
        console.log('  ➖ Removing child edge:', e.toId);
        onRemoveEdge?.(e.id);
      }
    });
    
    relChildren.forEach((childId) => {
      const exists = currentChildEdges.some((e) => e.toId === childId);
      if (!exists) {
        console.log('  ➕ Adding child edge:', childId);
        onAddEdge?.({ fromId: me, toId: childId, type: "parent" });
      }
    });
    
    // Handle siblings
    const currentSiblingEdges = edges.filter(
      (e) => e.type === "sibling" && (e.fromId === me || e.toId === me)
    );
    
    currentSiblingEdges.forEach((e) => {
      const other = e.fromId === me ? e.toId : e.fromId;
      if (!relSiblings.includes(other)) {
        console.log('  ➖ Removing sibling edge:', other);
        onRemoveEdge?.(e.id);
      }
    });
    
    relSiblings.forEach((siblingId) => {
      const exists = currentSiblingEdges.some((e) => {
        const other = e.fromId === me ? e.toId : e.fromId;
        return other === siblingId;
      });
      if (!exists) {
        console.log('  ➕ Adding sibling edge:', siblingId);
        onAddEdge?.({ fromId: me, toId: siblingId, type: "sibling" });
      }
    });
    
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
            <Label>Location in Rwanda</Label>
            <LocationSelector
              value={(draft.location && typeof draft.location === 'object' && !Array.isArray(draft.location)) ? draft.location as any : undefined}
              onChange={(loc) => handleField("location", loc as any)}
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
                  {showSuggestions ? "Hide" : "Show"} AI Detected
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select direct relationships. AI will automatically detect extended family (grandparents, aunts, uncles, cousins, etc.)
              </p>
              
              {/* Show AI-detected relationships with robust error handling */}
              {showSuggestions && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                    <Sparkles className="w-3 h-3" />
                    AI-Detected Relationships
                  </div>
                  {inferredRelationships.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {inferredRelationships
                          .slice(0, 20)
                          .filter(rel => {
                            // Strict validation
                            if (!rel || typeof rel !== 'object') return false;
                            if (!rel.toId || typeof rel.toId !== 'string') return false;
                            if (!rel.description || typeof rel.description !== 'string') return false;
                            return true;
                          })
                          .map((rel, idx) => {
                            const relMember = members.find(m => m?.id === rel.toId);
                            if (!relMember || !relMember.fullName || typeof relMember.fullName !== 'string') {
                              return null;
                            }
                            return (
                              <div 
                                key={`rel-${rel.toId}-${idx}`} 
                                className="text-xs bg-white rounded px-2 py-1 border border-amber-100"
                              >
                                <span className="font-medium">{String(relMember.fullName)}</span>
                                <span className="text-amber-700 ml-1">({String(rel.description)})</span>
                              </div>
                            );
                          })
                          .filter(Boolean)}
                      </div>
                      {inferredRelationships.length > 20 && (
                        <p className="text-xs text-amber-600">
                          +{inferredRelationships.length - 20} more relationships detected
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No relationships detected yet. Add parents to see AI-inferred family connections.
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Parent 1</Label>
                  <Select
                    value={relParent1 || "none"}
                    onValueChange={(v) => setRelParent1(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {members.filter(m => m?.id && typeof m.fullName === 'string' && m.id !== draft?.id).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName || m.firstName || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Parent 2</Label>
                  <Select
                    value={relParent2 || "none"}
                    onValueChange={(v) => setRelParent2(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {members.filter(m => m?.id && typeof m.fullName === 'string' && m.id !== draft?.id).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName || m.firstName || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Spouse</Label>
                  <Select
                    value={relSpouse || "none"}
                    onValueChange={(v) => setRelSpouse(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select spouse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {members.filter(m => m?.id && typeof m.fullName === 'string' && m.id !== draft?.id).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName || m.firstName || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Children (multi-select)</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                    {members
                      .filter(m => m?.id && typeof m.fullName === 'string' && m.id !== draft?.id)
                      .map((m) => {
                        const isSelected = relChildren.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              if (readonly) return;
                              setRelChildren(prev => 
                                isSelected 
                                  ? prev.filter(id => id !== m.id)
                                  : [...prev, m.id]
                              );
                            }}
                            disabled={readonly}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-blue-500 text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {m.fullName}
                          </button>
                        );
                      })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Click to select/deselect children</p>
                </div>
                <div className="md:col-span-2">
                  <Label>Siblings (multi-select)</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                    {members
                      .filter(m => m?.id && typeof m.fullName === 'string' && m.id !== draft?.id)
                      .map((m) => {
                        const isSelected = relSiblings.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              if (readonly) return;
                              setRelSiblings(prev => 
                                isSelected 
                                  ? prev.filter(id => id !== m.id)
                                  : [...prev, m.id]
                              );
                            }}
                            disabled={readonly}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-purple-500 text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {m.fullName}
                          </button>
                        );
                      })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Click to select/deselect siblings</p>
                </div>
                <div>
                  <Label>Extra relation (optional)</Label>
                  <Select
                    value={(relExtraType as any) || "none"}
                    onValueChange={(v) => setRelExtraType(v === "none" ? "" : (v as any))}
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
                    value={relExtraTarget || "none"}
                    onValueChange={(v) => setRelExtraTarget(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {members.filter(m => m?.id && typeof m.fullName === 'string' && m.id !== draft?.id).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName || m.firstName || "Unknown"}
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
                  const maxSize = 50 * 1024 * 1024; // 50MB
                  if (f.size > maxSize) {
                    toast({
                      title: "File too large",
                      description: "Max size is 50MB",
                      variant: "destructive",
                    });
                    return;
                  }
                  upload("voice", f);
                }}
                disabled={readonly || uploading}
              />
              {draft.voiceUrls && draft.voiceUrls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {draft.voiceUrls.map((url, i) => (
                    <audio key={i} src={url} controls className="w-full" />
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Upload documents (PDF, Word, etc.)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const maxSize = 50 * 1024 * 1024; // 50MB
                  if (f.size > maxSize) {
                    toast({
                      title: "File too large",
                      description: "Max size is 50MB",
                      variant: "destructive",
                    });
                    return;
                  }
                  upload("document", f);
                }}
                disabled={readonly || uploading}
              />
              {draft.documentUrls && draft.documentUrls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {draft.documentUrls.map((doc: any, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded text-xs">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <a href={typeof doc === 'string' ? doc : doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {typeof doc === 'object' && doc.name ? doc.name : `Document ${i + 1}`}
                      </a>
                    </div>
                  ))}
                </div>
              )}
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
