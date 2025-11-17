"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="flex w-full h-full bg-white shadow-lg rounded-lg">
        {/* Left Side - Image and Branding */}
        <div className="w-[65%] relative">
          <Image
            src={LOGIN_BG}
            alt="Login Background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-4 pointer-events-none">
            <a href="" target="_blank" rel="noopener noreferrer" className="z-50 pointer-events-auto">
              <Image
                src={SOS_LOGO}
                alt="SOS Logo"
                width={450}
                height={150}
                className="object-cover"
              />
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
        <div className="w-[35%] relative flex flex-col justify-center items-center h-full overflow-hidden">
          {/* Decorative Images */}
          <Image
            src={CORNER_TOP}
            alt="Top Corner Decoration"
            width={350}
            height={40}
            className="top-0 right-[-5px] absolute"
          />
          <Image
            src={CORNER_BOTTOM}
            alt="Bottom Corner Decoration"
            width={350}
            height={200}
            className="bottom-[-40px] left-[-20px] absolute 2xl:w-[400px]"
          />

          {/* Login Form */}
          <div className="w-[90%]">
            <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="absolute bottom-16 left-0 right-0 text-center">
            <label className="text-[10px] font-semibold text-gray-500 block mb-1">
              
            </label>
            <a href="" target="_blank" rel="noopener noreferrer" className="inline-block mb-2">
              <Image src={BUDGET_LOGO} alt="Ecomia Logo" width={100} height={40} />
            </a>
          </div>

          {/* Copyright */}
          <div className="absolute bottom-0 left-0 right-0 text-center text-[14px] text-primary-1">
            <p>Copyright © 2025 Budget Allocation and Disbursement. All rights reserved.</p>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
