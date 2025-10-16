"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SharedTreeCard } from "@/components/family-tree/shared-tree-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Clock } from "lucide-react";

type ShareItem = {
  id: string;
  ownerId: string;
  role: "viewer" | "editor";
  targetUserId: string;
  targetEmail: string;
};

export default function SharedTreesPage() {
  const { user } = useAuth();
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});
  const [treeSizes, setTreeSizes] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "viewer" | "editor">("all");

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const res = await fetch(
          `/api/family-tree/share?sharedWithMe=1&userId=${user.uid}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load shares");
        const list = (data.shares || []) as ShareItem[];
        if (!ignore) setShares(list);
        // Load owner names and tree sizes
        const nameEntries: [string, string][] = [];
        const sizeEntries: [string, number][] = [];
        for (const s of list) {
          try {
            const snap = await getDoc(doc(db, "users", s.ownerId));
            const ud = snap.exists() ? (snap.data() as any) : null;
            const nm =
              ud?.fullName || ud?.preferredName || ud?.firstName || s.ownerId;
            nameEntries.push([s.ownerId, nm]);
            
            // Try to get tree size
            const treeRes = await fetch(`/api/family-tree?userId=${s.ownerId}`);
            if (treeRes.ok) {
              const treeData = await treeRes.json();
              const memberCount = treeData.tree?.members?.length || 0;
              sizeEntries.push([s.ownerId, memberCount]);
            }
          } catch {}
        }
        if (!ignore) {
          setOwnerNames(Object.fromEntries(nameEntries));
          setTreeSizes(Object.fromEntries(sizeEntries));
        }
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
  }, [user?.uid]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading shared trees...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>;
  }

  const filteredShares = shares.filter((s) => {
    const matchesSearch = ownerNames[s.ownerId]
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const editorCount = shares.filter(s => s.role === "editor").length;
  const viewerCount = shares.filter(s => s.role === "viewer").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shared Family Trees</h1>
            <p className="text-muted-foreground mt-1">
              Trees that others have shared with you
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">{shares.length} Trees</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by owner name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filterRole} onValueChange={(v) => setFilterRole(v as any)} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All ({shares.length})</TabsTrigger>
                <TabsTrigger value="editor">Editor ({editorCount})</TabsTrigger>
                <TabsTrigger value="viewer">Viewer ({viewerCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Empty State */}
        {shares.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No shared trees yet</h3>
            <p className="text-muted-foreground">
              When someone shares their family tree with you, it will appear here.
            </p>
          </div>
        )}

        {/* Tree Grid */}
        {filteredShares.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShares.map((s) => (
              <SharedTreeCard
                key={s.id}
                share={{
                  id: s.id,
                  ownerId: s.ownerId,
                  ownerName: ownerNames[s.ownerId] || s.ownerId,
                  role: s.role,
                  createdAt: (s as any).createdAt || new Date().toISOString(),
                  lastViewedAt: (s as any).lastViewedAt,
                  memberCount: treeSizes[s.ownerId],
                  lastUpdated: (s as any).updatedAt,
                }}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredShares.length === 0 && shares.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trees found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
