"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react"; // For eye toggle

// Replace these with your actual image URLs or imports
const LOGIN_BG = "/picture/bg.png";
const SOS_LOGO = "/picture/agusan.png";
const BUDGET_LOGO = "/picture/logo.png";
const CORNER_TOP = "/picture/corner-image.png";
const CORNER_BOTTOM = "/picture/corner-image2.png";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push(data.redirect);
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center h-screen bg-gray-100">
      {/* Overlapping Transparent Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-25">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10">
                
              </div>
           
            </div>
            <div className="flex items-center space-x-4">
             
            </div>
          </div>
        </div>
      </nav>

      <div className="flex w-full h-full bg-white shadow-lg rounded-lg">
        {/* Left Side - Image and Branding */}
        <div className="w-[65%] relative">
          <Image src={LOGIN_BG} alt="Login Background" fill className="object-cover" />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-4 pointer-events-none">
            <a href="" target="_blank" rel="noopener noreferrer" className="z-50 pointer-events-auto">
              <Image src={SOS_LOGO} alt="SOS Logo" width={450} height={150} className="object-cover" />
            </a>
            <hr className="w-150 border-t border-white border-opacity-50 my-3" />
            <h1 className="text-4xl font-bold">
              Budget Disbursement Management System
            </h1>
            <p className="text-sm">
              Manage budget and disbursement for Lgu Magallanes.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-[35%] relative flex justify-center items-center h-full overflow-hidden">
          {/* Login Card */}
          <div className="w-full max-w-md px-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200">
              {/* Admin Badge */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
                 
                </div>
                <h1 className="text-3xl font-bold text-gray-800">Administrator</h1>
                
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    "Log In"
                  )}
                </button>

                {/* Admin Info Note */}
                <div className="text-center pt-4">
                  <p className="text-xs text-gray-500">
                    This portal is restricted to authorized admin users only.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 text-center text-[12px] text-gray-500 py-4 bg-white/50 backdrop-blur-sm">
            <p>Copyright © 2025 Budget Allocation and Disbursement. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}