"use client";

import DashboardLayout from "./DashboardLayout";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return isLoginPage ? <>{children}</> : <DashboardLayout>{children}</DashboardLayout>;
}
