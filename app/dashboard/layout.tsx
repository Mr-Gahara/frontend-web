"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import Topbar from "@/components/topbar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthGuard();
  const pathname = usePathname();

  useEffect(() => {
    // Hanya membersihkan kunci scroll jika tersangkut, biarkan portal menutup secara mandiri (animasi)
    setTimeout(() => {
      document.body.style.pointerEvents = "";
      document.body.removeAttribute("data-scroll-locked");
    }, 500); // Beri waktu 500ms agar animasi Radix UI selesai dahulu
  }, [pathname]);

  return (
    <TooltipProvider>
      <SidebarProvider className="bg-[#041E3F]">
        <AppSidebar />
        <div className="flex flex-1 flex-col p-3 pr-4 md:p-4 md:pr-6 overflow-hidden h-screen bg-transparent">
          <main className="flex flex-1 flex-col min-w-0 bg-[#FFFAF3] rounded-[2rem] overflow-hidden shadow-xl relative">
            <Topbar />
            <div className="flex-1 overflow-y-auto p-6 md:p-8">{children}</div>
            <Toaster richColors position="top-right" />
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
