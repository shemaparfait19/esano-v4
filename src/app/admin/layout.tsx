"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Users,
  FileText,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  UserCheck,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/admin/applications", icon: FileText, label: "Applications" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/feedback", icon: MessageSquare, label: "Feedback" },
  { href: "/admin/logs", icon: AlertCircle, label: "Activity Logs" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/counseling", icon: BookOpen, label: "Counseling" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth");
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        router.push("/admin-login");
      }
    } catch (error) {
      router.push("/admin-login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin-login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              <Logo className="h-6 w-auto sm:h-8" />
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 hidden sm:block">
                Esano Admin Panel
              </h1>
              <h1 className="text-base font-semibold text-gray-900 sm:hidden">
                Admin
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden md:inline">admin@esano.rw</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-white shadow-lg lg:shadow-sm
            transform transition-transform duration-300 ease-in-out
            lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            min-h-screen pt-16 lg:pt-0
          `}
        >
          <div className="p-4 overflow-y-auto h-full">
            <ul className="space-y-2">
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      pathname === item.href
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
