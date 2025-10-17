"use client";

import { useEffect, useState } from "react";
import { FeedbackViewer } from "@/components/admin/feedback-viewer";

export default function AdminFeedbackPage() {
  const [adminId, setAdminId] = useState<string>("");

  useEffect(() => {
    // Get admin ID from session/auth
    // For now using a placeholder - should integrate with actual admin auth
    const fetchAdminId = async () => {
      try {
        const response = await fetch("/api/admin/auth");
        if (response.ok) {
          const data = await response.json();
          setAdminId(data.adminId || "admin@esano.rw");
        }
      } catch (error) {
        console.error("Failed to get admin ID:", error);
        setAdminId("admin@esano.rw");
      }
    };

    fetchAdminId();
  }, []);

  if (!adminId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <FeedbackViewer adminId={adminId} />
    </div>
  );
}
