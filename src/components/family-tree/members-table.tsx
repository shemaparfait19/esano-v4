"use client";

import React, { useMemo, useState } from "react";
import type { FamilyMember, FamilyEdge } from "@/types/family-tree";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
  Edit,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { RelationshipInferenceEngine } from "@/lib/relationship-inference-engine";

interface MembersTableProps {
  members: FamilyMember[];
  edges?: FamilyEdge[];
  onOpen?: (memberId: string) => void;
  onView?: (memberId: string) => void;
  onAiSuggest?: () => void;
  onAddMember?: (generation: number) => void;
  ownerId?: string;
}

export function MembersTable({
  members,
  edges = [],
  onOpen,
  onView,
  onAiSuggest,
  onAddMember,
  ownerId,
}: MembersTableProps) {
  const [expandedGen, setExpandedGen] = useState<Record<number, boolean>>({});

  // Infer generations from parent edges if missing
  const inferredGen = useMemo(() => {
    const parents: Record<string, string[]> = {};
    const children: Record<string, string[]> = {};
    edges.forEach((e) => {
      if (e.type === "parent") {
        (parents[e.toId] = parents[e.toId] || []).push(e.fromId);
        (children[e.fromId] = children[e.fromId] || []).push(e.toId);
      }
    });
    const rootIds = members
      .map((m) => m.id)
      .filter((id) => !(parents[id] && parents[id].length));
    const genMap: Record<string, number> = {};
    const queue: Array<{ id: string; gen: number }> = rootIds.map((id) => ({
      id,
      gen: 0,
    }));
    while (queue.length) {
      const { id, gen } = queue.shift()!;
      if (genMap[id] !== undefined && genMap[id] <= gen) continue;
      genMap[id] = gen;
      (children[id] || []).forEach((cid) =>
        queue.push({ id: cid, gen: gen + 1 })
      );
    }
    return genMap;
  }, [members, edges]);

  const sorted = useMemo(() => {
    const list = members
      .map((m) => ({
        ...m,
        generation: m.generation ?? inferredGen[m.id] ?? 0,
      }))
      .sort((a, b) => (a.generation ?? 0) - (b.generation ?? 0));
    return list;
  }, [members, inferredGen]);

  const byId = useMemo(() => {
    const map = Object.fromEntries(members.map((m) => [m.id, m]));
    return map;
  }, [members]);

  // Initialize the relationship inference engine
  const relationshipEngine = useMemo(() => {
    if (members.length === 0) return null;
    console.log('🔄 Initializing Relationship Inference Engine...');
    const engine = new RelationshipInferenceEngine(members, edges);
    console.log('✅ Relationship Engine Ready');
    return engine;
  }, [members, edges]);

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
      if (e.type === "parent") {
        (map[e.fromId] = map[e.fromId] || []).push(e.toId);
      }
    });
    // Debug: Log children relationships
    console.log('childrenOf map:', map);
    console.log('Edges:', edges);
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

  // Siblings via explicit sibling types
  const siblingsOf = useMemo(() => {
    const map: Record<string, string[]> = {};
    const siblingTypes = new Set([
      "big_brother",
      "little_brother",
      "big_sister",
      "little_sister",
      "sibling",
    ]);
    edges.forEach((e) => {
      if (siblingTypes.has(e.type as any)) {
        (map[e.fromId] = map[e.fromId] || []).push(e.toId);
        (map[e.toId] = map[e.toId] || []).push(e.fromId);
      }
    });
    return map;
  }, [edges]);

  // Other relatives (aunt, uncle, cousin, guardian, etc.)
  const otherRelativesOf = useMemo(() => {
    const map: Record<string, Array<{ id: string; type: string }>> = {};
    const otherTypes = new Set([
      "aunt",
      "uncle",
      "cousin_big",
      "cousin_little",
      "guardian",
      "other",
    ]);
    edges.forEach((e) => {
      if (otherTypes.has(e.type as any)) {
        (map[e.fromId] = map[e.fromId] || []).push({
          id: e.toId,
          type: e.type,
        });
        (map[e.toId] = map[e.toId] || []).push({
          id: e.fromId,
          type: e.type,
        });
      }
    });
    return map;
  }, [edges]);

  const groupedByGeneration = useMemo(() => {
    const groups: Record<number, FamilyMember[]> = {};
    (sorted as any[]).forEach((m) => {
      const gen = (m.generation as number) ?? 0;
      if (!groups[gen]) groups[gen] = [];
      groups[gen].push(m);
    });
    return groups;
  }, [sorted]);

  const generations = Object.keys(groupedByGeneration)
    .map(Number)
    .sort((a, b) => a - b);

  const toggleGeneration = (gen: number) => {
    setExpandedGen((prev) => ({ ...prev, [gen]: !prev[gen] }));
  };

  const getGenderBadge = (gender?: string) => {
    if (!gender) return { color: "bg-gray-100 text-gray-600", text: "N/A" };
    const g = gender.toLowerCase();
    if (g === "male") return { color: "bg-blue-100 text-blue-700", text: "M" };
    if (g === "female")
      return { color: "bg-pink-100 text-pink-700", text: "F" };
    return {
      color: "bg-purple-100 text-purple-700",
      text: gender.charAt(0).toUpperCase(),
    };
  };

  const handleViewClick = (memberId: string) => {
    if (onView) {
      onView(memberId);
    } else if (ownerId) {
      window.location.href = `/ancestry/member/${memberId}?ownerId=${ownerId}`;
    }
  };

  const handleAddMember = (generation: number) => {
    if (onAddMember) {
      onAddMember(generation);
    }
  };

  // Check if member has any relationships
  const hasRelationships = (memberId: string) => {
    return (
      (spouseOf[memberId]?.length ?? 0) > 0 ||
      (parentsOf[memberId]?.length ?? 0) > 0 ||
      (childrenOf[memberId]?.length ?? 0) > 0 ||
      (siblingsOf[memberId]?.length ?? 0) > 0 ||
      (otherRelativesOf[memberId]?.length ?? 0) > 0
    );
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Family Members
              </h2>
              <p className="text-xs md:text-sm text-white/90 mt-0.5">
                {members.length} members · {generations.length} generations
              </p>
            </div>
          </div>
          {onAiSuggest && (
            <button
              onClick={onAiSuggest}
              className="flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-emerald-700 font-semibold px-4 py-2 md:px-6 md:py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Suggestions</span>
              <span className="sm:hidden">AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        {generations.map((gen, genIndex) => (
          <div key={gen} className="border-b border-gray-200">
            {/* Generation Header */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-6 py-4 sticky left-0 border-b border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                    {gen}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900">
                      Generation {gen}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {groupedByGeneration[gen].length} member
                      {groupedByGeneration[gen].length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {onAddMember && (
                  <button
                    onClick={() => handleAddMember(gen)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-emerald-100 to-teal-100 sticky top-0 z-10">
                <tr className="text-left">
                  <th className="py-3 px-4 font-semibold text-emerald-900">
                    Name
                  </th>
                  <th className="py-3 px-4 font-semibold text-emerald-900">
                    Relations
                  </th>
                  <th className="py-3 px-4 font-semibold text-emerald-900">
                    Gender
                  </th>
                  <th className="py-3 px-4 font-semibold text-emerald-900">
                    Birth
                  </th>
                  <th className="py-3 px-4 font-semibold text-emerald-900">
                    Location
                  </th>
                  <th className="py-3 px-4 font-semibold text-emerald-900">
                    Tags
                  </th>
                  <th className="py-3 px-4 font-semibold text-emerald-900 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedByGeneration[gen].map((m, idx) => (
                  <tr
                    key={m.id}
                    className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {m.isHeadOfFamily && (
                          <span className="text-lg" title="Head of Family">
                            👑
                          </span>
                        )}
                        <div>
                          <button
                            onClick={() => handleViewClick(m.id)}
                            className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline text-left"
                          >
                            {m.fullName}
                          </button>
                          {m.isHeadOfFamily && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                              HEAD
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs text-gray-700 space-y-1">
                        {relationshipEngine ? (
                          <>
                            {(() => {
                              const allRels = relationshipEngine.getAllRelationshipsFor(m.id);
                              
                              // Group by relationship type
                              const grouped = allRels.reduce((acc, rel) => {
                                if (!acc[rel.type]) acc[rel.type] = [];
                                acc[rel.type].push(rel);
                                return acc;
                              }, {} as Record<string, typeof allRels>);

                              const displayOrder = [
                                'spouse', 'parent', 'child', 'sibling', 'half-sibling',
                                'grandparent', 'grandchild', 'great-grandparent', 'great-grandchild',
                                'aunt', 'uncle', 'niece', 'nephew', 'cousin'
                              ];

                              return displayOrder.map(type => {
                                const rels = grouped[type];
                                if (!rels || rels.length === 0) return null;

                                const label = type.split('-').map(w => 
                                  w.charAt(0).toUpperCase() + w.slice(1)
                                ).join(' ') + (rels.length > 1 ? 's' : '');

                                return (
                                  <div key={type}>
                                    <span className="font-semibold text-gray-600">
                                      {label}:
                                    </span>{" "}
                                    {rels.map(rel => {
                                      const member = byId[rel.toId];
                                      return member?.fullName || member?.firstName || 'Unknown';
                                    }).join(", ")}
                                  </div>
                                );
                              }).filter(Boolean);
                            })()}
                            {relationshipEngine.getAllRelationshipsFor(m.id).length === 0 && (
                              <div className="text-gray-400 italic">No relations</div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-400 italic">Loading relationships...</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {m.gender ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            getGenderBadge(m.gender).color
                          }`}
                        >
                          {getGenderBadge(m.gender).text}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {m.birthDate || "—"}
                      {m.deathDate && (
                        <div className="text-xs text-gray-500">
                          † {m.deathDate}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {m.location || "—"}
                    </td>
                    <td className="py-4 px-4">
                      {m.tags && m.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
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
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewClick(m.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-md text-xs font-medium transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        {onOpen && (
                          <button
                            onClick={() => onOpen(m.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-xs font-medium transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {generations.map((gen) => (
          <div key={gen} className="border-b border-gray-200">
            {/* Generation Header - Collapsible */}
            <button
              onClick={() => toggleGeneration(gen)}
              className="w-full bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {gen}
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-emerald-900">
                    Generation {gen}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {groupedByGeneration[gen].length} member
                    {groupedByGeneration[gen].length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {expandedGen[gen] ? (
                <ChevronDown className="w-5 h-5 text-emerald-700" />
              ) : (
                <ChevronRight className="w-5 h-5 text-emerald-700" />
              )}
            </button>

            {/* Add Member Button (Mobile) */}
            {onAddMember && expandedGen[gen] && (
              <div className="px-4 py-3 bg-emerald-50/50 border-b border-emerald-200">
                <button
                  onClick={() => handleAddMember(gen)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member to Generation {gen}
                </button>
              </div>
            )}

            {/* Member Cards */}
            {expandedGen[gen] && (
              <div className="divide-y divide-gray-200">
                {groupedByGeneration[gen].map((m) => (
                  <div
                    key={m.id}
                    className="p-4 bg-white hover:bg-emerald-50/30 transition-colors"
                  >
                    {/* Name and Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <button
                          onClick={() => handleViewClick(m.id)}
                          className="font-bold text-base text-emerald-700 hover:text-emerald-900 hover:underline text-left"
                        >
                          {m.isHeadOfFamily && <span className="mr-1">👑</span>}
                          {m.fullName}
                        </button>
                        {m.isHeadOfFamily && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                            HEAD OF FAMILY
                          </span>
                        )}
                      </div>
                      {m.gender && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            getGenderBadge(m.gender).color
                          }`}
                        >
                          {getGenderBadge(m.gender).text}
                        </span>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-2 text-sm mb-3">
                      {m.birthDate && (
                        <div className="flex">
                          <span className="text-gray-500 w-20">Born:</span>
                          <span className="text-gray-900 font-medium">
                            {m.birthDate}
                          </span>
                        </div>
                      )}
                      {m.deathDate && (
                        <div className="flex">
                          <span className="text-gray-500 w-20">Died:</span>
                          <span className="text-gray-900 font-medium">
                            {m.deathDate}
                          </span>
                        </div>
                      )}
                      {m.location && (
                        <div className="flex">
                          <span className="text-gray-500 w-20">Location:</span>
                          <span className="text-gray-900 font-medium">
                            {m.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Relations */}
                    {relationshipEngine ? (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs space-y-2">
                        {(() => {
                          const allRels = relationshipEngine.getAllRelationshipsFor(m.id);
                          
                          if (allRels.length === 0) {
                            return (
                              <span className="text-gray-400 italic">No relations</span>
                            );
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
                            'aunt', 'uncle', 'niece', 'nephew', 'cousin'
                          ];

                          return displayOrder.map(type => {
                            const rels = grouped[type];
                            if (!rels || rels.length === 0) return null;

                            const label = type.split('-').map(w => 
                              w.charAt(0).toUpperCase() + w.slice(1)
                            ).join(' ') + (rels.length > 1 ? 's' : '');

                            return (
                              <div key={type}>
                                <span className="text-gray-600 font-semibold">
                                  {label}:
                                </span>{" "}
                                <span className="text-gray-900 font-medium">
                                  {rels.map(rel => {
                                    const member = byId[rel.toId];
                                    return member?.fullName || member?.firstName || 'Unknown';
                                  }).join(", ")}
                                </span>
                              </div>
                            );
                          }).filter(Boolean);
                        })()}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs">
                        <span className="text-gray-400 italic">
                          Loading relationships...
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {m.tags && m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {m.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewClick(m.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      {onOpen && (
                        <button
                          onClick={() => onOpen(m.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}