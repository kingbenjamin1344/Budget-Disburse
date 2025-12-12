"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import LogoutModal from "@/components/LogoutModal";

import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  ChevronLeft,
  ChevronRight,
  AppWindowMac,
  HandCoins,
  Tickets,
  UserStar,
  LogOut,
  CirclePlus,
  BellRing,
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMini, setSidebarMini] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const links = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/Dashboard" },
    { name: "Add Budget", icon: <HandCoins size={20} />, path: "/Addbudget" },
    { name: "Disbursement", icon: <Tickets size={20} />, path: "/Disbursement" },
    { name: "SOE", icon: <AppWindowMac size={20} />, path: "/Soe" },
    { name: "Logs", icon: <BellRing size={20} />, path: "/Logs" },
  ];

  const adminLinks = [
    { name: "Add Office", icon: <CirclePlus size={20} />, path: "/Admin/Addoffice" },
    { name: "Add Expense", icon: <CirclePlus size={20} />, path: "/Admin/Addexpense" },
  ];

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
    } catch (e) {
      /* ignore */
    }

    if (typeof window !== "undefined") {
      window.location.href = "/logout";
    } else {
      router.push("/logout");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/check", { method: "GET", credentials: "include" });
        if (!isMounted) return;
        if (!res.ok) {
          window.location.href = "/login";
        }
      } catch (e) {
        if (!isMounted) return;
        window.location.href = "/login";
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div id="dashboard-layout" className="flex flex-col h-screen bg-gray-100">
      {/* HEADER */}
      <header
        id="navbar"
        className="bg-white shadow-md h-16 flex items-center justify-between px-6 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/site.jpg')" }}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-gray-700 focus:outline-none"
          >
            <Menu />
          </button>
          <h1 className="text-xl md:text-2xl font-semibold text-white drop-shadow-sm font-[var(--font-inter)]">
            Budget and Disbursement Management System
          </h1>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          id="sidebar"
          className={`relative fixed md:static z-20 top-16 left-0 h-full p-4 flex flex-col justify-between transition-all duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${sidebarMini ? "w-20" : "w-64"}`}
          style={{ backgroundColor: "#0b1a44ff" }}
        >
          <nav className="flex-1 space-y-1">
            {/* MAIN LINKS (Dashboard first) */}
            {links.map((link) =>
              link.name === "Dashboard" ? (
                <button
                  key={link.name}
                  onClick={() => router.push(link.path)}
                  className={`relative flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left transition-all
                  ${sidebarMini ? "justify-center" : ""} text-white
                  ${pathname === link.path ? "bg-[#0000FF]" : "hover:bg-white/20"}`}
                >
                  {/* Vertical line indicator */}
                  {!sidebarMini && pathname === link.path && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-yellow-400 rounded-r"></div>
                  )}

                  {link.icon}
                  {!sidebarMini && <span className="ml-4">{link.name}</span>}
                </button>
              ) : null
            )}

            {/* ADMIN DROPDOWN (second) */}
            <div className="flex flex-col">
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className={`flex items-center justify-between px-3 py-2 rounded-md w-full transition-all
                ${sidebarMini ? "justify-center" : ""} text-white`}
              >
                <div className="flex items-center space-x-3">
                  <UserStar size={20} color="white" />
                  {!sidebarMini && <span>Admin</span>}
                </div>

                {!sidebarMini && (
                  <ChevronRight
                    size={18}
                    color="white"
                    className={`transition-transform duration-200 ${adminOpen ? "rotate-90" : ""}`}
                  />
                )}
              </button>

              {!sidebarMini && adminOpen && (
                <div className="flex flex-col mt-1 space-y-1 ml-3">
                  {adminLinks.map((sub) => (
                    <button
                      key={sub.name}
                      onClick={() => router.push(sub.path)}
                      className={`relative flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left transition-all text-white
                      ${pathname === sub.path ? "bg-[#0000FF]" : "hover:bg-white/20"}`}
                    >
                      {!sidebarMini && pathname === sub.path && (
                        <div className="absolute left-0 top-0 h-full w-1 bg-yellow-400 rounded-r"></div>
                      )}
                      {sub.icon}
                      {!sidebarMini && <span className="ml-4">{sub.name}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Other sidebar links (excluding Dashboard) */}
            {links.map((link) =>
              link.name !== "Dashboard" ? (
                <button
                  key={link.name}
                  onClick={() => router.push(link.path)}
                  className={`relative flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left transition-all
                  ${sidebarMini ? "justify-center" : ""} text-white
                  ${pathname === link.path ? "bg-[#0000FF]" : "hover:bg-white/20"}`}
                >
                  {!sidebarMini && pathname === link.path && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-yellow-400 rounded-r"></div>
                  )}
                  {link.icon}
                  {!sidebarMini && <span className="ml-4">{link.name}</span>}
                </button>
              ) : null
            )}
          </nav>

          {/* Bottom Logo */}
          <div className="mt-auto mb-6 flex flex-col items-center">
            <Image
              src="/img/logo.png"
              alt="Logo"
              width={sidebarMini ? 80 : 130}
              height={sidebarMini ? 80 : 130}
              className="object-contain mb-3"
            />
            {!sidebarMini && (
              <p className="text-white text-base font-semibold tracking-wide text-center">
                LGU Magallanes
              </p>
            )}
            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`flex items-center justify-center space-x-3 px-3 py-2 mt-3 rounded-md w-full text-white transition-all
              bg-red-700 hover:bg-red-800`}
            >
              <LogOut size={20} color="white" />
              {!sidebarMini && <span>Log Out</span>}
            </button>
          </div>

          {/* TOGGLE BUTTON */}
          <div className="absolute top-[15rem] -right-4">
            <div className="relative w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
              <button
                onClick={() => setSidebarMini(!sidebarMini)}
                className="absolute w-6 h-6 rounded-full bg-[#101d66] text-white flex items-center justify-center hover:bg-[#0a1448] transition shadow-lg"
              >
                {sidebarMini ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
          </div>
        </aside>

        {/* OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* MAIN CONTENT */}
        <main id="main-content" className="flex-1 p-6 overflow-y-auto flex flex-col">
          <div
            id="content-card"
            className="bg-white rounded-xl shadow-md p-8 w-full flex-1"
          >
            {children}
          </div>
        </main>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
      />
    </div>
  );
}
