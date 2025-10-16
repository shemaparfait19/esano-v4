"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FamilyMember, FamilyEdge } from "@/types/family-tree";
import { RelationshipInferenceEngine } from "@/lib/relationship-inference-engine";

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

  // Initialize relationship inference engine
  const relationshipEngine = useMemo(() => {
    if (allMembers.length === 0 || !member) return null;
    return new RelationshipInferenceEngine(allMembers, edges);
  }, [allMembers, edges, member]);

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
            <div className="text-sm">
              {(() => {
                console.log('📍 Member location:', member.location, 'Type:', typeof member.location);
                if (member.location && typeof member.location === 'object' && !Array.isArray(member.location)) {
                  const loc = member.location as any;
                  if (loc.village || loc.district || loc.province) {
                    return `${loc.village || ''}, ${loc.cell || ''}, ${loc.sector || ''}, ${loc.district || ''}, ${loc.province || ''}`.replace(/(, )+/g, ', ').replace(/^, |, $/g, '');
                  }
                }
                return typeof member.location === 'string' ? member.location : "—";
              })()}
            </div>
          </div>
        </Card>

        {/* Relationships */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Relationships</div>
          {relationshipEngine ? (
            <div className="text-sm text-muted-foreground space-y-2">
              {(() => {
                const allRels = relationshipEngine.getAllRelationshipsFor(member.id);
                
                if (allRels.length === 0) {
                  return <div className="text-gray-400 italic">No relationships found</div>;
                }

                // Group by relationship type
                const grouped = allRels.reduce((acc, rel) => {
                  if (!acc[rel.type]) acc[rel.type] = [];
                  acc[rel.type].push(rel);
                  return acc;
                }, {} as Record<string, typeof allRels>);

                const displayOrder = [
                  'spouse', 'parent', 'child', 'sibling', 'half-sibling',
                  'grandparent', 'grandchild', 'great-grandparent', 'great-grandchild',
                  'aunt', 'uncle', 'niece', 'nephew', 'cousin', 'second-cousin'
                ];

                return displayOrder.map(type => {
                  const rels = grouped[type];
                  if (!rels || rels.length === 0) return null;

                  const label = type.split('-').map(w => 
                    w.charAt(0).toUpperCase() + w.slice(1)
                  ).join(' ') + (rels.length > 1 ? 's' : '');

                  const names = rels.map(rel => {
                    const relMember = allMembers.find(m => m.id === rel.toId);
                    return relMember?.fullName || relMember?.firstName || 'Unknown';
                  }).join(", ");

                  return (
                    <div key={type}>
                      <span className="font-semibold">{label}:</span> {names}
                    </div>
                  );
                }).filter(Boolean);
              })()}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Loading relationships...</div>
          )}
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

        {/* Documents */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Documents</div>
          <div className="space-y-2">
            {(member.documentUrls || []).map((doc: any, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border rounded">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <a 
                  href={typeof doc === 'string' ? doc : doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-blue-600 hover:underline"
                >
                  {typeof doc === 'object' && doc.name ? doc.name : `Document ${i + 1}`}
                </a>
              </div>
            ))}
          </div>
          {(!member.documentUrls || member.documentUrls.length === 0) && (
            <div className="text-sm text-muted-foreground">
              No documents uploaded yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
