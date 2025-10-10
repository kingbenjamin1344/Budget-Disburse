"use client";
import Image from "next/image";
import { useState } from "react";
import { Home, FileText, LayoutDashboard, Menu, ChevronLeft, ChevronRight, AppWindowMac, HandCoins, Tickets, UserStar} from "lucide-react";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile toggle
  const [sidebarMini, setSidebarMini] = useState(false); // shrink toggle

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
      <header className="bg-white shadow-md h-16 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-gray-700 focus:outline-none"
          >
            <Menu />
          </button>
    
            



        </div>

        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-800">🔔</button>
          <button className="text-gray-600 hover:text-gray-800">👤</button>
        </div>
      </header>

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`relative fixed md:static z-20 top-16 left-0 h-full bg-white shadow-md p-4 flex flex-col transition-all duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            ${sidebarMini ? "w-20" : "w-64"}`}
        >
          {/* NAV LINKS */}
          <nav className="flex-1 space-y-2">
            {links.map((link) => (
              <a
                key={link.name}
                href="#"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 transition-all ${
                  sidebarMini ? "justify-center" : ""
                }`}
              >
                {link.icon}
                {!sidebarMini && <span>{link.name}</span>}
              </a>
            ))}
          </nav>

          {/* "HOLE EFFECT" TOGGLE BUTTON */}
          <div className="absolute top-1/2 -right-6 transform -translate-y-1/2">
            {/* Outer ring (creates the “hole”) */}
            <div className="relative w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
              {/* Blue toggle button */}
              <button
                onClick={() => setSidebarMini(!sidebarMini)}
                className="absolute w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition shadow-lg"
              >
                {sidebarMini ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
          </div>
        </aside>

        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto flex flex-col">
             <div className="bg-white rounded-xl shadow-md p-8 w-full flex-1 flex flex-col justify-center items-center">
              
             </div>
        </main>
      </div>
    </div>
  );
}
