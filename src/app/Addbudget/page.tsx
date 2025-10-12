"use client";
import { useState } from "react";
import { Search, Plus } from "lucide-react";

export default function AddBudgetPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;

  // Placeholder data (for later database use)
  const budgets = []; // e.g., [{ office: "Mayor's Office", ps: 10000, mooe: 20000, co: 5000, total: 35000, dateCreated: "2025-10-11" }]

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        {/* Left: Search Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search office..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
            Search
          </button>
        </div>

        {/* Right: Add Budget Button */}
        <button className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition">
          <Plus className="w-4 h-4 mr-2" />
          Add Budget
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                List of Office
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">PS</th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">MOOE</th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">CO</th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                Total Budget Allocated
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                Date Created
              </th>
              <th className="px-6 py-3 text-center font-semibold border-b border-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500 italic">
                  No budget records found.
                </td>
              </tr>
            ) : (
              budgets.map((budget, index) => (
                <tr key={index} className="border-b">
                  <td className="px-6 py-3 text-gray-700">{budget.office}</td>
                  <td className="px-6 py-3 text-gray-700">{budget.ps}</td>
                  <td className="px-6 py-3 text-gray-700">{budget.mooe}</td>
                  <td className="px-6 py-3 text-gray-700">{budget.co}</td>
                  <td className="px-6 py-3 text-gray-700 font-semibold">
                    ₱{budget.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-gray-700">{budget.dateCreated}</td>
                  <td className="px-6 py-3 text-center text-gray-700">
                    <button className="text-blue-500 hover:underline">Edit</button>
                    <span className="mx-2">|</span>
                    <button className="text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex justify-end mt-4">
        <nav aria-label="Page navigation">
          <ul className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            {/* Previous Button */}
            <li>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1 text-gray-600 border-r border-gray-300 hover:bg-gray-100 transition block"
              >
                Previous
              </button>
            </li>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i}>
                <button
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border-r border-gray-300 ${
                    currentPage === i + 1
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-100 transition"
                  }`}
                >
                  {i + 1}
                </button>
              </li>
            ))}

            {/* Next Button */}
            <li>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition block"
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
