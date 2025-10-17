"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Lock, Mail, Shield, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in to change your password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation password must match.",
        variant: "destructive",
      });
      return;
    }

    setIsChanging(true);

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password change error:", error);
      
      let errorMessage = "Failed to change password. Please try again.";
      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in before changing your password.";
      }

      toast({
        title: "Password Change Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-primary md:text-4xl">
          Account Settings
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manage your account security and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and login information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <div className="mt-1 text-base">{user.email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                User ID
              </label>
              <div className="mt-1 text-xs font-mono text-muted-foreground">
                {user.uid}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Account Created
              </label>
              <div className="mt-1 text-base">
                {user.metadata.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : "Unknown"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">New Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Confirm New Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isChanging}
              >
                {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
