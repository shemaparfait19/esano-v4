"use client";

import { useEffect, useState } from "react";
import type { AnalyzeDnaAndPredictRelativesOutput } from "@/ai/schemas/ai-dna-prediction";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dna, Link2, ExternalLink } from "lucide-react";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

type RelativeCardProps = {
  relative: AnalyzeDnaAndPredictRelativesOutput[0];
};

export function RelativeCard({ relative }: RelativeCardProps) {
  const [userName, setUserName] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const fallback = relative.userId.substring(0, 2).toUpperCase() || "P";
  // Relationship probability is between 0 and 1, so multiply by 100 for percentage
  const probabilityPercent = relative.relationshipProbability
    ? Math.round(relative.relationshipProbability * 100)
    : 0;

  useEffect(() => {
    let ignore = false;
    async function fetchUserProfile() {
      try {
        const userDoc = await getDoc(doc(db, "users", relative.userId));
        if (userDoc.exists() && !ignore) {
          const data = userDoc.data();
          const name = 
            data.fullName ||
            data.displayName ||
            [data.firstName, data.middleName, data.lastName]
              .filter(Boolean)
              .join(" ") ||
            "Anonymous User";
          setUserName(name);
          setPhotoURL(data.profilePicture || data.photoURL || "");
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchUserProfile();
    return () => { ignore = true; };
  }, [relative.userId]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={photoURL || `https://picsum.photos/seed/${relative.userId}/100`}
            data-ai-hint="person face"
          />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="font-headline text-lg">
            {loading ? "Loading..." : userName || "Potential Relative"}
          </CardTitle>
          <CardDescription>
            {loading ? "Fetching details..." : "DNA Match"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-primary">
            Match Found
          </h3>
          <p className="text-sm text-muted-foreground">Match Percentage:</p>
          <div className="flex items-center gap-2">
            <Progress value={probabilityPercent} className="h-2" />
            <span className="text-xs font-medium text-muted-foreground">
              {probabilityPercent}%
            </span>
          </div>
        </div>

        {relative.sharedCentimorgans && (
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Dna className="h-4 w-4 text-primary" />
            Shared DNA:{" "}
            <span className="font-semibold text-foreground">
              {relative.sharedCentimorgans} cM
            </span>
          </div>
        )}

        {relative.commonAncestors && relative.commonAncestors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Common Ancestors
            </h4>
            <div className="flex flex-wrap gap-2">
              {relative.commonAncestors.map((ancestor) => (
                <Badge key={ancestor} variant="secondary">
                  {ancestor}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link
            href={`/dashboard/profile/${encodeURIComponent(
              relative.userId
            )}`}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> View Profile
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
