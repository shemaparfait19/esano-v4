"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Bug, Lightbulb, AlertTriangle, Star, Loader2 } from "lucide-react";

export default function FeedbackPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "suggestion",
    subject: "",
    message: "",
    priority: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your feedback message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid || "anonymous",
          userName: userData?.fullName || userData?.firstName || "Anonymous",
          userEmail: userData?.email || user?.email || "",
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✓ Feedback submitted!",
          description: "Thank you! We'll review your feedback soon.",
        });
        // Reset form
        setFormData({
          type: "suggestion",
          subject: "",
          message: "",
          priority: "medium",
        });
      } else {
        throw new Error(data.error || "Failed to submit");
      }
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const feedbackTypes = [
    { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-blue-600" },
    { value: "complaint", label: "Complaint", icon: AlertTriangle, color: "text-orange-600" },
    { value: "bug", label: "Bug Report", icon: Bug, color: "text-red-600" },
    { value: "feature", label: "Feature Request", icon: Star, color: "text-purple-600" },
    { value: "other", label: "Other", icon: MessageSquare, color: "text-gray-600" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-headline text-3xl font-bold text-primary md:text-4xl">
          Feedback & Suggestions
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Help us improve Esano! Share your ideas, report issues, or let us know how we're doing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">
            Submit Feedback
          </CardTitle>
          <CardDescription>
            Your feedback is valuable to us. We read every submission and use it to make Esano better.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Feedback Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority (Optional)</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor improvement</SelectItem>
                  <SelectItem value="medium">Medium - Moderate issue</SelectItem>
                  <SelectItem value="high">High - Important issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your feedback"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                maxLength={100}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Tell us more about your feedback, suggestion, or issue..."
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={8}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.message.length} characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData({
                    type: "suggestion",
                    subject: "",
                    message: "",
                    priority: "medium",
                  })
                }
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What to Include</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>✓ Be specific and detailed</p>
            <p>✓ Include steps to reproduce (for bugs)</p>
            <p>✓ Suggest solutions if you have ideas</p>
            <p>✓ Screenshots or examples help a lot</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Time</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• High priority: 24-48 hours</p>
            <p>• Medium priority: 3-5 days</p>
            <p>• Low priority: 1-2 weeks</p>
            <p>• We'll update you on progress</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
