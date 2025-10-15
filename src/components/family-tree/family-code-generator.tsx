"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  RefreshCw,
  Users,
  Key,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FamilyCodeGeneratorProps {
  userProfile: any;
  ownerId?: string;
  onCodeGenerated?: (code: string) => void;
}

export function FamilyCodeGenerator({
  userProfile,
  ownerId,
  onCodeGenerated,
}: FamilyCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [familyName, setFamilyName] = useState<string>("");
  const [copiedRecently, setCopiedRecently] = useState(false);

  // Auto-populate family name if available in user profile
  useEffect(() => {
    if (userProfile?.familyName && !familyName) {
      setFamilyName(userProfile.familyName);
    }
    // Rehydrate last generated code from profile or localStorage
    if (userProfile?.familyCode && !generatedCode) {
      setGeneratedCode(userProfile.familyCode);
    } else if (typeof window !== "undefined" && !generatedCode) {
      const cached = window.localStorage.getItem("familyCode:last");
      if (cached) setGeneratedCode(cached);
    }
  }, [userProfile, familyName]);

  const generateFamilyCode = async () => {
    if (!familyName.trim()) {
      toast({
        title: "Family Name Required",
        description: "Please enter a family name before generating a code.",
        variant: "destructive",
      });
      return;
    }

    // Validate family name (basic validation)
    if (familyName.trim().length < 2) {
      toast({
        title: "Invalid Family Name",
        description: "Family name must be at least 2 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/family-code/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId:
            ownerId ||
            userProfile?.uid ||
            userProfile?.id ||
            userProfile?.userId,
          familyName: familyName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const code = data.formattedCode || data.familyCode || data.code;
        setGeneratedCode(code);
        onCodeGenerated?.(code);
        // Persist for rehydration
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem("familyCode:last", code);
          }
        } catch {}
        // Best-effort save to user profile
        try {
          const uid =
            ownerId ||
            userProfile?.uid ||
            userProfile?.id ||
            userProfile?.userId;
          if (uid) {
            await fetch(`/api/admin/users/${uid}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                displayName: userProfile?.displayName,
                isFamilyHead: true,
              }),
            });
            // store familyCode field directly under user via client Firestore if available later
          }
        } catch {}
        toast({
          title: "Family Code Generated! 🎉",
          description: `Your family code is: ${code}`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate family code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating family code:", error);
      toast({
        title: "Error",
        description: "Failed to generate family code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(generatedCode);
        setCopiedRecently(true);
        toast({
          title: "Copied! ✓",
          description: "Family code copied to clipboard",
        });

        // Reset copied state after 2 seconds
        setTimeout(() => setCopiedRecently(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
        toast({
          title: "Copy Failed",
          description: "Could not copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && familyName.trim() && !isGenerating) {
      generateFamilyCode();
    }
  };

  if (!userProfile?.isFamilyHead) {
    return (
      <Card className="w-full max-w-md border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-900">
                Family Head Access Required
              </p>
              <p className="text-xs text-orange-700">
                Only family heads can generate invitation codes. Please contact
                your family head to get an invitation code.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Key className="h-5 w-5 text-blue-600" />
          Generate Family Code
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Create an invitation code for your family members
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="familyName" className="text-sm font-medium">
            Family Name
          </Label>
          <Input
            id="familyName"
            placeholder="e.g., Smith Family"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isGenerating}
            className="font-medium"
            maxLength={50}
          />
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span>This will identify your family tree</span>
            {familyName.trim() && (
              <span className="text-gray-400">
                ({familyName.trim().length}/50)
              </span>
            )}
          </p>
        </div>

        <Button
          onClick={generateFamilyCode}
          disabled={isGenerating || !familyName.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Key className="h-4 w-4 mr-2" />
              Generate Family Code
            </>
          )}
        </Button>

        {generatedCode && (
          <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-green-800">
                Family Code Generated Successfully!
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-white p-3 rounded-md border border-green-300">
                <Badge
                  variant="outline"
                  className="font-mono text-lg px-4 py-2 bg-white border-green-400 text-green-900 flex-1 justify-center"
                >
                  {generatedCode}
                </Badge>
                <Button
                  size="sm"
                  variant={copiedRecently ? "default" : "outline"}
                  onClick={copyToClipboard}
                  className={`h-10 transition-all ${
                    copiedRecently
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "hover:bg-green-50"
                  }`}
                >
                  {copiedRecently ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="text-xs text-green-800 space-y-2 bg-white/50 p-3 rounded-md">
                <p className="font-semibold">Next Steps:</p>
                <ul className="space-y-1 ml-1">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>
                      Share this code with family members via text or email
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>
                      They can use it during signup to join your family tree
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Code expires after 30 days of generation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800 space-y-2">
          <p className="font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            How it works:
          </p>
          <ol className="space-y-1.5 ml-1">
            <li className="flex gap-2">
              <span className="font-semibold text-blue-600">1.</span>
              <span>Generate a unique family code with your family name</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-blue-600">2.</span>
              <span>Share the code with family members you want to invite</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-blue-600">3.</span>
              <span>They enter the code during signup to join your tree</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-blue-600">4.</span>
              <span>You can manage their permissions from your dashboard</span>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
