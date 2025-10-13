"use client";
import { useEffect, useState } from "react";
import { Search, Plus, X } from "lucide-react";

export default function AddBudgetPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;

  // Budget data
  const [budgets, setBudgets] = useState<any[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // for editing

  // Inputs
  const [officeId, setOfficeId] = useState<number | "">("");
  const [ps, setPs] = useState<number>(0);
  const [mooe, setMooe] = useState<number>(0);
  const [co, setCo] = useState<number>(0);
  const [offices, setOffices] = useState<any[]>([]);

  const totalBudget = ps + mooe + co;

  // Fetch offices
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await fetch("/api/offices");
        const data = await res.json();
        setOffices(data);
      } catch (error) {
        console.error("Failed to fetch offices:", error);
      }
    };
    fetchOffices();
  }, []);

  // Add or Update budget
  const handleSaveBudget = () => {
    if (!officeId) return alert("Please select an office");

    const selectedOffice = offices.find((o) => o.id === officeId);
    const budgetData = {
      office: selectedOffice?.name,
      ps,
      mooe,
      co,
      total: totalBudget,
      dateCreated: new Date().toLocaleDateString(),
    };

    if (editingId !== null) {
      // Update
      setBudgets((prev) =>
        prev.map((b, i) => (i === editingId ? budgetData : b))
      );
    } else {
      // Add new
      setBudgets((prev) => [budgetData, ...prev]);
    }

    // Reset
    setOfficeId("");
    setPs(0);
    setMooe(0);
    setCo(0);
    setEditingId(null);
    setShowModal(false);
  };

  // Edit budget
  const handleEdit = (index: number) => {
    const budget = budgets[index];
    const office = offices.find((o) => o.name === budget.office);
    setOfficeId(office?.id || "");
    setPs(budget.ps);
    setMooe(budget.mooe);
    setCo(budget.co);
    setEditingId(index);
    setShowModal(true);
  };

  // Delete budget
  const handleDelete = (index: number) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    setBudgets((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          {editingId !== null ? "Edit Budget" : "Add Budget"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                List of Office
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                PS
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                MOOE
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                CO
              </th>
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
              budgets
                .filter((b) =>
                  b.office.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((budget, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-6 py-3 text-gray-700">{budget.office}</td>
                    <td className="px-6 py-3 text-gray-700">₱{budget.ps.toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-700">₱{budget.mooe.toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-700">₱{budget.co.toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-700 font-semibold">
                      ₱{budget.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{budget.dateCreated}</td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      <button
                        onClick={() => handleEdit(index)}
                        className="text-blue-500 hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingId !== null ? "Edit Budget" : "Add Budget"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Office Dropdown */}
            <select
              value={officeId}
              onChange={(e) => setOfficeId(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-md mb-3 focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="">Select Office</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>

            {/* Amounts */}
            <input
              type="number"
              placeholder="PS Amount"
              value={ps}
              onChange={(e) => setPs(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-md mb-3 focus:outline-none focus:ring focus:ring-blue-200"
            />
            <input
              type="number"
              placeholder="MOOE Amount"
              value={mooe}
              onChange={(e) => setMooe(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-md mb-3 focus:outline-none focus:ring focus:ring-blue-200"
            />
            <input
              type="number"
              placeholder="CO Amount"
              value={co}
              onChange={(e) => setCo(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-md mb-3 focus:outline-none focus:ring focus:ring-blue-200"
            />

            {/* Total */}
            <p className="mb-4 font-semibold">
              Total Budget Allocated: ₱{totalBudget.toLocaleString()}
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition"
              >
                {editingId !== null ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
