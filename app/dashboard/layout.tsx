"use client";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import Topbar from "@/components/topbar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh" }}>
          <Topbar />
          <div style={{ padding: "1.5rem 2rem", flex: 1 }}>{children}</div>
          <Toaster richColors position="top-right" />
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}