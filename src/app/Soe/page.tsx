"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Printer, Minimize2, Maximize2 } from "lucide-react";

export default function SoePage() {
  const [isCompressed, setIsCompressed] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to format numbers as Philippine Peso
  const formatPeso = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const toggleCompress = () => {
    const layout = document.getElementById("dashboard-layout");
    const sidebar = document.getElementById("sidebar");
    const navbar = document.getElementById("navbar");
    const mainContent = document.getElementById("main-content");

    if (!layout || !sidebar || !navbar || !mainContent) return;

    if (!isCompressed) {
      sidebar.style.display = "none";
      navbar.style.display = "none";
      mainContent.style.padding = "0";
      layout.style.height = "100vh";
      layout.style.background = "white";
    } else {
      sidebar.style.display = "";
      navbar.style.display = "";
      mainContent.style.padding = "1.5rem";
      layout.style.height = "";
      layout.style.background = "";
    }

    setIsCompressed(!isCompressed);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [budgetRes, disbRes] = await Promise.all([
          fetch("/api/addbudget"),
          fetch("/api/disbursement"),
        ]);

        const budgetData = await budgetRes.json();
        const disbData = await disbRes.json();

        const calculateTotals = (office: string, category: string) => {
          if (!office || !category) return 0;
          return disbData
            .filter(
              (d: any) =>
                d.office?.toLowerCase() === office.toLowerCase() &&
                d.expenseCategory?.toLowerCase() === category.toLowerCase()
            )
            .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
        };

        const merged = budgetData.map((b: any) => {
          const psActual = calculateTotals(b.office, "PS");
          const mooeActual = calculateTotals(b.office, "MOOE");
          const coActual = calculateTotals(b.office, "CO");
          const totalActual = psActual + mooeActual + coActual;

          const psVariance = (b.ps || 0) - psActual;
          const mooeVariance = (b.mooe || 0) - mooeActual;
          const coVariance = (b.co || 0) - coActual;
          const totalVariance = (b.total || 0) - totalActual;

          return {
            office: b.office,
            budget: {
              ps: b.ps || 0,
              mooe: b.mooe || 0,
              co: b.co || 0,
              total: b.total || 0,
            },
            actual: {
              ps: psActual,
              mooe: mooeActual,
              co: coActual,
              total: totalActual,
            },
            variance: {
              ps: psVariance,
              mooe: mooeVariance,
              co: coVariance,
              total: totalVariance,
            },
          };
        });

        setData(merged);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      {/* Header */}
      <div className="flex justify-end mb-6 space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
        >
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
              <Maximize2 className="w-4 h-4 mr-2" /> Decompress
            </>
          ) : (
            <>
              <Minimize2 className="w-4 h-4 mr-2" /> Compress
            </>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm transition-all duration-300">
        <table className="min-w-full border-collapse border border-gray-300 text-sm text-center">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th rowSpan={2} className="px-4 py-2 border border-gray-300 align-middle">
                Office
              </th>
              <th colSpan={4} className="px-4 py-2 border border-gray-300">
                Budget Appropriation
              </th>
              <th colSpan={4} className="px-4 py-2 border border-gray-300">
                Actual Expenditure
              </th>
              <th colSpan={4} className="px-4 py-2 border border-gray-300">
                Variance
              </th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-300">
              {["PS", "MOOE", "CO", "Total"].map((h) => (
                <th key={h} className="px-3 py-2 border border-gray-300">
                  {h}
                </th>
              ))}
              {["PS", "MOOE", "CO", "Total"].map((h) => (
                <th key={h} className="px-3 py-2 border border-gray-300">
                  {h}
                </th>
              ))}
              {["PS", "MOOE", "CO", "Total"].map((h) => (
                <th key={h} className="px-3 py-2 border border-gray-300">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="py-6 text-gray-500 italic">
                  Loading data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr className="h-48">
                <td colSpan={13} className="text-gray-500 italic p-0">
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <img
                      src="/img/add.png"
                      alt="No data"
                      className="mb-2 max-w-[200px] h-auto object-contain"
                    />
                    <span>No disbursement records found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-medium">{row.office}</td>
                  <td className="border border-gray-300 px-3 py-2">{formatPeso(row.budget.ps)}</td>
                  <td className="border border-gray-300 px-3 py-2">{formatPeso(row.budget.mooe)}</td>
                  <td className="border border-gray-300 px-3 py-2">{formatPeso(row.budget.co)}</td>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">{formatPeso(row.budget.total)}</td>

                  <td className="border border-gray-300 px-3 py-2">{formatPeso(row.actual.ps)}</td>
                  <td className="border border-gray-300 px-3 py-2">{formatPeso(row.actual.mooe)}</td>
                  <td className="border border-gray-300 px-3 py-2">{formatPeso(row.actual.co)}</td>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">{formatPeso(row.actual.total)}</td>

                  <td className="border border-gray-300 px-3 py-2 text-red-600">{formatPeso(row.variance.ps)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-red-600">{formatPeso(row.variance.mooe)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-red-600">{formatPeso(row.variance.co)}</td>
                  <td className="border border-gray-300 px-3 py-2 font-bold text-red-600">{formatPeso(row.variance.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
