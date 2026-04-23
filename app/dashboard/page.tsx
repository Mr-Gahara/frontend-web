"use client";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

const DashboardPage = () => {
  const router = useRouter();
  useAuthGuard();
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
};

export default DashboardPage;
