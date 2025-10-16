"use client";

import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Download, Maximize2, Sparkles } from "lucide-react";

interface FamilyTreeToolbarProps {
  ownerIdParam?: string;
  ownerName: string;
  userId?: string;
  dirty: boolean;
  isSaving: boolean;
  readonly: boolean;
  shares: any[];
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onToggleFullscreen: () => void;
  onAISuggestions: () => void;
  onShare: () => void;
}

export function FamilyTreeToolbar({
  ownerIdParam,
  ownerName,
  userId,
  dirty,
  isSaving,
  readonly,
  shares,
  onUndo,
  onRedo,
  onExport,
  onToggleFullscreen,
  onAISuggestions,
  onShare,
}: FamilyTreeToolbarProps) {
  return (
    <div className="flex-none border-b bg-white sticky top-0 z-20">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {ownerIdParam && ownerIdParam !== userId && (
            <div className="mr-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted">
                Shared from {ownerName || "Owner"}
              </span>
            </div>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center text-xs text-muted-foreground mr-2 min-w-[90px] justify-end">
              {dirty ? (
                isSaving ? (
                  <span>Saving…</span>
                ) : (
                  <span>Unsaved changes</span>
                )
              ) : (
                <span>Saved</span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={readonly}
                className="h-8 px-2"
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={readonly}
                className="h-8 px-2"
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="h-8 px-2 hidden sm:flex"
              title="Export"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
              className="h-8 px-2 hidden sm:flex"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onAISuggestions}
              className="h-8 px-2 hidden md:flex"
              title="AI Suggestions"
            >
              <Sparkles className="h-4 w-4" />
            </Button>

            {!ownerIdParam && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="whitespace-nowrap h-8"
              >
                Share {shares.length > 0 && `(${shares.length})`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
