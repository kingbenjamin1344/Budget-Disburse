"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { Building2, Wallet, BarChart3, PieChart } from "lucide-react";
import { ChartSkeleton, CardGridSkeleton, TableSkeleton } from "@/components/LoadingFallback";
import { PieChartComponent, BarChartComponent } from "@/components/DashboardCharts";

// --- TYPES ---
type Expense = {
  id: number;
  type: string;
  category: "PS" | "MOOE" | "CO";
  dateCreated: string;
};

type Budget = {
  id: number;
  office: string;
  ps: number;
  mooe: number;
  co: number;
  total: number;
  dateCreated: string;
};

type Disbursement = {
  id: number;
  amount: number;
};

type OfficeBudget = {
  office: string;
  total: number;
};

// --- DASHBOARD PAGE ---
export default function DashboardPage() {
  const [stats, setStats] = useState({
    offices: 0,
    totalBudget: { ps: 0, mooe: 0, co: 0 },
    totalExpenditure: 0,
    expenseTypes: 0,
    expenseCounts: { ps: 0, mooe: 0, co: 0 },
  });

  const [chartData, setChartData] = useState([
    { name: "Budget Appropriation", value: 0 },
    { name: "Actual Expenditure", value: 0 },
    { name: "Variance", value: 0 },
  ]);
  const categoryData = [
  { name: "PS", value: stats.totalBudget.ps },
  { name: "MOOE", value: stats.totalBudget.mooe },
  { name: "CO", value: stats.totalBudget.co },
];

  const [officeBudgets, setOfficeBudgets] = useState<OfficeBudget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // === RECENT LOGS ===
type Log = {
  id: number;
  type: string;
  action: string;
  message: string;
  createdAt: string;
};

const [recentLogs, setRecentLogs] = useState<Log[]>([]);

const fetchRecentLogs = async () => {
  try {
    const res = await fetch("/api/logs?limit=4&page=1");
    const data = await res.json();
    setRecentLogs(data.logs);
  } catch (error) {
    console.error("Failed to fetch logs:", error);
  }
};


  // === UPDATE PIE CHART WHENEVER STATS CHANGE ===
  useEffect(() => {
    const totalBudgetSum =
      stats.totalBudget.ps + stats.totalBudget.mooe + stats.totalBudget.co;
    const variance = totalBudgetSum - stats.totalExpenditure;

    setChartData([
      { name: "Budget Appropriation", value: totalBudgetSum },
      { name: "Actual Expenditure", value: stats.totalExpenditure },
      { name: "Variance", value: variance > 0 ? variance : 0 },
    ]);
  }, [stats.totalBudget, stats.totalExpenditure]);

  // === FETCH ALL DATA IN PARALLEL ===
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Make all requests in parallel instead of sequentially
        const [officesRes, budgetsRes, expensesRes, disbursementsRes, logsRes] = await Promise.all([
          fetch("/api/offices"),
          fetch("/api/addbudget"),
          fetch("/api/expenses"),
          fetch("/api/disbursement"),
          fetch("/api/logs?limit=4&page=1"),
        ]);

        if (officesRes.ok) {
          const data = await officesRes.json();
          setStats((prev) => ({ ...prev, offices: data.length }));
        }

        if (budgetsRes.ok) {
          const data = await budgetsRes.json();
          const totalPS = data.reduce((sum: number, b: any) => sum + (b.ps || 0), 0);
          const totalMOOE = data.reduce((sum: number, b: any) => sum + (b.mooe || 0), 0);
          const totalCO = data.reduce((sum: number, b: any) => sum + (b.co || 0), 0);
          const officeTotals = data.map((b: any) => ({
            office: b.office,
            total: b.total,
          }));
          setStats((prev) => ({
            ...prev,
            totalBudget: { ps: totalPS, mooe: totalMOOE, co: totalCO },
          }));
          setOfficeBudgets(officeTotals);
        }

        if (expensesRes.ok) {
          const data = await expensesRes.json();
          setExpenses(data);
          const psCount = data.filter((e: Expense) => e.category === "PS").length;
          const mooeCount = data.filter((e: Expense) => e.category === "MOOE").length;
          const coCount = data.filter((e: Expense) => e.category === "CO").length;
          setStats((prev) => ({
            ...prev,
            expenseTypes: data.length,
            expenseCounts: { ps: psCount, mooe: mooeCount, co: coCount },
          }));
        }

        if (disbursementsRes.ok) {
          const data = await disbursementsRes.json();
          const totalExpenditure = data.reduce(
            (sum: number, d: any) => sum + (d.amount || 0),
            0
          );
          setStats((prev) => ({ ...prev, totalExpenditure }));
        }

        if (logsRes.ok) {
          const data = await logsRes.json();
          setRecentLogs(data.logs);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    fetchAllData();
  }, []);

  const COLORS = ["#2563eb", "#22c55e", "#f59e0b"];

  const currency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  const maxTotal = Math.max(...officeBudgets.map((b) => b.total), 1);
  const totalBudgetSum =
    stats.totalBudget.ps + stats.totalBudget.mooe + stats.totalBudget.co;

  return (
    <div className="space-y-8">
      {/* === HEADER === */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard
        </h1>
      </div>     
    </div>
    {/* Divider line */}
<hr className="border-gray-300 mt-4 mb-6" />
      {/* === TOP CARDS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Offices */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md 
                        hover:shadow-xl hover:scale-105 transition transform duration-300 group">
          <div className="flex flex-col justify-center h-full">
            <p className="text-3xl font-semibold">{stats.offices}</p>
            <p className="text-sm text-white/80 mt-1">Number of Offices</p>
          </div>
          <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-blue-500/80 p-3 rounded-full shadow-lg 
                          transition-transform duration-300 group-hover:scale-125">
            <Building2 size={32} className="text-white" />
          </div>
        </div>

        {/* Expense Types */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md 
                        hover:shadow-xl hover:scale-105 transition transform duration-300 group">
          <div className="flex flex-col justify-center h-full">
            <p className="text-3xl font-semibold">{stats.expenseTypes}</p>
            <p className="text-sm text-white/80 mt-1">Number of Expense Types</p>
          </div>
          <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-green-500/80 p-3 rounded-full shadow-lg 
                          transition-transform duration-300 group-hover:scale-125">
            <BarChart3 size={32} className="text-white" />
          </div>
        </div>

        {/* Total Budget */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md 
                        hover:shadow-xl hover:scale-105 transition transform duration-300 group">
          <div className="flex flex-col justify-center h-full">
            <p className="text-2xl font-semibold">{currency(totalBudgetSum)}</p>
            <p className="text-sm text-white/80 mt-1">Overall Total Budget</p>
          </div>
          <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-orange-500/80 p-3 rounded-full shadow-lg 
                          transition-transform duration-300 group-hover:scale-125">
            <Wallet size={32} className="text-white" />
          </div>
        </div>

        {/* Actual Expenditure */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md 
                        hover:shadow-xl hover:scale-105 transition transform duration-300 group">
          <div className="flex flex-col justify-center h-full">
            <p className="text-2xl font-semibold">{currency(stats.totalExpenditure)}</p>
            <p className="text-sm text-white/80 mt-1">Actual Expenditure</p>
          </div>
          <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-violet-500/80 p-3 rounded-full shadow-lg 
                          transition-transform duration-300 group-hover:scale-125">
            <PieChart size={32} className="text-white" />
          </div>
        </div>
      </div>

    {/* === SIDE BY SIDE CHARTS === */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* === OFFICE BUDGET BAR CHART === */}
  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
    <h3 className="text-lg font-semibold mb-4 text-gray-700">
      Office-wise Budget Distribution
    </h3>

    <div className="space-y-3 max-h-60 overflow-y-auto">
      {officeBudgets.map((b, index) => {
        const widthPercent = (b.total / maxTotal) * 100;
        return (
          <div key={index}>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium text-gray-700">{b.office}</span>
              <span className="text-gray-500">{currency(b.total)}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}

      {officeBudgets.length === 0 && (
        <div className="py-6 text-gray-500 italic flex flex-col items-center justify-center">
          <Image
            src="/img/disburse.png"
            alt="No data"
            width={200}
            height={200}
            className="mb-2 object-contain"
            loading="lazy"
          />
          <span>No disbursement records yet.</span>
        </div>
      )}
    </div>
  </div>

{/* === BUDGET ALLOCATION BY CATEGORY (VERTICAL BAR CHART WITH LABELS) === */}
<Suspense fallback={<ChartSkeleton />}>
  <BarChartComponent 
    categoryData={categoryData} 
    chartData={chartData}
    COLORS={COLORS}
    currency={currency}
  />
</Suspense>



  {/* === PIE CHART === */}
  <Suspense fallback={<ChartSkeleton />}>
    <PieChartComponent 
      chartData={chartData} 
      categoryData={categoryData}
      COLORS={COLORS}
      currency={currency}
    />
  </Suspense>




{/* === RECENT LOGS FULL-WIDTH CARD === */}





      </div>
    </div>
  );
}
