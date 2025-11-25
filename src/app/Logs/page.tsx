"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("All");
  const [actorFilter, setActorFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  

  const [totalPages, setTotalPages] = useState(0);
  const currentItems = logs;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (filterType && filterType !== "All") params.set("type", filterType);
        if (actorFilter) params.set("actor", actorFilter);
        params.set("page", String(currentPage));
        params.set("limit", String(itemsPerPage));

        const res = await fetch(`/api/logs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load logs");
        const data = await res.json();
        if (!mounted) return;
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };

    fetchLogs();
    return () => {
      mounted = false;
    };
  }, [searchTerm, filterType, actorFilter, currentPage]);

  return (
    <div className="w-full p-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Logs</h1>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
                placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          >
            <option value="All">All Types</option>
            <option value="Budget">Budget</option>
            <option value="Disbursement">Disbursement</option>
            <option value="Expense">Expense</option>
            <option value="Office">Office</option>
          </select>
          {/* Actor filter (text) */}
          
        </div>
      </div>

      <hr className="border-gray-300 mt-4 mb-6" />

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
        <div className="flex-grow overflow-y-auto">
          <table className="min-w-full border-collapse">
            <thead
              className="text-white border-b bg-cover bg-center"
              style={{ backgroundImage: "url('/img/blue.jpg')" }}
            >
              <tr>
                <th className="px-6 py-2 text-left font-semibold border-b border-gray-300">Notification ID</th>
                <th className="px-6 py-2 text-left font-semibold border-b border-gray-300">Message</th>
                <th className="px-6 py-2 text-left font-semibold border-b border-gray-300">Date Created</th>
                <th className="px-3 py-2 text-left font-semibold border-b border-gray-300">User</th>
                <th className="px-3 py-2 text-center font-semibold border-b border-gray-300">Action</th>
                <th className="px-3 py-2 text-center font-semibold border-b border-gray-300">Type</th>
              </tr>
            </thead>

            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-gray-500 italic text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img src="/img/logs.png" alt="No data" className="mb-2 max-w-[200px]" />
                      <span>No logs found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-200">
                    <td className="px-6 py-3 text-gray-700">{log.id}</td>
                    <td className="px-6 py-3 text-gray-700">{log.message}</td>
                    <td className="px-6 py-3 text-gray-700">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-700">{log.performedBy || '-'}</td>
                    <td className="px-6 py-3 text-center">{log.action}</td>
                    <td className="px-6 py-3 text-center">{log.type}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="border-t border-gray-200 p-2 bg-gray-50">
          <div className="flex justify-end">
            <ul className="inline-flex -space-x-px text-sm">
              <li>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 border border-gray-300 rounded-l-lg hover:bg-gray-100 ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Previous
                </button>
              </li>

              {[...Array(totalPages)].map((_, index) => (
                <li key={index}>
                  <button
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-2 border border-gray-300 hover:bg-gray-100 ${
                      currentPage === index + 1 ? "bg-blue-500 text-white" : "text-gray-700"
                    }`}
                    >
                    {index + 1}
                  </button>
                </li>
              ))}

              <li>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 border border-gray-300 rounded-r-lg hover:bg-gray-100 ${
                    currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Next
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
