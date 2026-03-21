"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="w-full h-screen flex items-center justify-center">
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-lg font-semibold text-gray-700">Logging out...</p>
          </div>
        </div>
      )}

      {/* Blurred Background Content */}
      <div className={`transition-all duration-300 ${isLoading ? "blur-sm" : ""}`}>
        <div className="p-8 text-center">
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    </div>
  );
}
