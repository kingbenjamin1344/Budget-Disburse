"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("All");
  const [actorFilter, setActorFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  const [totalPages, setTotalPages] = useState(0);
  const currentItems = logs;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Format message into a readable sentence for non-programmers
  const formatMessageAsSentence = (message: string): string => {
    if (!message) return "No details available";
    
    // Try to parse JSON if it's a JSON string
    try {
      const parsed = JSON.parse(message);
      
      // Handle old and new values - only show if they're different
      if (parsed.old !== undefined && parsed.new !== undefined) {
        if (String(parsed.old) === String(parsed.new)) {
          return "No changes were made";
        }
        return `${parsed.old} was changed to ${parsed.new}`;
      }
      
      // Handle multiple field changes
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const changes = Object.entries(parsed)
          .filter(([key, entry]: any) => {
            // Skip if it's an object with same old and new
            if (entry && entry.old !== undefined && entry.new !== undefined) {
              return String(entry.old) !== String(entry.new);
            }
            return true;
          })
          .map(([key, entry]: any) => {
            if (entry && entry.old !== undefined && entry.new !== undefined) {
              return `${key} from ${entry.old} to ${entry.new}`;
            }
            return `${key} set to ${entry}`;
          });
        
        if (changes.length === 0) return "No changes were made";
        if (changes.length === 1) return `Changed ${changes[0]}`;
        return `Changed: ${changes.join(", ")}`;
      }

      if (parsed.field && parsed.value) {
        return `${parsed.field} was set to ${parsed.value}`;
      }
    } catch (e) {
      // Not JSON, try to parse arrow format
    }

    // Parse arrow format: "field old_value -> new_value"
    if (message.includes("->")) {
      const parts = message.split(",").map((p) => p.trim());
      const changes: string[] = [];

      for (const part of parts) {
        // Match pattern: "field value -> value" or "office "value" -> "value""
        const arrowMatch = part.match(/^([^:]+):\s*(.+?)\s*->\s*(.+)$/);
        if (arrowMatch) {
          const [, field, oldVal, newVal] = arrowMatch;
          
          // Clean up quoted values
          const oldValClean = oldVal.trim().replace(/^"|"$/g, '');
          const newValClean = newVal.trim().replace(/^"|"$/g, '');
          
          // Only include if values are different
          if (oldValClean !== newValClean) {
            changes.push(`${field.trim()} from ${oldValClean} to ${newValClean}`);
          }
        } else {
          // Match pattern without field name: "value -> value"
          const simpleMatch = part.match(/^(.+?)\s*->\s*(.+)$/);
          if (simpleMatch) {
            const [, oldVal, newVal] = simpleMatch;
            const oldValClean = oldVal.trim().replace(/^"|"$/g, '');
            const newValClean = newVal.trim().replace(/^"|"$/g, '');
            
            if (oldValClean !== newValClean) {
              changes.push(`${oldValClean} changed to ${newValClean}`);
            }
          }
        }
      }

      if (changes.length === 0) return "No changes were made";
      if (changes.length === 1) return `Changed ${changes[0]}`;
      return `Changed: ${changes.join(", ")}`;
    }

    // If message is already in readable form, return as is
    return message;
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
               <th className="px-3 py-2 text-center font-semibold border-b border-gray-300">Log Type</th>
                <th className="px-3 py-2 text-center font-semibold border-b border-gray-300">Action</th>
                <th className="px-6 py-2 text-left font-semibold border-b border-gray-300">Message</th>
                <th className="px-6 py-2 text-left font-semibold border-b border-gray-300">Date Created</th>
              </tr>
            </thead>

            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-gray-500 italic text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Image 
                        src="/img/logs.png" 
                        alt="No data" 
                        width={200}
                        height={200}
                        className="mb-2 object-contain"
                        loading="lazy"
                      />
                      <span>No logs found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((log) => (
                  <tr key={log.id} onClick={() => { setSelectedLog(log); setShowDetailsPanel(true); }} className="border-b hover:bg-gray-200 cursor-pointer">

                   <td className="px-6 py-3 text-center">{log.type}</td>
<td className="px-6 py-3 text-center">
  <span
    className={`px-2 py-1 rounded-full text-gray text-sm font-semibold border-2 ${
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



                    <td className="px-6 py-3 text-gray-700">{log.message}</td>
                    <td className="px-6 py-3 text-gray-700">{new Date(log.createdAt).toLocaleString()}</td>
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

      {/* 🟦 Log Details Sidebar Panel */}
      {showDetailsPanel && selectedLog && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDetailsPanel(false)}
          ></div>

          {/* Right-side Sliding Panel */}
          <aside
            className="ml-auto w-full sm:w-[520px] h-full bg-[#0F2544] shadow-xl overflow-hidden z-10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
              <h2 className="text-white text-2xl font-bold">Log Details</h2>
              <button
                onClick={() => setShowDetailsPanel(false)}
                className="text-white hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 text-white flex-1 overflow-y-auto">

              {/* Log Type */}
              <div className="text-center">
                <div className="text-sm text-blue-200 uppercase tracking-wide">
                  Log Type
                </div>
                <div className="text-2xl font-bold mt-1">
                  {selectedLog.type}
                </div>
              </div>

              <hr className="border-white/20" />

              {/* Action */}
              <div className="flex justify-between items-center">
                <span className="text-blue-200">
                  Action Performed
                </span>
                <span className={`px-3 py-1 rounded-full font-semibold text-sm ${
                  selectedLog.action?.toLowerCase() === "create"
                    ? "bg-green-500 text-white"
                    : selectedLog.action?.toLowerCase() === "delete"
                    ? "bg-red-500 text-white"
                    : selectedLog.action?.toLowerCase() === "update"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-500 text-white"
                }`}>
                  {selectedLog.action?.charAt(0).toUpperCase() + selectedLog.action?.slice(1)}
                </span>
              </div>

              <hr className="border-white/20" />

              {/* Message */}
              <div>
                <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">
                  What Changed
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-4 text-base text-blue-50 leading-relaxed border border-blue-400/30">
                  {formatMessageAsSentence(selectedLog.message)}
                </div>
              </div>

              <hr className="border-white/20" />

              {/* Date & Time */}
              <div className="text-center">
                <div className="text-sm text-blue-200 uppercase tracking-wide">
                  Date & Time Created
                </div>
                <div className="font-semibold mt-1">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Actor/User Info if available */}
              {selectedLog.actor && (
                <>
                  <hr className="border-white/20" />
                  <div>
                    <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">
                      Changed By
                    </div>
                    <div className="text-lg font-semibold">
                      {selectedLog.actor}
                    </div>
                  </div>
                </>
              )}

              {/* Related Resource if available */}
              {selectedLog.relatedId && (
                <>
                  <hr className="border-white/20" />
                  <div>
                    <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">
                      Related Item ID
                    </div>
                    <div className="break-all text-sm bg-white/10 rounded-lg p-3 font-mono">
                      {selectedLog.relatedId}
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Footer */}
            <div className="mt-auto flex justify-end gap-3 px-6 py-4 border-t border-white/20 bg-[#0F2544]">
              <button
                onClick={() => setShowDetailsPanel(false)}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
