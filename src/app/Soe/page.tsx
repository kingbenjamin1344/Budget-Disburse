"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Printer, Minimize2, Maximize2 } from "lucide-react";

export default function SoePage() {
  const [isCompressed, setIsCompressed] = useState(false);

  const toggleCompress = () => {
    const layout = document.getElementById("dashboard-layout");
    const sidebar = document.getElementById("sidebar");
    const navbar = document.getElementById("navbar");
    const mainContent = document.getElementById("main-content");

    if (!layout || !sidebar || !navbar || !mainContent) return;

    if (!isCompressed) {
      // Enter fullscreen
      sidebar.style.display = "none";
      navbar.style.display = "none";
      mainContent.style.padding = "0";
      layout.style.height = "100vh";
      layout.style.background = "white";
    } else {
      // Exit fullscreen
      sidebar.style.display = "";
      navbar.style.display = "";
      mainContent.style.padding = "1.5rem";
      layout.style.height = "";
      layout.style.background = "";
    }

    setIsCompressed(!isCompressed);
  };

  // Cleanup on page leave
  useEffect(() => {
    return () => {
      const sidebar = document.getElementById("sidebar");
      const navbar = document.getElementById("navbar");
      const mainContent = document.getElementById("main-content");
      const layout = document.getElementById("dashboard-layout");

      if (sidebar && navbar && mainContent && layout) {
        sidebar.style.display = "";
        navbar.style.display = "";
        mainContent.style.padding = "";
        layout.style.height = "";
        layout.style.background = "";
      }
    };
  }, []);

  return (
    <div className="w-full transition-all duration-300">
      {/* Header Section */}
      <div className="flex justify-end mb-6 space-x-3">
        <button className="flex items-center bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Data
        </button>

        <button className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
          <Printer className="w-4 h-4 mr-2" />
          Print Details
        </button>

        <button
          onClick={toggleCompress}
          className="flex items-center bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
        >
          {isCompressed ? (
            <>
              <Maximize2 className="w-4 h-4 mr-2" />
              Decompress
            </>
          ) : (
            <>
              <Minimize2 className="w-4 h-4 mr-2" />
              Compress
            </>
          )}
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm transition-all duration-300">
        <table className="min-w-full border-collapse border border-gray-300 text-sm text-center">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th rowSpan={2} className="px-4 py-2 border border-gray-300 align-middle">
                Office
              </th>
              <th colSpan={3} className="px-4 py-2 border border-gray-300">
                Budget Appropriation
              </th>
              <th colSpan={3} className="px-4 py-2 border border-gray-300">
                Actual Expenditure
              </th>
              <th colSpan={4} className="px-4 py-2 border border-gray-300">
                Variance
              </th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="px-3 py-2 border border-gray-300">PS</th>
              <th className="px-3 py-2 border border-gray-300">MOOE</th>
              <th className="px-3 py-2 border border-gray-300">CO</th>
              <th className="px-3 py-2 border border-gray-300">PS</th>
              <th className="px-3 py-2 border border-gray-300">MOOE</th>
              <th className="px-3 py-2 border border-gray-300">CO</th>
              <th className="px-3 py-2 border border-gray-300">PS</th>
              <th className="px-3 py-2 border border-gray-300">MOOE</th>
              <th className="px-3 py-2 border border-gray-300">CO</th>
              <th className="px-3 py-2 border border-gray-300">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={11} className="py-6 text-gray-500 italic">
                No data available.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
