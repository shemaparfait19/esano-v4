"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useFamilyTreeStore } from "@/lib/family-tree-store";
// import { TreeCanvas } from "@/components/family-tree/tree-canvas";
import { GenerationForm } from "@/components/family-tree/generation-form";
import { MembersTable } from "@/components/family-tree/members-table";
import { MemberDetailDrawer } from "@/components/family-tree/member-detail-drawer";
import { TreeToolbar } from "@/components/family-tree/tree-toolbar";
import { RelationshipsTable } from "@/components/family-tree/relationships-table";
import { AdvancedSearch } from "@/components/family-tree/advanced-search";
import { FamilyMember, FamilyEdge } from "@/types/family-tree";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Heart,
  Undo2,
  Redo2,
  Download,
  Maximize2,
  Sparkles,
  Search,
  Users,
  Globe,
  Edit,
  Eye,
  EyeOff,
  Save,
  Undo,
  Redo,
  Fullscreen,
  Minimize,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { FamilyTreeApplicationForm } from "@/components/family-tree/application-form";
import { FamilyTreeSuggestions } from "@/components/dashboard/family-tree-suggestions";
import { FamilyCodeGenerator } from "@/components/family-tree/family-code-generator";
import { GenerationManager } from "@/components/family-tree/generation-manager";
import { MemberView } from "@/components/family-tree/member-view";
import { cleanupOrphanedEdges } from "@/lib/cleanup-orphaned-edges";
import { FamilyTreeToolbar } from "@/components/family-tree/family-tree-toolbar";
import { AddMemberDialog } from "@/components/family-tree/add-member-dialog";
import { AddRelationshipDialog } from "@/components/family-tree/add-relationship-dialog";
import { ShareDialog } from "@/components/family-tree/share-dialog";
import { TreeSwitcher } from "@/components/family-tree/tree-switcher";

