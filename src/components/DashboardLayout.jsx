"use client";

import Image from "next/image";
import { useState } from "react";
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
  CirclePlus
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMini, setSidebarMini] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const links = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/Dashboard" },
    { name: "Add Budget", icon: <HandCoins size={20} />, path: "/Addbudget" },
    { name: "Disbursement", icon: <Tickets size={20} />, path: "/Disbursement" },
    { name: "SOE", icon: <AppWindowMac size={20} />, path: "/Soe" },
  ];

  const adminLinks = [
    { name: "Add Office", icon: <CirclePlus size={20} />, path: "/Admin/Addoffice" },
    { name: "Add Expense", icon: <CirclePlus size={20} />, path: "/Admin/Addexpense" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* HEADER */}
      <header
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

        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-white hover:text-gray-300">
            <span>Log Out</span>
            <LogOut size={20} className="text-white" />
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`relative fixed md:static z-20 top-16 left-0 h-full bg-white shadow-md p-4 flex flex-col justify-between transition-all duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${sidebarMini ? "w-20" : "w-64"}`}
        >
          <nav className="flex-1 space-y-1">
            {/* ADMIN DROPDOWN */}
            <div className="flex flex-col">
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className={`flex items-center justify-between px-3 py-2 rounded-md w-full transition-all
                ${sidebarMini ? "justify-center" : ""}
                ${
                  pathname.startsWith("/Admin")
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <UserStar size={20} />
                  {!sidebarMini && <span>Admin</span>}
                </div>

                {!sidebarMini && (
                  <ChevronRight
                    size={18}
                    className={`transition-transform duration-200 ${
                      adminOpen ? "rotate-90" : ""
                    }`}
                  />
                )}
              </button>

              {/* Admin Dropdown Links */}
              {!sidebarMini && adminOpen && (
                <div className="flex flex-col mt-1 space-y-1 ml-3">
                  {adminLinks.map((sub) => (
                    <button
                      key={sub.name}
                      onClick={() => router.push(sub.path)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left transition-all
                      ${
                        pathname === sub.path
                          ? "bg-blue-500 text-white"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {sub.icon}
                      <span>{sub.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Other sidebar links */}
            {links.map((link) => (
              <button
                key={link.name}
                onClick={() => router.push(link.path)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left transition-all
                ${sidebarMini ? "justify-center" : ""}
                ${
                  pathname === link.path
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                {link.icon}
                {!sidebarMini && <span>{link.name}</span>}
              </button>
            ))}
          </nav>

          {/* BOTTOM LOGO */}
          <div className="mt-auto mb-6 flex flex-col items-center">
            <Image
              src="/img/logo.png"
              alt="Logo"
              width={sidebarMini ? 80 : 130}
              height={sidebarMini ? 80 : 130}
              className="object-contain mb-3"
            />
            {!sidebarMini && (
              <p className="text-gray-700 text-base font-semibold tracking-wide text-center">
                LGU Magallanes
              </p>
            )}
          </div>

          {/* TOGGLE BUTTON */}
          <div className="absolute top-[15rem] -right-4">
            <div className="relative w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
              <button
                onClick={() => setSidebarMini(!sidebarMini)}
                className="absolute w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition shadow-lg"
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
        <main className="flex-1 p-6 overflow-y-auto flex flex-col">
          <div className="bg-white rounded-xl shadow-md p-8 w-full flex-1">
            {children}
          </div>
                  </main>
      </div>
    </div>
  );
}
