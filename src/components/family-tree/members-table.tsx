"use client";

import React, { useMemo } from "react";
import type { FamilyMember } from "@/types/family-tree";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MembersTableProps {
  members: FamilyMember[];
  onOpen?: (memberId: string) => void;
  onAiSuggest?: () => void;
}

export function MembersTable({
  members,
  onOpen,
  onAiSuggest,
}: MembersTableProps) {
  const sorted = useMemo(() => {
    const list = [...members];
    list.sort((a, b) => (a.generation ?? 0) - (b.generation ?? 0));
    return list;
  }, [members]);

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
      <div className="min-w-[900px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">Generation</th>
              <th className="py-2 pr-3">Full name</th>
              <th className="py-2 pr-3">Gender</th>
              <th className="py-2 pr-3">Birth</th>
              <th className="py-2 pr-3">Death</th>
              <th className="py-2 pr-3">Location</th>
              <th className="py-2 pr-3">Tags</th>
              <th className="py-2 pr-3">Notes</th>
              <th className="py-2 pr-3">Head?</th>
              <th className="py-2 pr-3">Open</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.id} className="border-b hover:bg-muted/40">
                <td className="py-2 pr-3">{m.generation ?? "—"}</td>
                <td className="py-2 pr-3">{m.fullName}</td>
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
                <td className="py-2 pr-3 max-w-[320px] truncate">
                  {m.notes || ""}
                </td>
                <td className="py-2 pr-3">{m.isHeadOfFamily ? "Head" : ""}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
