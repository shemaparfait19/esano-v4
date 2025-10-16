"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  role: "viewer" | "editor";
  shares: any[];
  shareNames: Record<string, string>;
  userId?: string;
  onEmailChange: (email: string) => void;
  onRoleChange: (role: "viewer" | "editor") => void;
  onShare: () => void;
  onUpdateShare: (targetUserId: string, newRole: string) => Promise<void>;
  onRevoke: (targetUserId: string) => Promise<void>;
}

export function ShareDialog({
  open,
  onOpenChange,
  email,
  role,
  shares,
  shareNames,
  userId,
  onEmailChange,
  onRoleChange,
  onShare,
  onUpdateShare,
  onRevoke,
}: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Family Tree</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => onRoleChange(v as "viewer" | "editor")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                <SelectItem value="editor">Editor (Can modify)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={onShare} className="w-full">
            Share
          </Button>

          {shares.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">
                Currently shared with ({shares.length})
              </Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {shares.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {shareNames[s.targetUserId] || s.targetEmail}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.role === "viewer" ? "View only" : "Can edit"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select
                        value={s.role}
                        onValueChange={(v) => onUpdateShare(s.targetUserId, v)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRevoke(s.targetUserId)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
