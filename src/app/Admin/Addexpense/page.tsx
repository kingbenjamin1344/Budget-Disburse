"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";

export default function AddExpensePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [type, setType] = useState("");
  const [category, setCategory] = useState("PS");
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState("");
  const [editCategory, setEditCategory] = useState("PS");

  // ✅ Category filter state
  const [filterCategory, setFilterCategory] = useState("All");

  // 🟩 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async () => {
    if (!type.trim() || !category.trim()) return alert("Please fill in both fields");

    setLoading(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, category }),
    });

    if (res.ok) {
      setType("");
      setCategory("PS");
      setShowAddModal(false);
      fetchExpenses();
    } else {
      alert("Failed to add expense");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchExpenses();
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setEditType(expense.type);
    setEditCategory(expense.category);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editType.trim() || !editCategory.trim()) return alert("Please fill in both fields");

    const res = await fetch("/api/expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        type: editType,
        category: editCategory,
      }),
    });

    if (res.ok) {
      setShowEditModal(false);
      setEditingId(null);
      fetchExpenses();
    } else alert("Failed to update expense");
  };

  // ✅ Apply both search + category filter
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // 🟩 Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="w-full">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expense..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          {/* ✅ Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          >
            <option value="All">All Categories</option>
            <option value="PS">Personnel Services (PS)</option>
            <option value="MOOE">Maintenance of Office Expenditure (MOOE)</option>
            <option value="CO">Capital Outlay (CO)</option>
          </select>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col ">
        {/* Table content */}
        <div className="flex-grow overflow-y-auto">
          <table className="min-w-full border-collapse">
            <thead
              className="bg-gray-100 text-gray-700 border-b text-white border-b bg-cover bg-center"
              style={{ backgroundImage: "url('/img/blue.jpg')" }}
            >
              <tr>
                <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                  Type of Expense
                </th>
                <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                  Category
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
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-gray-500 italic">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src="/img/addexpense.png"
                        alt="No data"
                        className="mb-2 max-w-[200px] h-auto object-contain"
                      />
                      <span>No expense record found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-200">
                    <td className="px-6 py-3 text-gray-700">{expense.type}</td>
                    <td className="px-6 py-3 text-gray-700">{expense.category}</td>
                    <td className="px-6 py-3 text-gray-700">
                      {new Date(expense.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-2 text-center text-gray-700">
                      <div className="px-6 py-2 text-center space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 🟩 Pagination Bar */}
        <div className="border-t border-gray-200 p-2 bg-gray-50">
          <div className="flex justify-end">
            <nav aria-label="Page navigation">
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
                        currentPage === index + 1
                          ? "bg-blue-500 text-white"
                          : "text-gray-700"
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
                      currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* ✅ Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3 text-center">Add Expense</h2>
            <input
              type="text"
              placeholder="Type of Expense"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border px-3 py-2 rounded-md mb-3 focus:outline-none focus:ring focus:ring-blue-200"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border px-3 py-2 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="PS">Personnel Services (PS)</option>
              <option value="MOOE">Maintenance of Office Expenditure (MOOE)</option>
              <option value="CO">Capital Outlay (CO)</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition"
              >
                {loading ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Edit Expense Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3 text-center">Edit Expense</h2>
            <input
              type="text"
              placeholder="Type of Expense"
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              className="w-full border px-3 py-2 rounded-md mb-3 focus:outline-none focus:ring focus:ring-blue-200"
            />
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full border px-3 py-2 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="PS">Personnel Services (PS)</option>
              <option value="MOOE">Maintenance of Office Expenditure (MOOE)</option>
              <option value="CO">Capital Outlay (CO)</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
