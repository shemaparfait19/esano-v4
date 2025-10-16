"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FamilyMember, FamilyEdge } from "@/types/family-tree";

type TreeResponse = {
  tree: {
    ownerId: string;
    members: FamilyMember[];
    edges: FamilyEdge[];
  };
};

export default function MemberProfilePage({
  params,
}: {
  params: { memberId: string };
}) {
  const search = useSearchParams();
  const ownerId = search?.get("ownerId") || "";
  const memberId = params.memberId;

  const [member, setMember] = useState<FamilyMember | null>(null);
  const [edges, setEdges] = useState<FamilyEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ownerId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/family-tree?userId=${ownerId}`);
        const data = (await res.json()) as TreeResponse;
        if (!res.ok) throw new Error((data as any)?.error || "Failed to load");
        if (ignore) return;
        const allMembers = (data.tree.members || []) as FamilyMember[];
        const found = allMembers.find((m: any) => m.id === memberId) || null;
        setMember(found);
        setAllMembers(allMembers);
        setEdges((data.tree.edges || []) as any);
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [ownerId, memberId]);

  const parents = useMemo(() => {
    if (!member) return [] as string[];
    const ids = edges
      .filter((e) => e.type === "parent" && e.toId === member.id)
      .map((e) => e.fromId);
    return Array.from(new Set(ids));
  }, [edges, member]);

  const children = useMemo(() => {
    if (!member) return [] as string[];
    const ids = edges
      .filter((e) => e.type === "parent" && e.fromId === member.id)
      .map((e) => e.toId);
    return Array.from(new Set(ids));
  }, [edges, member]);

  const spouses = useMemo(() => {
    if (!member) return [] as string[];
    const ids = edges
      .filter(
        (e) =>
          e.type === "spouse" &&
          (e.fromId === member.id || e.toId === member.id)
      )
      .map((e) => (e.fromId === member.id ? e.toId : e.fromId));
    return Array.from(new Set(ids));
  }, [edges, member]);

  // Create a map of member IDs to names
  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allMembers.forEach((m) => {
      map.set(m.id, m.fullName || m.firstName || m.id);
    });
    return map;
  }, [allMembers]);

  // helper to map id to display name
  const toName = (id: string) => memberNameMap.get(id) || id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading profile…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-4">{error}</Card>
      </div>
    );
  }
  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-4">Member not found.</Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              alt={member.fullName}
              src={
                member.avatarUrl ||
                `https://picsum.photos/seed/${member.id}/96/96`
              }
              className="h-16 w-16 rounded-full object-cover border"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">
                {member.fullName}
              </h1>
              <div className="text-sm text-muted-foreground">
                Generation {member.generation ?? "—"} · {member.gender || "—"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => history.back()}>
              Back
            </Button>
          </div>
        </div>

        {/* Key facts */}
        <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Date of birth</div>
            <div className="text-sm">{member.birthDate || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date of death</div>
            <div className="text-sm">
              {member.deathDate || (member.isDeceased ? "Deceased" : "—")}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              Birthplace / Residence
            </div>
            <div className="text-sm">{member.location || "—"}</div>
          </div>
        </Card>

        {/* Relationships */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Relationships</div>
          <div className="text-sm text-muted-foreground">
            <div>
              Spouse: {spouses.length ? spouses.map(toName).join(", ") : "—"}
            </div>
            <div>
              Parents: {parents.length ? parents.map(toName).join(", ") : "—"}
            </div>
            <div>
              Children:{" "}
              {children.length ? children.map(toName).join(", ") : "—"}
            </div>
          </div>
        </Card>

        {/* Biography */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Biography & Notes</div>
          <div className="prose max-w-none text-sm whitespace-pre-wrap">
            {member.notes || "No biography yet."}
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Timeline</div>
          {Array.isArray(member.timeline) && member.timeline.length ? (
            <ul className="space-y-2">
              {member.timeline
                .slice()
                .sort((a: any, b: any) => a.date.localeCompare(b.date))
                .map((t: any) => (
                  <li key={t.id} className="text-sm">
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString()} · {t.type}
                    </div>
                    {t.title && <div className="font-medium">{t.title}</div>}
                    {t.description && <div>{t.description}</div>}
                    {t.url &&
                      (t.type === "video" ? (
                        <video
                          src={t.url}
                          className="mt-2 w-full max-w-md rounded border"
                          controls
                        />
                      ) : t.type === "audio" ? (
                        <audio src={t.url} className="mt-2 w-full" controls />
                      ) : (
                        <img
                          src={t.url}
                          alt={t.title || "timeline"}
                          className="mt-2 w-full max-w-md rounded border object-cover"
                        />
                      ))}
                  </li>
                ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">
              No timeline entries yet.
            </div>
          )}
        </Card>

        {/* Media gallery */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Gallery</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(member.mediaUrls || []).map((u, i) => (
              <img
                key={i}
                src={u}
                alt="media"
                className="w-full h-32 object-cover rounded border"
              />
            ))}
          </div>
          {(!member.mediaUrls || member.mediaUrls.length === 0) && (
            <div className="text-sm text-muted-foreground">
              No media uploaded yet.
            </div>
          )}
        </Card>

        {/* Voice memories */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Voice memories</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(member.voiceUrls || []).map((u, i) => (
              <audio key={i} src={u} controls className="w-full" />
            ))}
          </div>
          {(!member.voiceUrls || member.voiceUrls.length === 0) && (
            <div className="text-sm text-muted-foreground">
              No voice memories yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
