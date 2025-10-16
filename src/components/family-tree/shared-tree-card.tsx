"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Edit, Clock, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface SharedTreeCardProps {
  share: {
    id: string;
    ownerId: string;
    ownerName: string;
    role: "viewer" | "editor";
    createdAt: string;
    lastViewedAt?: string;
    memberCount?: number;
    lastUpdated?: string;
  };
}

export function SharedTreeCard({ share }: SharedTreeCardProps) {
  const router = useRouter();

  const handleOpen = () => {
    router.push(`/dashboard/family-tree?ownerId=${share.ownerId}`);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleOpen}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {share.ownerName}'s Family Tree
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Shared {formatDate(share.createdAt)}
            </p>
          </div>
          <Badge variant={share.role === "editor" ? "default" : "secondary"} className="ml-2">
            {share.role === "editor" ? (
              <><Edit className="h-3 w-3 mr-1" /> Editor</>
            ) : (
              <><Eye className="h-3 w-3 mr-1" /> Viewer</>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {share.memberCount !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {share.memberCount} {share.memberCount === 1 ? "Member" : "Members"}
              </span>
            </div>
          )}
          
          {share.lastUpdated && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Updated {formatDate(share.lastUpdated)}
              </span>
            </div>
          )}
        </div>

        {share.lastViewedAt && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Last viewed {formatDate(share.lastViewedAt)}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
        >
          {share.role === "editor" ? "Open & Edit" : "View Tree"}
        </Button>
      </CardFooter>
    </Card>
  );
}
