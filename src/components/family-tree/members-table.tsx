"use client";

import React, { useMemo } from "react";
import type { FamilyMember, FamilyEdge } from "@/types/family-tree";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Sparkles } from "lucide-react";

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

  const groupedByGeneration = useMemo(() => {
    const groups: Record<number, FamilyMember[]> = {};
    sorted.forEach((m) => {
      const gen = m.generation ?? 0;
      if (!groups[gen]) groups[gen] = [];
      groups[gen].push(m);
    });
    return groups;
  }, [sorted]);

  const generations = Object.keys(groupedByGeneration)
    .map(Number)
    .sort((a, b) => a - b);

  const getGenderBadgeColor = (gender?: string) => {
    if (!gender) return "bg-gray-100 text-gray-600";
    if (gender.toLowerCase() === "male") return "bg-blue-100 text-blue-700";
    if (gender.toLowerCase() === "female") return "bg-pink-100 text-pink-700";
    return "bg-purple-100 text-purple-700";
  };

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Family Members</h2>
              <p className="text-sm text-white/80 mt-1">
                {members.length} members across {generations.length} generations
              </p>
            </div>
          </div>
          {onAiSuggest && (
            <Button
              size="lg"
              variant="secondary"
              onClick={onAiSuggest}
              className="bg-white/90 hover:bg-white text-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Suggestions
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          {generations.map((gen, genIndex) => (
            <div key={gen} className="relative">
              {genIndex > 0 && (
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      GENERATION TRANSITION
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-4 sticky left-0">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {gen}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Generation {gen}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {groupedByGeneration[gen].length} member
                      {groupedByGeneration[gen].length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
                  <tr className="text-left border-b-2 border-indigo-200">
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Full Name
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Spouse
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Parents
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Children
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Gender
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Birth
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Death
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Location
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Tags
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Relation Summary
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByGeneration[gen].map((m, idx) => (
                    <tr
                      key={m.id}
                      className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-200 ${
                        idx % 2 === 0 ? "bg-white/50" : "bg-gray-50/30"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {m.isHeadOfFamily && (
                            <span
                              className="text-yellow-500 text-lg"
                              title="Head of Family"
                            >
                              👑
                            </span>
                          )}
                          <span className="font-semibold text-gray-900">
                            {m.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700">
                          {(spouseOf[m.id] || [])
                            .map((id) => byId[id]?.firstName || id)
                            .join(", ") || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700">
                          {(parentsOf[m.id] || [])
                            .map((id) => byId[id]?.firstName || id)
                            .join(", ") || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700">
                          {(childrenOf[m.id] || [])
                            .map((id) => byId[id]?.firstName || id)
                            .join(", ") || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {m.gender ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getGenderBadgeColor(
                              m.gender
                            )}`}
                          >
                            {m.gender}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {m.birthDate || "—"}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {m.deathDate || (m.isDeceased ? "Yes" : "—")}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {m.location || "—"}
                      </td>
                      <td className="py-4 px-4">
                        {Array.isArray(m.tags) && m.tags.length ? (
                          <div className="flex flex-wrap gap-1">
                            {m.tags.slice(0, 2).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {m.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{m.tags.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 max-w-[300px]">
                        <div className="text-xs text-gray-600 line-clamp-2">
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
                            return parts.join(" · ") || m.notes || "—";
                          })()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {m.isHeadOfFamily && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full text-xs font-bold shadow-md">
                            HEAD
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {onOpen && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onOpen(m.id)}
                            className="hover:bg-indigo-100 hover:text-indigo-700 font-medium transition-all"
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
          ))}
        </div>
      </div>
    </Card>
  );
}
