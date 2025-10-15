"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface FamilyCodeBadgeProps {
  ownerId: string;
  isHead: boolean;
}

export function FamilyCodeBadge({ ownerId, isHead }: FamilyCodeBadgeProps) {
  const [visible, setVisible] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    try {
      setLoading(true);
      const res = await fetch("/api/family-code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: ownerId, familyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCode(data.formattedCode || data.familyCode || data.code);
      toast({ title: "Family code generated" });
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast({ title: "Copied" });
  }

  return (
    <Card className="p-3 flex items-center gap-2">
      <div className="text-sm font-medium">Family Code</div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
        </Button>
        {visible && (
          <>
            <div className="font-mono text-sm select-all">
              {code || "(none)"}
            </div>
            <Button size="sm" variant="ghost" onClick={copy} disabled={!code}>
              Copy
            </Button>
          </>
        )}
        {isHead && (
          <>
            <Input
              placeholder="Family name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-40"
            />
            <Button size="sm" onClick={generate} disabled={loading}>
              Generate
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
