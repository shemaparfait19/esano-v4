"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  AlertTriangle,
  Star,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  ExternalLink,
} from "lucide-react";

type Feedback = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

interface FeedbackViewerProps {
  adminId: string;
}

export function FeedbackViewer({ adminId }: FeedbackViewerProps) {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [filterStatus, filterType]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ adminId });
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("type", filterType);

      const response = await fetch(`/api/feedback?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast({
        title: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (
    id: string,
    status: string,
    adminNotes?: string
  ) => {
    setUpdating(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes, adminId }),
      });

      if (response.ok) {
        toast({ title: "Feedback updated successfully" });
        loadFeedback();
        setSelectedFeedback(null);
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      toast({
        title: "Failed to update feedback",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleReplyViaGmail = (feedback: Feedback) => {
    const subject = encodeURIComponent(`Re: ${feedback.subject || 'Your Feedback on Esano'}`);
    const body = encodeURIComponent(
      `Hi ${feedback.userName},\n\nThank you for your feedback regarding: "${feedback.subject || 'No subject'}"\n\nYour message:\n"${feedback.message}"\n\n---\n\nOur response:\n\n[Write your response here]\n\nBest regards,\nEsano Team`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(feedback.userEmail)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case "complaint":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "bug":
        return <Bug className="h-4 w-4 text-red-600" />;
      case "feature":
        return <Star className="h-4 w-4 text-purple-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="secondary" className="gap-1">
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" /> Resolved
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Dismissed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    return (
      <Badge variant={variants[priority] || "outline"}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const filteredFeedback = feedback;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                User Feedback & Suggestions
                {feedback.filter((f) => f.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {feedback.filter((f) => f.status === "pending").length} New
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage feedback, complaints, and feature requests from users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Status Filter</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Type Filter</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="suggestion">Suggestions</SelectItem>
                  <SelectItem value="complaint">Complaints</SelectItem>
                  <SelectItem value="bug">Bug Reports</SelectItem>
                  <SelectItem value="feature">Feature Requests</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadFeedback} variant="outline">
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{feedback.length}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                {feedback.filter((f) => f.status === "pending").length}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {feedback.filter((f) => f.status === "resolved").length}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold text-red-600">
                {feedback.filter((f) => f.priority === "high").length}
              </p>
            </div>
          </div>

          {/* Feedback List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No feedback found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedFeedback(item)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getTypeIcon(item.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold truncate">
                            {item.subject || "No subject"}
                          </h4>
                          {getStatusBadge(item.status)}
                          {getPriorityBadge(item.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>From: {item.userName}</span>
                          <span>•</span>
                          <span>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Feedback Detail Modal */}
      {selectedFeedback && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="flex items-center gap-2">
                {getTypeIcon(selectedFeedback.type)}
                {selectedFeedback.subject || "No subject"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFeedback(null)}
              >
                ✕
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {getStatusBadge(selectedFeedback.status)}
              {getPriorityBadge(selectedFeedback.priority)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>From User</Label>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    {selectedFeedback.userName} ({selectedFeedback.userEmail})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    User ID: {selectedFeedback.userId}
                  </p>
                </div>
                {selectedFeedback.userEmail && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReplyViaGmail(selectedFeedback)}
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Reply via Gmail
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Message</Label>
              <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                {selectedFeedback.message}
              </p>
            </div>

            <div>
              <Label>Submitted</Label>
              <p className="text-sm">
                {new Date(selectedFeedback.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                value={selectedFeedback.adminNotes || ""}
                onChange={(e) =>
                  setSelectedFeedback({
                    ...selectedFeedback,
                    adminNotes: e.target.value,
                  })
                }
                placeholder="Add internal notes..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Update Status</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateFeedbackStatus(
                      selectedFeedback.id,
                      "reviewed",
                      selectedFeedback.adminNotes
                    )
                  }
                  disabled={updating}
                >
                  Mark Reviewed
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() =>
                    updateFeedbackStatus(
                      selectedFeedback.id,
                      "resolved",
                      selectedFeedback.adminNotes
                    )
                  }
                  disabled={updating}
                >
                  Mark Resolved
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    updateFeedbackStatus(
                      selectedFeedback.id,
                      "dismissed",
                      selectedFeedback.adminNotes
                    )
                  }
                  disabled={updating}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
