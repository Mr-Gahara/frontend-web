"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Topbar() {
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    const today = new Date().toLocaleDateString("id-ID", dateOptions);
    setCurrentDate(today);
  }, []);

  return (
    <header className="flex justify-between items-center px-8 py-5 bg-transparent z-10">
      <div className="flex items-center gap-4">
        {/* Tombol Trigger Shadcn UI */}
        <SidebarTrigger 
          className="bg-[#0A2947] text-white hover:bg-[#0A2947]/80 hover:text-white cursor-pointer transition-colors" 
        />
        
        <span className="text-base font-semibold text-gray-800">
          {currentDate}
        </span>
      </div>

      <div>
        <button
          className="flex items-center justify-center p-2.5 bg-[#0A2947] hover:bg-[#0A2947]/80 text-white rounded-lg transition-colors cursor-pointer border-none shadow-sm"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}