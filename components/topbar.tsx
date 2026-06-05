"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar"; // Impor Trigger bawaan

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
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.25rem 2rem",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Tombol Trigger Shadcn UI */}
        <SidebarTrigger 
          className="bg-[#1a1a1a] text-white hover:bg-neutral-800 hover:text-white cursor-pointer" 
        />
        
        <span style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>
          {currentDate}
        </span>
      </div>

      <div>
        <button
          style={{
            background: "#1a1a1a",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            borderRadius: "0.375rem",
          }}
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}