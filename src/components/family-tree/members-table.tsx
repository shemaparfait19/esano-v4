"use client";

import React, { useMemo } from "react";
import type { FamilyMember, FamilyEdge } from "@/types/family-tree";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MembersTableProps {
  members: FamilyMember[];
  edges?: FamilyEdge[];
  onOpen?: (memberId: string) => void;
  onAiSuggest?: () => void;
}

export function MembersTable({
  members,
  edges = [],
  onOpen,
  onAiSuggest,
}: MembersTableProps) {
  const sorted = useMemo(() => {
    const list = [...members];
    list.sort((a, b) => (a.generation ?? 0) - (b.generation ?? 0));
    return list;
  }, [members]);

  const byId = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members]
  );
  const parentsOf = useMemo(() => {
    const map: Record<string, string[]> = {};
    edges.forEach((e) => {
      if (e.type === "parent") (map[e.toId] = map[e.toId] || []).push(e.fromId);
    });
    return map;
  }, [edges]);
  const childrenOf = useMemo(() => {
    const map: Record<string, string[]> = {};
    edges.forEach((e) => {
      if (e.type === "parent")
        (map[e.fromId] = map[e.fromId] || []).push(e.toId);
    });
    return map;
  }, [edges]);
  const spouseOf = useMemo(() => {
    const map: Record<string, string[]> = {};
    edges.forEach((e) => {
      if (e.type === "spouse") {
        (map[e.fromId] = map[e.fromId] || []).push(e.toId);
        (map[e.toId] = map[e.toId] || []).push(e.fromId);
      }
    });
    return map;
  }, [edges]);

  return (
    <Card className="p-3 overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Family Members</div>
        {onAiSuggest && (
          <Button size="sm" variant="secondary" onClick={onAiSuggest}>
            AI Suggestions
          </Button>
        )}
      </div>
      <div className="min-w-[1100px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">Generation</th>
              <th className="py-2 pr-3">Full name</th>
              <th className="py-2 pr-3">Spouse</th>
              <th className="py-2 pr-3">Parents</th>
              <th className="py-2 pr-3">Children</th>
              <th className="py-2 pr-3">Gender</th>
              <th className="py-2 pr-3">Birth</th>
              <th className="py-2 pr-3">Death</th>
              <th className="py-2 pr-3">Location</th>
              <th className="py-2 pr-3">Tags</th>
              <th className="py-2 pr-3">Relation Summary</th>
              <th className="py-2 pr-3">Head?</th>
              <th className="py-2 pr-3">Open</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, idx) => (
              <React.Fragment key={`${m.id}-group`}>
                {(idx === 0 ||
                  (sorted[idx - 1].generation ?? 0) !==
                    (m.generation ?? 0)) && (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-1 text-xs text-muted-foreground bg-muted/40"
                    >
                      Generation {m.generation ?? 0}
                    </td>
                  </tr>
                )}
                <tr className="border-b hover:bg-muted/40">
                  <td className="py-2 pr-3">{m.generation ?? "—"}</td>
                  <td className="py-2 pr-3">{m.fullName}</td>
                  <td className="py-2 pr-3">
                    {(spouseOf[m.id] || [])
                      .map((id) => byId[id]?.firstName || id)
                      .join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {(parentsOf[m.id] || [])
                      .map((id) => byId[id]?.firstName || id)
                      .join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {(childrenOf[m.id] || [])
                      .map((id) => byId[id]?.firstName || id)
                      .join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-3">{m.gender || "—"}</td>
                  <td className="py-2 pr-3">{m.birthDate || "—"}</td>
                  <td className="py-2 pr-3">
                    {m.deathDate || (m.isDeceased ? "Yes" : "—")}
                  </td>
                  <td className="py-2 pr-3">{m.location || "—"}</td>
                  <td className="py-2 pr-3">
                    {Array.isArray(m.tags) && m.tags.length
                      ? m.tags.join(", ")
                      : "—"}
                  </td>
                  <td className="py-2 pr-3 max-w-[420px] truncate">
                    {(() => {
                      const spouses = (spouseOf[m.id] || [])
                        .map((id) => byId[id]?.firstName)
                        .filter(Boolean);
                      const parents = (parentsOf[m.id] || [])
                        .map((id) => byId[id]?.firstName)
                        .filter(Boolean);
                      const children = (childrenOf[m.id] || [])
                        .map((id) => byId[id]?.firstName)
                        .filter(Boolean);
                      const parts: string[] = [];
                      if (spouses.length)
                        parts.push(`Spouse of ${spouses.join(" & ")}`);
                      if (parents.length)
                        parts.push(`Child of ${parents.join(" & ")}`);
                      if (children.length)
                        parts.push(`Parent of ${children.join(" & ")}`);
                      return parts.join(" · ") || m.notes || "";
                    })()}
                  </td>
                  <td className="py-2 pr-3">
                    {m.isHeadOfFamily ? "Head" : ""}
                  </td>
                  <td className="py-2 pr-3">
                    {onOpen && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpen(m.id)}
                      >
                        Open
                      </Button>
                    )}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
