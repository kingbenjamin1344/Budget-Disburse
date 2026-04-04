// Lazy-loaded chart components for Dashboard
"use client";

import { useMemo } from "react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  LabelList,
} from "recharts";

interface Props {
  chartData: any[];
  categoryData: any[];
  COLORS: string[];
  currency: (val: number) => string;
}

export function PieChartComponent({ chartData, COLORS, currency }: Props) {
  // Get the relevant data from chartData
  const budgetAllocation = chartData[0]?.value || 0;
  const actualExpenditure = chartData[1]?.value || 0;
  const variance = chartData[2]?.value || 0;

  // Create pie data showing: Actual Expenditure (deducted from budget) and Variance (remaining)
  const pieData = [
    { name: "Actual Expenditure", value: actualExpenditure },
    { name: "Remaining Variance", value: variance },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">
        Budget Allocation Breakdown
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Total Budget: <span className="font-semibold text-gray-700">{currency(budgetAllocation)}</span>
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ value }) =>
                `₱${Number(value || 0).toLocaleString()}`
              }
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={index === 0 ? "#8b5cf6" : "#10b981"}
                />
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

      {/* Summary stats below pie chart */}
      <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Actual Expenditure</p>
          <p className="text-lg font-bold text-purple-600">
            {currency(actualExpenditure)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {budgetAllocation > 0
              ? `${((actualExpenditure / budgetAllocation) * 100).toFixed(1)}%`
              : "0%"}{" "}
            of budget
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Remaining Variance</p>
          <p className="text-lg font-bold text-green-600">
            {currency(variance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {budgetAllocation > 0
              ? `${((variance / budgetAllocation) * 100).toFixed(1)}%`
              : "0%"}{" "}
            of budget
          </p>
        </div>
      </div>
    </div>
  );
}

export function BarChartComponent({ categoryData, currency }: Props) {
  const totalBudgetSum = useMemo(
    () => categoryData.reduce((sum, d) => sum + d.value, 0),
    [categoryData]
  );

  if (totalBudgetSum === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Budget Allocation by Category
        </h3>
        <div className="py-6 text-gray-500 italic flex flex-col items-center justify-center">
          <img
            src="/img/disburse.png"
            alt="No data"
            className="mb-2 max-w-[200px] h-auto object-contain"
          />
          <span>No budget data available.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Budget Allocation by Category
      </h3>

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
    </div>
  );
}