export default function FamilyTreePage() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ownerIdParam = searchParams?.get("ownerId") || undefined;
  const searchParam = searchParams?.get("search") || undefined;
  const {
    tree,
    members,
    edges,
    selectedNode,
    editingNode,
    isFullscreen,
    isLoading,
    isSaving,
    error,
    setTree,
    addMember,
    updateMember,
    addEdge,
    removeEdge,
    removeMember,
    setSelectedNode,
    setEditingNode,
    setFullscreen,
    setLoading,
    setSaving,
    setLastSavedAt,
    setError,
    dirty,
    setDirty,
    undo,
    redo,
  } = useFamilyTreeStore();

  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showAddRelationshipDialog, setShowAddRelationshipDialog] =
    useState(false);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({});
  const [newRelationship, setNewRelationship] = useState<Partial<FamilyEdge>>(
    {}
  );
  const [presence, setPresence] = useState<
    Array<{
      id: string;
      name?: string;
      color?: string;
      x?: number;
      y?: number;
      lastActive?: string;
    }>
  >([]);
  const [containerRect, setContainerRect] = useState<{
    left: number;
    top: number;
  }>({ left: 0, top: 0 });
  const [readonly, setReadonly] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"viewer" | "editor">("viewer");
  const [shares, setShares] = useState<any[]>([]);
  const [shareNames, setShareNames] = useState<Record<string, string>>({});
  const [ownerName, setOwnerName] = useState<string>("");
  const [mySharedTrees, setMySharedTrees] = useState<Array<{ ownerId: string; ownerName: string; role: "viewer" | "editor" }>>([]);
  const [viewerRole, setViewerRole] = useState<"viewer" | "editor" | null>(
    null
  );
  const [suggested, setSuggested] = useState<Array<any>>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [askText, setAskText] = useState("");
  const [askAnswer, setAskAnswer] = useState<string>("");
  const [joinQuery, setJoinQuery] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinResults, setJoinResults] = useState<Array<any>>([]);
  const [accessRequests, setAccessRequests] = useState<Array<any>>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<{
    hasApplication: boolean;
    status: "pending" | "approved" | "denied" | null;
    lastApplication: any;
  }>({
    hasApplication: false,
    status: null,
    lastApplication: null,
  });
  const [isEditMode, setIsEditMode] = useState(true);
  const [showViewResult, setShowViewResult] = useState(false);

  const [lastLoadTime, setLastLoadTime] = useState(0);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [lastPresenceWrite, setLastPresenceWrite] = useState<number>(0);

  // Get the member ID from the URL if we're viewing a specific member
  const viewMemberId = searchParams?.get('memberId') || undefined;
  
  // Load family tree on mount
  useEffect(() => {
    if (user?.uid) {
      loadFamilyTree();
    }
  }, [user?.uid, ownerIdParam]);

  // Check application status for users without family tree approval
  useEffect(() => {
    if (!user?.uid || ownerIdParam || userProfile?.familyTreeApproved) return;

    const checkApplicationStatus = async () => {
      try {
        const res = await fetch(
          `/api/family-tree/application?userId=${user.uid}`
        );
        const data = await res.json();

        if (res.ok && data.applications) {
          const applications = data.applications;
          const lastApplication = applications[0];

          setApplicationStatus({
            hasApplication: applications.length > 0,
            status: lastApplication?.status || null,
            lastApplication,
          });
        }
      } catch (error) {
        console.error("Failed to check application status:", error);
      }
    };

    checkApplicationStatus();
  }, [user?.uid, ownerIdParam, userProfile?.familyTreeApproved]);

  // Load shared trees for switcher
  useEffect(() => {
    if (!user?.uid) return;
    const loadSharedTrees = async () => {
      try {
        const res = await fetch(`/api/family-tree/share?sharedWithMe=1&userId=${user.uid}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.shares)) {
          const trees = await Promise.all(
            data.shares.map(async (s: any) => {
              try {
                const { getDoc, doc } = await import("firebase/firestore");
                const snap = await getDoc(doc(db, "users", s.ownerId));
                const ud = snap.exists() ? (snap.data() as any) : null;
                const name = ud?.fullName || ud?.preferredName || ud?.firstName || s.ownerId;
                return { ownerId: s.ownerId, ownerName: name, role: s.role };
              } catch {
                return { ownerId: s.ownerId, ownerName: s.ownerId, role: s.role };
              }
            })
          );
          setMySharedTrees(trees);
        }
      } catch (err) {
        console.error("Failed to load shared trees:", err);
      }
    };
    loadSharedTrees();
  }, [user?.uid]);

  // Load access requests
  useEffect(() => {
    if (!user?.uid || ownerIdParam) return;

    const loadAccessRequests = async () => {
      try {
        setRequestsLoading(true);
        const res = await fetch(
          `/api/family-tree/access-request?ownerId=${user.uid}`
        );
        const d = await res.json();
        if (res.ok && Array.isArray(d.items)) {
          setAccessRequests(d.items);
        } else {
          console.warn("Invalid access requests response:", d);
          setAccessRequests([]);
        }
      } catch (err) {
        console.error("Failed to load access requests:", err);
        setAccessRequests([]);
      } finally {
        setRequestsLoading(false);
      }
    };

    loadAccessRequests();
  }, [user?.uid, ownerIdParam]);

  // Live search for Join Existing Tree
  useEffect(() => {
    const q = joinQuery.trim();
    if (q.length < 2) {
      setJoinResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setJoinLoading(true);
        const res = await fetch(
          `/api/family-tree/search?q=${encodeURIComponent(q)}&limit=12`
        );
        const d = await res.json();
        if (res.ok) setJoinResults(d.items || []);
      } catch {
      } finally {
        setJoinLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [joinQuery]);

  // Suggestion logic
  useEffect(() => {
    if (
      !newRelationship.fromId ||
      !newRelationship.toId ||
      !newRelationship.type
    ) {
      setSuggestion(null);
      return;
    }
    if (newRelationship.type === "parent") {
      const parentId = newRelationship.fromId;
      const childId = newRelationship.toId;
      const hasOtherParent = edges.some(
        (e) =>
          e.type === "parent" && e.toId === childId && e.fromId !== parentId
      );
      if (!hasOtherParent) {
        const possibleSpouses = edges
          .filter(
            (e) =>
              e.type === "spouse" &&
              (e.fromId === parentId || e.toId === parentId)
          )
          .map((e) => (e.fromId === parentId ? e.toId : e.fromId));
        if (possibleSpouses.length > 0) {
          const name =
            members.find((m) => m.id === possibleSpouses[0])?.fullName ||
            "their spouse";
          setSuggestion(`Also add ${name} as a parent of this child?`);
          return;
        }
      }
    }
    setSuggestion(null);
  }, [newRelationship, edges, members]);

  // Highlight path
  useEffect(() => {
    if (!selectedNode) {
      useFamilyTreeStore
        .getState()
        .setRenderOptions({ highlightPath: undefined });
      return;
    }
    const visited = new Set<string>();
    const stack = [selectedNode];
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      edges
        .filter((e) => e.type === "parent" && e.fromId === cur)
        .forEach((e) => stack.push(e.toId));
    }
    const up = [selectedNode];
    while (up.length) {
      const cur = up.pop()!;
      edges
        .filter((e) => e.type === "parent" && e.toId === cur)
        .forEach((e) => {
          if (!visited.has(e.fromId)) {
            visited.add(e.fromId);
            up.push(e.fromId);
          }
        });
    }
    useFamilyTreeStore
      .getState()
      .setRenderOptions({ highlightPath: Array.from(visited) });
  }, [selectedNode, edges]);

  // Container rect
  useEffect(() => {
    const treeOwner = ownerIdParam || user?.uid;
    if (!user?.uid || !treeOwner) return;
    const viewport = document.getElementById("tree-viewport");
    const updateRect = () => {
      const r = viewport?.getBoundingClientRect();
      if (r) setContainerRect({ left: r.left, top: r.top });
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [user?.uid]);

  // Presence
  useEffect(() => {
    const treeOwner = ownerIdParam || user?.uid;
    if (!user?.uid || !treeOwner) return;
    try {
      const presCol = collection(db, "familyTrees", treeOwner, "presence");
      const unsub = onSnapshot(
        presCol,
        (snap) => {
          const items = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((p) => p.id !== user.uid);
          setPresence(items);
        },
        (err) => {
          console.warn("presence onSnapshot error", err?.code || err?.message);
        }
      );
      return () => unsub();
    } catch (e) {}
  }, [user?.uid, ownerIdParam]);

  // Auto-save
  useEffect(() => {
    if (!dirty || readonly) return;
    const t = setTimeout(() => {
      saveFamilyTree();
    }, 800);
    return () => clearTimeout(t);
  }, [dirty, readonly]);

  // Save on tab/window close if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty && !readonly) {
        // Attempt a last save without blocking the unload
        saveFamilyTree();
        // Optionally show confirmation dialog in some browsers
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty, readonly]);

  const loadFamilyTree = async () => {
    const now = Date.now();
    if (now - lastLoadTime < 5000) {
      console.log("Skipping loadFamilyTree - too soon");
      return;
    }
    setLastLoadTime(now);

    try {
      setLoading(true);
      setError(null);
      const ownerId = ownerIdParam || user?.uid;
      if (!ownerId) return;

      if (ownerIdParam && ownerIdParam !== user?.uid) {
        const shareRes = await fetch(
          `/api/family-tree/share?sharedWithMe=1&userId=${user?.uid}`
        );
        const shareData = await shareRes.json();
        if (!shareRes.ok) {
          throw new Error(shareData.error || "Failed to verify share access");
        }
        const share = (shareData.shares || []).find(
          (s: any) => s.ownerId === ownerIdParam
        );
        if (!share) {
          throw new Error("You do not have access to this family tree");
        }
        setReadonly(share.role !== "editor");
        setViewerRole(share.role);
        try {
          const { getDoc, doc } = await import("firebase/firestore");
          const snap = await getDoc(doc(db, "users", ownerIdParam));
          const ud = snap.exists() ? (snap.data() as any) : null;
          setOwnerName(
            ud?.fullName || ud?.preferredName || ud?.firstName || ownerIdParam
          );
        } catch {}
      } else {
        setReadonly(false);
        setViewerRole(null);
        setOwnerName("");
      }

      const response = await fetch(`/api/family-tree?userId=${ownerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load family tree");
      }

      // Clean up orphaned edges before setting the tree
      if (data.tree && data.tree.members && data.tree.edges) {
        console.log('📊 Before cleanup - Members:', data.tree.members.length, 'Edges:', data.tree.edges.length);
        
        const { cleanedEdges, removedCount, removedEdges } = cleanupOrphanedEdges(
          data.tree.members,
          data.tree.edges
        );

        if (removedCount > 0) {
          console.log(`🧹 Cleaned up ${removedCount} orphaned edges:`, removedEdges);
          data.tree.edges = cleanedEdges;
          
          // Auto-save the cleaned tree
          try {
            await fetch("/api/family-tree", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: ownerId, tree: data.tree }),
            });
            toast({
              title: "Tree cleaned",
              description: `Removed ${removedCount} broken relationship(s)`,
            });
          } catch (saveError) {
            console.error("Failed to save cleaned tree:", saveError);
          }
        }
        
        console.log('📊 After cleanup - Members:', data.tree.members.length, 'Edges:', data.tree.edges.length);
      }

      // Initialize tree with current user as first member if empty
      if (!ownerIdParam && data.tree.members.length === 0 && user) {
        try {
          const { getDoc, doc } = await import("firebase/firestore");
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.exists() ? (userDoc.data() as any) : null;
          
          const firstMember: FamilyMember = {
            id: `member_${Date.now()}`,
            fullName: userData?.fullName || userData?.displayName || user.displayName || "Me",
            firstName: userData?.firstName || user.displayName?.split(' ')[0] || "Me",
            lastName: userData?.lastName || user.displayName?.split(' ').slice(1).join(' ') || "",
            gender: userData?.gender || "unknown",
            birthDate: userData?.birthDate || "",
            tags: ["me"],
            customFields: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          data.tree.members = [firstMember];
          
          // Auto-save the initialized tree
          await fetch("/api/family-tree", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.uid, tree: data.tree }),
          });
          
          toast({
            title: "Welcome to your family tree!",
            description: "We've added you as the first member. Start adding your family!",
          });
        } catch (err) {
          console.error("Failed to initialize tree with user:", err);
        }
      }

      setTree(data.tree);

      if (ownerIdParam && user?.uid) {
        try {
          await fetch("/api/notifications/mark-read-share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.uid, ownerId: ownerIdParam }),
          });
        } catch {}
      }

      if (!ownerIdParam && user?.uid) {
        try {
          const res = await fetch(`/api/family-tree/share?ownerId=${user.uid}`);
          const d = await res.json();
          if (res.ok) {
            setShares(d.shares || []);
            const loadNames = async () => {
              const entries: [string, string][] = [];
              for (const s of d.shares || []) {
                try {
                  const { getDoc, doc } = await import("firebase/firestore");
                  const snap = await getDoc(doc(db, "users", s.targetUserId));
                  const ud = snap.exists() ? (snap.data() as any) : null;
                  const name =
                    ud?.fullName ||
                    ud?.preferredName ||
                    ud?.firstName ||
                    s.targetEmail ||
                    s.targetUserId;
                  entries.push([s.targetUserId, name]);
                } catch {}
              }
              setShareNames(Object.fromEntries(entries));
            };
            loadNames();
          }
        } catch {}
      }

      if (!ownerIdParam) {
        try {
          setSuggestedLoading(true);
          const res = await fetch(`/api/family-tree/suggested?limit=12`);
          const d = await res.json();
          if (res.ok && Array.isArray(d.items)) {
            setSuggested(d.items);
          } else {
            console.warn("Invalid suggested trees response:", d);
            setSuggested([]);
          }
        } catch (err) {
          console.error("Failed to load suggested trees:", err);
          setSuggested([]);
        } finally {
          setSuggestedLoading(false);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load family tree";
      console.error('[Family Tree] Load error:', err);
      setError(errorMessage);
      setTree(null); // Clear tree to ensure error message displays
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFamilyTree = async () => {
    if (!user?.uid || !tree) return;
    if (readonly) return;

    try {
      setSaving(true);
      const targetOwner = ownerIdParam || user.uid;
      console.log('💾 saveFamilyTree called');
      console.log('📊 Tree members count:', tree.members.length);
      console.log('📦 Tree object being saved:', JSON.stringify(tree, null, 2));
      const response = await fetch("/api/family-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetOwner, tree }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save family tree");
      }

      setLastSavedAt(new Date().toISOString());
      setDirty(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save family tree";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = () => {
    if (readonly) {
      toast({ title: "View only", description: "You have view access only." });
      return;
    }
    setShowAddMemberDialog(true);
    setNewMember({
      firstName: "",
      lastName: "",
      gender: undefined,
      tags: [],
      customFields: {},
    });
  };

  const handleRequestAccess = async (
    targetOwnerId: string,
    access: "viewer" | "editor"
  ) => {
    if (!user?.uid) return;
    try {
      const res = await fetch("/api/family-tree/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: targetOwnerId,
          requesterId: user.uid,
          access,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({
        title: "Request sent",
        description: `Asked for ${access} access`,
      });
    } catch (e: any) {
      toast({
        title: "Request failed",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  };

  const handleSaveMember = () => {
    if (!newMember.firstName || !newMember.lastName) {
      toast({
        title: "Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }

    addMember({
      firstName: newMember.firstName,
      lastName: newMember.lastName,
      fullName: `${newMember.firstName} ${newMember.lastName}`,
      birthDate: newMember.birthDate,
      deathDate: newMember.deathDate,
      gender: newMember.gender,
      tags: newMember.tags || [],
      location: newMember.location,
      notes: newMember.notes,
      customFields: newMember.customFields || {},
    });

    setShowAddMemberDialog(false);
    setNewMember({});
    setDirty(true);
    // Save immediately to avoid losing data on quick reloads
    setTimeout(() => {
      saveFamilyTree();
    }, 0);
  };

  const handleAddRelationship = () => {
    if (readonly) {
      toast({ title: "View only", description: "You have view access only." });
      return;
    }
    if (members.length < 2) {
      toast({
        title: "Error",
        description: "You need at least 2 members to create a relationship",
        variant: "destructive",
      });
      return;
    }

    setShowAddRelationshipDialog(true);
    setNewRelationship({ type: "parent" });
  };

  const handleSaveRelationship = () => {
    if (
      !newRelationship.fromId ||
      !newRelationship.toId ||
      !newRelationship.type
    ) {
      toast({
        title: "Error",
        description: "Please select both members and relationship type",
        variant: "destructive",
      });
      return;
    }

    addEdge({
      fromId: newRelationship.fromId,
      toId: newRelationship.toId,
      type: newRelationship.type,
    });

    setShowAddRelationshipDialog(false);
    setNewRelationship({});
    setDirty(true);
    // Save immediately to avoid losing data on quick reloads
    setTimeout(() => {
      saveFamilyTree();
    }, 0);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    if (readonly) return;
    setEditingNode(nodeId);
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
  };

  const handleExport = () => {
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        toast({
          title: "Error",
          description: "Canvas not found",
          variant: "destructive",
        });
        return;
      }
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `family-tree-${new Date().toISOString()}.png`;
      a.click();
    } catch (e: any) {
      toast({
        title: "Export failed",
        description: e?.message || "Try again",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!user?.uid) return;
    if (!shareEmail) {
      toast({ title: "Email required", description: "Enter an email." });
      return;
    }
    try {
      const res = await fetch("/api/family-tree/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user.uid,
          email: shareEmail,
          role: shareRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Share failed");
      toast({
        title: "Shared",
        description: `Granted ${shareRole} to ${shareEmail}`,
      });
      setShareDialogOpen(false);
      setShareEmail("");
      setShareRole("viewer");
    } catch (e: any) {
      toast({
        title: "Share failed",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  };

  const writePresence = async (worldX: number, worldY: number) => {
    const treeOwner = ownerIdParam || user?.uid;
    if (!user?.uid || !treeOwner) return;
    const now = Date.now();
    if (now - lastPresenceWrite < 150) return;
    setLastPresenceWrite(now);
    try {
      await setDoc(
        doc(db, "familyTrees", treeOwner, "presence", user.uid),
        {
          name: user.displayName || "Me",
          color: "#10b981",
          x: worldX,
          y: worldY,
          lastActive: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {}
  };

  const handleToggleFullscreen = () => {
    setFullscreen(!isFullscreen);
  };

  const handleAISuggestions = async () => {
    const ownerId = ownerIdParam || user?.uid;
    if (!ownerId) return;
    try {
      const res = await fetch("/api/family-tree/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: ownerId, members, edges }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const list = (data.suggestions || []).slice(0, 10);
      const conflicts = data.conflicts || [];
      const msg =
        (list.length
          ? list
              .map(
                (s: any) => `• (${Math.round(s.confidence * 100)}%) ${s.detail}`
              )
              .join("\n")
          : "No suggestions found") +
        (conflicts.length
          ? "\n\nPotential conflicts:\n" +
            conflicts.map((c: any) => `• ${c.message}`).join("\n")
          : "");
      alert(msg);
    } catch (e: any) {
      toast({
        title: "Suggestions failed",
        description: e?.message || "",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium text-muted-foreground">
            Loading family tree...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="text-red-600 font-semibold text-lg">⚠️ Error Loading Family Tree</div>
              <div className="text-sm text-muted-foreground">{error}</div>
              {ownerIdParam && (
                <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded">
                  <strong>Note:</strong> You may not have access to this family tree, or it may have been unshared.
                </div>
              )}
              <div className="flex gap-2 justify-center">
                <Button onClick={() => {
                  setError(null);
                  loadFamilyTree();
                }}>Try Again</Button>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard/family-tree'}>
                  Go to My Tree
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full w-full ${
        isFullscreen ? "fixed inset-0 z-50 bg-white" : ""
      }`}
    >
      {/* Show search results if search parameter is present */}
      {searchParam && (
        <div className="p-6">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/family-tree")}
              className="mb-4"
            >
              ← Back to Family Tree
            </Button>
            <h1 className="text-2xl font-bold">
              Search Results for "{searchParam}"
            </h1>
            <p className="text-muted-foreground">
              Family trees matching your search
            </p>
          </div>
          <FamilyTreeSuggestions />
        </div>
      )}

      {/* Regular family tree interface */}
      {!searchParam && (
        <>
          {/* Tree Switcher */}
          {userProfile?.familyTreeApproved && mySharedTrees.length > 0 && (
            <div className="border-b bg-white px-4 py-2">
              <TreeSwitcher
                currentTreeOwner={ownerIdParam}
                currentTreeName={ownerIdParam ? `${ownerName}'s Family Tree` : "My Family Tree"}
                sharedTrees={mySharedTrees}
                isOwnTree={!ownerIdParam}
              />
            </div>
          )}

          {/* Toolbar - only for approved users */}
          {userProfile?.familyTreeApproved && (
            <FamilyTreeToolbar
              ownerIdParam={ownerIdParam}
              ownerName={ownerName}
              userId={user?.uid}
              dirty={dirty}
              isSaving={isSaving}
              readonly={readonly}
              shares={shares}
              onUndo={undo}
              onRedo={redo}
              onExport={handleExport}
              onToggleFullscreen={handleToggleFullscreen}
              onAISuggestions={handleAISuggestions}
              onShare={() => setShareDialogOpen(true)}
            />
          )}

          {(!tree || (tree?.members?.length || 0) === 0) && !ownerIdParam && (
            <div className="flex-none border-b bg-white/60">
              <div className="px-4 py-6">
                {!userProfile?.familyTreeApproved && (
                  <FamilyTreeApplicationForm />
                )}
              </div>
            </div>
          )}

          {/* Tree viewport for approved users */}
          {userProfile?.familyTreeApproved && (
          <>
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="flex-1 relative" id="tree-viewport">
              {/* Status badge removed for simplified table UI */}

              {/* Mode Toggle Controls */}
              {/* Mode toggle removed for table UI */}

              <div className="w-full h-full flex flex-col gap-3 p-3 overflow-hidden">
                {!readonly && (
                  <GenerationForm
                    members={members as any}
                    onAdd={({ members: newMembers, edges: newEdges }) => {
                      console.log('📝 Adding generation:', newMembers.length, 'members,', newEdges.length, 'edges');
                      
                      // Add members with their IDs preserved
                      newMembers.forEach((m) => {
                        console.log('  ➕ Adding member:', m.id, m.fullName);
                        addMember(m as any);
                      });
                      
                      newEdges.forEach((e) => {
                        console.log('➕ Adding edge:', e.type, 'from', e.fromId, 'to', e.toId);
                        addEdge({
                          fromId: e.fromId,
                          toId: e.toId,
                          type: e.type as any,
                        });
                      });
                      
                      setDirty(true);
                      
                      // Save immediately to persist edges
                      setTimeout(() => {
                        console.log('💾 Saving tree with edges...');
                        saveFamilyTree();
                      }, 100);
                    }}
                    onSave={saveFamilyTree}
                  />
                )}
                
                {/* Advanced Search */}
                <AdvancedSearch
                  members={members as any}
                  onSelectMember={(id) => setEditingNode(id)}
                />
                
                <MembersTable
                  members={members as any}
                  edges={edges as any}
                  onOpen={(id) => setEditingNode(id)}
                  onAiSuggest={handleAISuggestions}
                  ownerId={ownerIdParam || user?.uid}
                />
                
                {/* Relationships Table */}
                <div className="mt-6">
                  <RelationshipsTable
                    members={members as any}
                    edges={edges as any}
                    onRemoveEdge={(edgeId) => {
                      console.log('➖ Removing edge from relationships table:', edgeId);
                      removeEdge(edgeId);
                      setDirty(true);
                      setTimeout(() => {
                        console.log('💾 Auto-saving after edge removal...');
                        saveFamilyTree();
                      }, 500);
                    }}
                    readonly={readonly}
                  />
                </div>
                <MemberDetailDrawer
                  open={!!editingNode}
                  onOpenChange={(o) => !o && setEditingNode(null)}
                  member={
                    editingNode
                      ? (useFamilyTreeStore
                          .getState()
                          .getMember(editingNode) as any)
                      : null
                  }
                  ownerId={ownerIdParam || user?.uid || ""}
                  readonly={readonly}
                  onSave={(mm) => updateMember(mm.id, mm as any)}
                  onDelete={(id) => removeMember(id)}
                  members={members as any}
                  edges={edges as any}
                  onAddEdge={(e) => {
                    console.log('➕ Adding edge via drawer:', e.type, 'from', e.fromId, 'to', e.toId);
                    addEdge({
                      fromId: e.fromId,
                      toId: e.toId,
                      type: e.type as any,
                    });
                    setDirty(true);
                    // Auto-save after adding edge
                    setTimeout(() => {
                      console.log('💾 Auto-saving after edge addition...');
                      saveFamilyTree();
                    }, 500);
                  }}
                  onRemoveEdge={(edgeId) => {
                    console.log('➖ Removing edge via drawer:', edgeId);
                    removeEdge(edgeId);
                    setDirty(true);
                    // Auto-save after removing edge
                    setTimeout(() => {
                      console.log('💾 Auto-saving after edge removal...');
                      saveFamilyTree();
                    }, 500);
                  }}
                />
              </div>

              <div className="sm:hidden absolute bottom-4 right-4 flex flex-col gap-2">
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg"
                  onClick={handleAddMember}
                  disabled={readonly}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {editingNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Edit Family Member
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNode(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      {/* NodeEditor temporarily disabled - using MemberDetailDrawer instead */}
                      <div className="text-center py-8 text-muted-foreground">
                        Use the Edit button in the table to edit members
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l bg-muted/20 p-3 space-y-4 overflow-auto">
              <FamilyCodeGenerator userProfile={userProfile} />
            </div>
          </div>
          
          {/* Dialogs */}
          <AddMemberDialog
            open={showAddMemberDialog}
            onOpenChange={setShowAddMemberDialog}
            member={newMember}
            onMemberChange={setNewMember}
            onSave={handleSaveMember}
          />

          <AddRelationshipDialog
            open={showAddRelationshipDialog}
            onOpenChange={setShowAddRelationshipDialog}
            relationship={newRelationship}
            onRelationshipChange={setNewRelationship}
            members={members}
            onSave={handleSaveRelationship}
            suggestion={suggestion}
          />

          <ShareDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            email={shareEmail}
            role={shareRole}
            shares={shares}
            shareNames={shareNames}
            userId={user?.uid}
            onEmailChange={setShareEmail}
            onRoleChange={setShareRole}
            onShare={handleShare}
            onUpdateShare={async (targetUserId, newRole) => {
              try {
                await fetch("/api/family-tree/share", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ownerId: user?.uid, targetUserId, role: newRole }),
                });
                setShares((prev) => prev.map((p) => p.targetUserId === targetUserId ? { ...p, role: newRole } : p));
              } catch {}
            }}
            onRevoke={async (targetUserId) => {
              try {
                await fetch(`/api/family-tree/share?ownerId=${user?.uid}&targetUserId=${targetUserId}`, {
                  method: "DELETE",
                });
                setShares((prev) => prev.filter((p) => p.targetUserId !== targetUserId));
              } catch {}
            }}
          />
          </>
          )}
        </>
      )}
    </div>
  );
}
