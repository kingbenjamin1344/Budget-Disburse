"use client";
import { useState } from "react";
import { Search, Plus } from "lucide-react";

export default function DisbursementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOffice, setFilterOffice] = useState("");
  const [filterExpense, setFilterExpense] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3; // for future dynamic pagination

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
        {/* Left: Filter and Search */}
        <div className="flex flex-col md:flex-row items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search disbursement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Filter: Office */}
          <select
            value={filterOffice}
            onChange={(e) => setFilterOffice(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          >
            <option value="">Sort by Office</option>
            {/* Options to be dynamically added later */}
          </select>

          {/* Filter: Expense Category */}
          <select
            value={filterExpense}
            onChange={(e) => setFilterExpense(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          >
            <option value="">Sort by Expense Category</option>
            {/* Options to be dynamically added later */}
          </select>

          {/* Filter Button (optional for future functionality) */}
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
            Filter
          </button>
        </div>

        {/* Right: Record Disbursement */}
        <button className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition">
          <Plus className="w-4 h-4 mr-2" />
          Record Disbursement
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                DV No.
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                Payee
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                Office
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                Type of Expense
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                Category of Expense
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
            {/* Empty Table Message */}
            <tr>
              <td
                colSpan={7}
                className="text-center py-6 text-gray-500 italic"
              >
                No disbursement records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex justify-end mt-4">
        <nav aria-label="Page navigation">
          <ul className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <li>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1 text-gray-600 border-r border-gray-300 hover:bg-gray-100 transition block"
              >
                Previous
              </button>
            </li>

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
