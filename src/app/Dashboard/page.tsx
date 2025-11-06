"use client";

import { useEffect, useState } from "react";
import { Building2, Wallet, BarChart3, PieChart } from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Expense = {
  id: number;
  type: string;
  category: "PS" | "MOOE" | "CO";
  dateCreated: string;
};

export default function DashboardPage() {
  // ---- DYNAMIC STATES ----
  const [stats, setStats] = useState({
    offices: 0,
    totalBudget: { ps: 0, mooe: 0, co: 0 },
    expenseTypes: 0,
    expenseCounts: { ps: 0, mooe: 0, co: 0 },
  });

  const [chartData, setChartData] = useState([
    { name: "Budget Appropriation", value: 0 },
    { name: "Actual Expenditure", value: 0 },
    { name: "Variance", value: 0 },
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // ---- FETCH DATA ----
  const fetchOffices = async () => {
    try {
      const res = await fetch("/api/offices");
      const data = await res.json();
      setStats((prev) => ({ ...prev, offices: data.length }));
    } catch (error) {
      console.error("Failed to fetch offices:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data: Expense[] = await res.json();
      setExpenses(data);

      // Count expense types
      const psCount = data.filter((e) => e.category === "PS").length;
      const mooeCount = data.filter((e) => e.category === "MOOE").length;
      const coCount = data.filter((e) => e.category === "CO").length;

      setStats((prev) => ({
        ...prev,
        expenseTypes: data.length,
        expenseCounts: { ps: psCount, mooe: mooeCount, co: coCount },
      }));
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    }
  };

  useEffect(() => {
    fetchOffices();
    fetchExpenses();
  }, []);

  // ---- DELETE EXPENSE ----
  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchExpenses(); // refresh after delete
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const COLORS = ["#2563eb", "#22c55e", "#f59e0b"];

  // ---- FORMAT HELPERS ----
  const currency = (val: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(val);

  return (
    <div className="space-y-8">
      {/* === TOP CARDS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Offices */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md">
  {/* Value and Label */}
  <div className="flex flex-col justify-center h-full">
    <p className="text-3xl font-semibold">{stats.offices}</p>
    <p className="text-sm text-white/80 mt-1">Number of Offices</p>
  </div>

  {/* Icon on the right */}
  <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-white/20 p-3 rounded-full">
    <Building2 size={32} className="text-white" />
  </div>


</div>

{/* Expense Types */}
<div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md">
  {/* Centered Value and Label */}
  <div className="flex flex-col justify-center h-full">
    <p className="text-3xl font-semibold">{stats.expenseTypes}</p>
    <p className="text-sm text-white/80 mt-1">Number of Expense Types</p>
  </div>

  {/* Icon on the right */}
  <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-white/20 p-3 rounded-full">
    <BarChart3 size={32} className="text-white" />
  </div>

  {/* Bottom badge */}
  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs text-white">
    <span className="text-green-400">▲</span> Updated Today
  </div>
</div>


        {/* Total Budget */}
        <div className="bg-white shadow rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-600 font-medium">Overall Total Budget</h2>
            <Wallet className="text-green-500" size={26} />
          </div>
          <div className="text-sm mt-2 text-gray-600">
            <p>PS: {currency(stats.totalBudget.ps)}</p>
            <p>MOOE: {currency(stats.totalBudget.mooe)}</p>
            <p>CO: {currency(stats.totalBudget.co)}</p>
            <hr className="my-1" />
            <p className="font-semibold text-gray-800">
              Total:{" "}
              {currency(
                stats.totalBudget.ps +
                  stats.totalBudget.mooe +
                  stats.totalBudget.co
              )}
            </p>
          </div>
        </div>




   

        {/* Chart Preview */}
        <div className="bg-white shadow rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-600 font-medium">SOE Overview</h2>
            <PieChart className="text-indigo-500" size={26} />
          </div>
          <p className="text-sm mt-3 text-gray-500">Chart from SOE</p>
        </div>
      </div>

      {/* === PIE CHART SECTION === */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Budget Appropriation vs Actual Expenditure vs Variance
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => currency(value)} />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      
    </div>
  );
}
