"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      try {
        // Perform a full-page navigation to the logout endpoint so the browser
        // receives the Set-Cookie header and applies cookie deletion reliably.
        window.location.href = '/api/auth/logout';
      } catch (e) {
        // ignore
      } finally {
        // no-op here; the server redirect will land on /login
      }
    };

    doLogout();
  }, [router]);

  return <div className="p-8">Logging out...</div>;
}
