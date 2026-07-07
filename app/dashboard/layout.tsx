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

  // SISTEM PEMUSNAH MUTLAK (RADIX UI ORPHANED PORTALS)
  useEffect(() => {
    document.body.style.pointerEvents = "";
    document.body.removeAttribute("data-scroll-locked");
    const orphanedPortals = document.querySelectorAll("[data-radix-portal]");
    orphanedPortals.forEach((portal) => {
      portal.remove();
    });
  }, [pathname]);

  return (
    <TooltipProvider>
      {/* 1. Berikan warna gelap pada wrapper paling luar */}
      <SidebarProvider className="bg-[#041E3F]">
        <AppSidebar />
        
        {/* 2. Pembungkus untuk memberikan jarak (gap) yang membentuk efek "border" */}
        <div className="flex flex-1 flex-col p-3 pr-4 md:p-4 md:pr-6 overflow-hidden h-screen bg-transparent">
          
          {/* 3. Area Konten Utama: Warna cream, rounded corners, dan shadow tipis */}
          <main className="flex flex-1 flex-col min-w-0 bg-[#FFFAF3] rounded-[2rem] overflow-hidden shadow-xl relative border border-white/10">
            <Topbar />
            
            {/* Area scroll hanya ada di dalam kotak konten ini */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {children}
            </div>
            
            <Toaster richColors position="top-right" />
          </main>
          
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}