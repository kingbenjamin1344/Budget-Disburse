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
  return (
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
              label={({ value }) =>
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
