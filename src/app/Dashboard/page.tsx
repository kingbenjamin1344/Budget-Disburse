"use client";

import { useEffect, useState } from "react";
import { Building2, Wallet, BarChart3, PieChart } from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer, BarChart, XAxis, YAxis, Bar, LabelList
} from "recharts";

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
          <img
            src="/img/disburse.png"
            alt="No data"
            className="mb-2 max-w-[200px] h-auto object-contain"
          />
          <span>No disbursement records yet.</span>
        </div>
      )}
    </div>
  </div>

{/* === BUDGET ALLOCATION BY CATEGORY (VERTICAL BAR CHART WITH LABELS) === */}
<div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
  <h3 className="text-lg font-semibold mb-4 text-gray-700">
    Budget Allocation by Category
  </h3>

  {totalBudgetSum === 0 ? (
    <div className="py-6 text-gray-500 italic flex flex-col items-center justify-center">
      <img
        src="/img/disburse.png"
        alt="No data"
        className="mb-2 max-w-[200px] h-auto object-contain"
      />
      <span>No budget data available.</span>
    </div>
  ) : (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={categoryData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => currency(value as number)} />
          <Bar dataKey="value">
            {categoryData.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  index === 0
                    ? "#2563eb" // PS
                    : index === 1
                    ? "#16a34a" // MOOE
                    : "#f97316" // CO
                }
              />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(value) => currency(value as number)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</div>



  {/* === PIE CHART === */}
  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
    <h3 className="text-lg font-semibold mb-4 text-gray-700">
      Budget Appropriation - Actual Expenditure = Variance
    </h3>

    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label={({  value }) =>
              `₱${Number(value || 0).toLocaleString()}`
            }
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              `₱${Number(value || 0).toLocaleString()}`
            }
          />
          <Legend />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  </div>




{/* === RECENT LOGS FULL-WIDTH CARD === */}
<div className="col-span-full w-full">
  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 w-full">

    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
        <span className="bg-blue-100 p-2 rounded-full border border-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </span>
        Recent Logs
      </h3>

      <a
        href="/Logs"
        className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline"
      >
        View All Logs
      </a>
    </div>

    {/* FULL WIDTH TABLE - COMPACT HEIGHT */}
    <div className="overflow-x-auto w-full max-h-[360px] overflow-y-hidden rounded-lg">
      <table className="w-full min-w-max border-collapse">
        <thead
          className="text-white border-b bg-cover bg-center"
          style={{ backgroundImage: "url('/img/blue.jpg')" }}
        >
          <tr>
            <th className="px-2 py-2 text-center font-semibold border-b border-gray-300">Log Type</th>
            <th className="px-2 py-2 text-center font-semibold border-b border-gray-300">Action</th>
            <th className="px-4 py-2 text-left font-semibold border-b border-gray-300">Message</th>
            <th className="px-4 py-2 text-left font-semibold border-b border-gray-300">Date Created</th>
          </tr>
        </thead>

        <tbody>
          {recentLogs.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-5 text-gray-500 italic text-center">
                <div className="flex flex-col items-center justify-center">
                  <img src="/img/logs.png" alt="No data" className="mb-1 max-w-[150px]" />
                  <span>No recent logs.</span>
                </div>
              </td>
            </tr>
          ) : (
            recentLogs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-gray-200">
                <td className="px-4 py-2 text-center text-sm">{log.type}</td>

                <td className="px-4 py-2 text-center text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold border-2 ${
                      log.action?.toLowerCase() === "create"
                        ? "bg-green-200 border-green-700"
                        : log.action?.toLowerCase() === "delete"
                        ? "bg-red-200 border-red-700"
                        : log.action?.toLowerCase() === "update"
                        ? "bg-blue-200 border-blue-700"
                        : "bg-gray-300 border-gray-600"
                    }`}
                  >
                    {log.action?.charAt(0).toUpperCase() + log.action?.slice(1)}
                  </span>
                </td>

                <td className="px-4 py-2 text-gray-700 text-sm">{log.message}</td>

                <td className="px-4 py-2 text-gray-700 text-sm">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

  </div>
</div>




      </div>
    </div>
  );
}
