// /src/components/DashboardLayout.jsx
"use client";
import Image from "next/image";
import { useState } from "react";
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
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMini, setSidebarMini] = useState(false);
  const [activeLink, setActiveLink] = useState("Dashboard");

  const links = [
    { name: "Admin", icon: <UserStar size={20} /> },
    { name: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Add Budget", icon: <HandCoins size={20} /> },
    { name: "Disbursement", icon: <Tickets size={20} /> },
    { name: "SOE", icon: <AppWindowMac size={20} /> },
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
            {/* Admin dropdown */}
            <div className="flex flex-col">
              <button
                onClick={() =>
                  setActiveLink(activeLink === "Admin" ? "" : "Admin")
                }
                className={`flex items-center justify-between px-3 py-2 rounded-md w-full transition-all ${
                  sidebarMini ? "justify-center" : ""
                } ${
                  activeLink === "Admin"
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
                      activeLink === "Admin" ? "rotate-90" : ""
                    }`}
                  />
                )}
              </button>

              {/* Dropdown */}
              {!sidebarMini && activeLink === "Admin" && (
                <div className="flex flex-col mt-1 space-y-1 ml-2">
                  <button className="flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left transition-all text-gray-600 hover:bg-gray-200">
                    <HandCoins size={20} />
                    <span>Add Office</span>
                  </button>
                  <button className="flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left transition-all text-gray-600 hover:bg-gray-200">
                    <Tickets size={20} />
                    <span>Add Expense</span>
                  </button>
                </div>
              )}
            </div>

            {/* Other links */}
            {links
              .filter((link) => link.name !== "Admin")
              .map((link) => (
                <button
                  key={link.name}
                  onClick={() => setActiveLink(link.name)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md w-full text-left transition-all ${
                    sidebarMini ? "justify-center" : ""
                  } ${
                    activeLink === link.name
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {link.icon}
                  {!sidebarMini && <span>{link.name}</span>}
                </button>
              ))}
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
              <p className="text-gray-700 text-base font-semibold tracking-wide text-center">
                LGU Magallanes
              </p>
            )}
          </div>

          {/* Toggle Button */}
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

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto flex flex-col">
          <div className="bg-white rounded-xl shadow-md p-8 w-full flex-1 flex flex-col justify-center items-center">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
