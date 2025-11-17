"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'GET', credentials: 'include' });
        router.push('/login');
      } catch (e) {
        router.push('/login');
      }
    };

    doLogout();
  }, [router]);

  return <div className="p-8">Logging out...</div>;
}
