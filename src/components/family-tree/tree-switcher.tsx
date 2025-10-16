"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Home, Users, Share2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface TreeSwitcherProps {
  currentTreeOwner?: string;
  currentTreeName: string;
  sharedTrees: Array<{
    ownerId: string;
    ownerName: string;
    role: "viewer" | "editor";
  }>;
  isOwnTree: boolean;
}

export function TreeSwitcher({
  currentTreeOwner,
  currentTreeName,
  sharedTrees,
  isOwnTree,
}: TreeSwitcherProps) {
  const router = useRouter();

  const handleSwitch = (ownerId?: string) => {
    if (ownerId) {
      router.push(`/dashboard/family-tree?ownerId=${ownerId}`);
    } else {
      router.push("/dashboard/family-tree");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[250px] justify-between">
          <div className="flex items-center gap-2 truncate">
            {isOwnTree ? (
              <Home className="h-4 w-4 flex-shrink-0" />
            ) : (
              <Share2 className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="truncate">{currentTreeName}</span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        <DropdownMenuLabel>Switch Tree</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleSwitch()}>
          <Home className="h-4 w-4 mr-2" />
          <span>My Family Tree</span>
        </DropdownMenuItem>

        {sharedTrees.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Shared with Me ({sharedTrees.length})
            </DropdownMenuLabel>
            {sharedTrees.map((tree) => (
              <DropdownMenuItem
                key={tree.ownerId}
                onClick={() => handleSwitch(tree.ownerId)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Users className="h-4 w-4" />
                  <span className="flex-1 truncate">{tree.ownerName}</span>
                  <span className="text-xs text-muted-foreground">
                    {tree.role === "editor" ? "✏️" : "👁️"}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/shared-trees")}>
          <Plus className="h-4 w-4 mr-2" />
          <span>View All Shared Trees</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
