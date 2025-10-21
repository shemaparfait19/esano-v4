"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  useFamilyTreeStore, 
  selectMembers 
} from "@/lib/family-tree-store";
import { 
  Crown, 
  User,
  AlertCircle
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function FamilyHeadManager() {
  const members = useFamilyTreeStore(selectMembers);
  const updateMember = useFamilyTreeStore((state) => state.updateMember);
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Get current main family head
  const currentHead = members.find(m => m.isHeadOfFamily);

  // Get member being selected
  const selectedMember = members.find(m => m.id === selectedMemberId);

  const handleSetHead = (memberId: string) => {
    setSelectedMemberId(memberId);
    setShowConfirmDialog(true);
  };

  const confirmSetHead = () => {
    if (!selectedMemberId) return;

    // Remove old head
    if (currentHead) {
      updateMember(currentHead.id, {
        ...currentHead,
        isHeadOfFamily: false
      });
    }

    // Set new head
    const newHead = members.find(m => m.id === selectedMemberId);
    if (newHead) {
      updateMember(newHead.id, {
        ...newHead,
        isHeadOfFamily: true
      });

      toast({
        title: "Main Family Head Updated",
        description: `${newHead.fullName} is now the Main Family Head`,
      });
    }

    setShowConfirmDialog(false);
    setSelectedMemberId(null);
  };

  const removeHead = () => {
    if (!currentHead) return;

    updateMember(currentHead.id, {
      ...currentHead,
      isHeadOfFamily: false
    });

    toast({
      title: "Main Family Head Removed",
      description: `${currentHead.fullName} is no longer the Main Family Head`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Main Head Section */}
      <Card className={cn(
        "border-2",
        currentHead ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20" : "border-muted"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            Main Family Head
          </CardTitle>
          <CardDescription>
            The primary representative of your family tree (patriarch/matriarch)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentHead ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-amber-500">
                    <AvatarImage src={currentHead.avatarUrl} alt={currentHead.fullName} />
                    <AvatarFallback className="bg-amber-100 text-amber-900">
                      {currentHead.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{currentHead.fullName}</h3>
                  {currentHead.generation !== undefined && (
                    <Badge variant="outline" className="mt-1">
                      Generation {currentHead.generation}
                    </Badge>
                  )}
                  {currentHead.birthDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Born {new Date(currentHead.birthDate).getFullYear()}
                      {currentHead.deathDate && ` - ${new Date(currentHead.deathDate).getFullYear()}`}
                    </p>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={removeHead}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Remove Head
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                No main family head assigned yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Select a family member below to designate as the main head
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Members List */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          All Family Members
        </h3>
        
        {members.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                No family members added yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add members to your family tree first
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(member => (
              <Card 
                key={member.id}
                className={cn(
                  "transition-all hover:shadow-md",
                  member.id === currentHead?.id && "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className={cn(
                      "h-12 w-12",
                      member.id === currentHead?.id && "border-2 border-amber-500"
                    )}>
                      <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                      <AvatarFallback>
                        {member.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate flex items-center gap-2">
                        {member.fullName}
                        {member.id === currentHead?.id && (
                          <Crown className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        )}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {member.generation !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            Gen {member.generation}
                          </Badge>
                        )}
                        {member.isHeadOfFamily && (
                          <Badge className="text-xs bg-amber-500">
                            Main Head
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {member.birthDate && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Born {new Date(member.birthDate).getFullYear()}
                      {member.deathDate && ` - ${new Date(member.deathDate).getFullYear()}`}
                    </p>
                  )}

                  <Button 
                    size="sm" 
                    variant={member.id === currentHead?.id ? "secondary" : "outline"}
                    className="w-full"
                    onClick={() => handleSetHead(member.id)}
                    disabled={member.id === currentHead?.id}
                  >
                    {member.id === currentHead?.id ? (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Current Main Head
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Set as Main Head
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              Change Main Family Head?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              {currentHead && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Current Head:</span> {currentHead.fullName}
                  </p>
                </div>
              )}
              {selectedMember && (
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                  <p className="text-sm">
                    <span className="font-medium">New Head:</span> {selectedMember.fullName}
                  </p>
                </div>
              )}
              <p className="text-sm">
                {currentHead 
                  ? `${selectedMember?.fullName} will replace ${currentHead.fullName} as the Main Family Head.`
                  : `${selectedMember?.fullName} will become the Main Family Head.`
                }
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSetHead}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
