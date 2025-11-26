"use client";

import DashboardLayout from "./DashboardLayout";
import { usePathname } from "next/navigation";
import { AuthProvider } from "./AuthProvider";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return isLoginPage ? <>{children}</> : <DashboardLayout>{children}</DashboardLayout>;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}
