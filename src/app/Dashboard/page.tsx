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

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // === FETCH OFFICES ===
  const fetchOffices = async () => {
    try {
      const res = await fetch("/api/offices");
      const data = await res.json();
      setStats((prev) => ({ ...prev, offices: data.length }));
    } catch (error) {
      console.error("Failed to fetch offices:", error);
    }
  };

  // === FETCH BUDGETS (TOTAL PS/MOOE/CO) ===
  const fetchBudgets = async () => {
    try {
      const res = await fetch("/api/addbudget");
      const data: Budget[] = await res.json();

      const totalPS = data.reduce((sum, b) => sum + (b.ps || 0), 0);
      const totalMOOE = data.reduce((sum, b) => sum + (b.mooe || 0), 0);
      const totalCO = data.reduce((sum, b) => sum + (b.co || 0), 0);

      setStats((prev) => ({
        ...prev,
        totalBudget: { ps: totalPS, mooe: totalMOOE, co: totalCO },
      }));
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
    }
  };

  // === FETCH DISBURSEMENTS (ACTUAL EXPENDITURE) ===
  const fetchDisbursements = async () => {
    try {
      const res = await fetch("/api/disbursement");
      const data: Disbursement[] = await res.json();

      const totalExpenditure = data.reduce(
        (sum, d) => sum + (d.amount || 0),
        0
      );

      setStats((prev) => ({ ...prev, totalExpenditure }));
    } catch (error) {
      console.error("Failed to fetch disbursements:", error);
    }
  };

  // === FETCH EXPENSES ===
  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data: Expense[] = await res.json();
      setExpenses(data);

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

  // === UPDATE CHART WHENEVER STATS CHANGE ===
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

  useEffect(() => {
    fetchOffices();
    fetchBudgets();
    fetchExpenses();
    fetchDisbursements(); // ✅ fetch actual expenditure
  }, []);

  const COLORS = ["#2563eb", "#22c55e", "#f59e0b"];

  const currency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  const totalBudgetSum =
    stats.totalBudget.ps + stats.totalBudget.mooe + stats.totalBudget.co;

  return (
    <div className="space-y-8">
      {/* === TOP CARDS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Offices */}
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md">
            <div className="flex flex-col justify-center h-full">
              <p className="text-3xl font-semibold">{stats.offices}</p>
              <p className="text-sm text-white/80 mt-1">Number of Offices</p>
            </div>

            {/* Colored round icon container */}
            <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-blue-500/80 p-3 rounded-full shadow-lg">
              <Building2 size={32} className="text-white" />
            </div>
          </div>


        {/* Expense Types */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md">
          <div className="flex flex-col justify-center h-full">
            <p className="text-3xl font-semibold">{stats.expenseTypes}</p>
            <p className="text-sm text-white/80 mt-1">Number of Expense Types</p>
          </div>
          <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-green-500/80 p-3 rounded-full">
            <BarChart3 size={32} className="text-white" />
          </div>
        </div>

        {/* Total Budget */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md">
          <div className="flex flex-col justify-center h-full">
            <p className="text-2xl font-semibold">{currency(totalBudgetSum)}</p>
            <p className="text-sm text-white/80 mt-1">Overall Total Budget</p>
          </div>
          <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-orange-500/80 p-3 rounded-full">
            <Wallet size={32} className="text-white" />
          </div>
        </div>

        {/* Actual Expenditure */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl p-6 relative overflow-hidden shadow-md">
          <div className="flex flex-col justify-center h-full">
            <p className="text-2xl font-semibold">
              {currency(stats.totalExpenditure)}
            </p>
            <p className="text-sm text-white/80 mt-1">Actual Expenditure</p>
          </div>
          <div className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-violet-500/80 p-3 rounded-full">
            <PieChart size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* === PIE CHART === */}
      <div className="bg-white rounded-xl shadow p-6">
  <h3 className="text-lg font-semibold mb-4 text-gray-700">
    Budget Appropriation - Actual Expenditure = Variance
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
  label={({ name, value }) =>
    `${name}: ₱${Number(value || 0).toLocaleString()}`
  }
>
  {chartData.map((entry, index) => (
    <Cell
      key={`cell-${index}`}
      fill={COLORS[index % COLORS.length]}
    />
  ))}
</Pie>
<Tooltip formatter={(value: number) => `₱${Number(value || 0).toLocaleString()}`} />

        <Legend />
      </RePieChart>
    </ResponsiveContainer>
  </div>
</div>

    </div>
  );
}
