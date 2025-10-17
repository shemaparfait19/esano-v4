"use client";

import { Button } from "@/components/ui/button";
import { Table, GitBranch, Calendar, LayoutGrid } from "lucide-react";

export type ViewMode = "table" | "tree" | "timeline" | "cards";

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ currentMode, onModeChange }: ViewModeToggleProps) {
  const modes = [
    { id: "table" as ViewMode, label: "Table", icon: Table, description: "List view" },
    { id: "tree" as ViewMode, label: "Tree Chart", icon: GitBranch, description: "Visual hierarchy" },
    { id: "timeline" as ViewMode, label: "Timeline", icon: Calendar, description: "Chronological" },
    { id: "cards" as ViewMode, label: "Cards", icon: LayoutGrid, description: "Gallery view" },
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border">
      <span className="text-sm font-medium text-muted-foreground px-2">View:</span>
      <div className="flex gap-1">
        {modes.map((mode) => (
          <Button
            key={mode.id}
            variant={currentMode === mode.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onModeChange(mode.id)}
            className="flex items-center gap-2"
            title={mode.description}
          >
            <mode.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{mode.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
