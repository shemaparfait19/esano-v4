"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FamilyMember } from "@/types/family-tree";
import { Trash2, Plus, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Subfamily = {
  id: string;
  name: string;
  description?: string;
  headMemberId?: string;
  memberIds: string[];
  parentFamilyId: string;
  createdAt: string;
  updatedAt: string;
};

interface SubfamilyManagerProps {
  ownerId: string;
  members: FamilyMember[];
  readonly?: boolean;
}

export function SubfamilyManager({
  ownerId,
  members,
  readonly,
}: SubfamilyManagerProps) {
  const [items, setItems] = useState<Subfamily[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [headId, setHeadId] = useState<string | undefined>(undefined);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const memberById = useMemo(() => {
    const map: Record<string, FamilyMember> = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/family-tree/subfamilies?ownerId=${ownerId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      toast({
        title: "Failed to load subfamilies",
        description: e?.message || "",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ownerId) load();
  }, [ownerId]);

  async function createSubfamily() {
    try {
      const res = await fetch(`/api/family-tree/subfamilies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          name,
          description,
          headMemberId: headId,
          memberIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Subfamily created" });
      setOpen(false);
      setName("");
      setDescription("");
      setHeadId(undefined);
      setMemberIds([]);
      load();
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  }

  async function deleteSubfamily(id: string) {
    if (!confirm("Delete this subfamily?")) return;
    try {
      const res = await fetch(
        `/api/family-tree/subfamilies/${id}?ownerId=${ownerId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");
      toast({ title: "Subfamily deleted" });
      load();
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  }

  function toggleMember(id: string) {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <h3 className="text-sm font-medium">Subfamilies</h3>
        </div>
        {!readonly && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((s) => (
          <Card key={s.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">
                Head:{" "}
                {s.headMemberId
                  ? memberById[s.headMemberId]?.fullName || s.headMemberId
                  : "—"}
              </div>
              {!!s.memberIds?.length && (
                <div className="text-xs text-muted-foreground mt-1">
                  Members:{" "}
                  {s.memberIds
                    .map((id) => memberById[id]?.firstName || id)
                    .join(", ")}
                </div>
              )}
            </div>
            {!readonly && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSubfamily(s.id)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </Card>
        ))}
        {!loading && items.length === 0 && (
          <Card className="p-3 text-xs text-muted-foreground">
            No subfamilies yet.
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create subfamily</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John & Mary's Line"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-1">
              <Label>Head of subfamily</Label>
              <Select
                value={headId || ""}
                onValueChange={(v) => setHeadId(v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select head" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.fullName ||
                        `${m.firstName} ${m.lastName}`.trim() ||
                        m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Select members</Label>
              <div className="max-h-40 overflow-auto border rounded p-2 grid grid-cols-2 gap-1">
                {members.map((m) => {
                  const id = m.id;
                  const checked = memberIds.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleMember(id)}
                      className={`text-left text-xs rounded px-2 py-1 border ${
                        checked
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      title={m.fullName}
                    >
                      {m.fullName ||
                        `${m.firstName} ${m.lastName}`.trim() ||
                        id}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button disabled={!name.trim()} onClick={createSubfamily}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
