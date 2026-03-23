"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, X, FileText, Tag, FolderOpen, Calendar, Clock, DollarSign, Briefcase } from "lucide-react";
import { toast } from "react-toastify";

export default function AddExpensePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [type, setType] = useState("");
  const [category, setCategory] = useState("PS");
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState("");
  const [editCategory, setEditCategory] = useState("PS");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState("");

  // Details modal
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [filterCategory, setFilterCategory] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Loading state for initial data load
  const [isLoading, setIsLoading] = useState(true);

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
    fetchExpenses().then(() => {
      setIsLoading(false);
    });
  }, []);

  const handleAddExpense = async () => {
    if (!type.trim() || !category.trim()) return toast.error("Please fill in both fields");
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
      toast.success("Expense created successfully");
    } else toast.error("Failed to add expense");
    setLoading(false);
  };

  const openDeleteModal = (expense: any) => {
    setDeleteId(expense.id);
    setDeleteType(expense.type);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId }),
    });
    setShowDeleteModal(false);
    setDeleteId(null);
    fetchExpenses();
    toast.success("Expense deleted successfully");
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setEditType(expense.type);
    setEditCategory(expense.category);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editType.trim() || !editCategory.trim()) return toast.error("Please fill in both fields");
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
      toast.success("Expense updated successfully");
    } else toast.error("Failed to update expense");
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Helper function to get category color
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'PS':
        return 'text-blue-400 bg-blue-500/20';
      case 'MOOE':
        return 'text-green-400 bg-green-500/20';
      case 'CO':
        return 'text-purple-400 bg-purple-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Helper function to get category full name
  const getCategoryFullName = (category: string) => {
    switch(category) {
      case 'PS':
        return 'Personnel Services';
      case 'MOOE':
        return 'Maintenance and Other Operating Expenses';
      case 'CO':
        return 'Capital Outlay';
      default:
        return category;
    }
  };

  return (
    <div className="w-full p-4 relative">
      {/* =================== Loading Screen =================== */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Animated Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin" />
            </div>
            <p className="text-white text-lg font-semibold">Loading...</p>
          </div>
        </div>
      )}
      
      {/* Apply blur to main content when loading */}
      <div className={`transition-all duration-300 ${isLoading ? "blur-sm" : ""}`}>
      {/* === HEADER WITH CONTROLS INLINE === */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Expense</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
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

          {/* Category Filter */}
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

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      <hr className="border-gray-300 mt-4 mb-6" />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
        <div className="flex-grow overflow-y-auto">
          <table className="min-w-full border-collapse">
            <thead
              className="text-white border-b bg-cover bg-center"
              style={{ backgroundImage: "url('/img/blue.jpg')" }}
            >
              <tr>
                <th className="px-6 py-2 text-left font-semibold border-b border-gray-300">Type of Expense</th>
                <th className="px-3 py-2 text-left font-semibold border-b border-gray-300">Category</th>
                <th className="px-3 py-2 text-left font-semibold border-b border-gray-300">Date Created</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-gray-500 italic text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Image 
                        src="/img/addexpense.png" 
                        alt="No data" 
                        width={200}
                        height={200}
                        className="mb-2 object-contain"
                        loading="lazy"
                      />
                      <span>No expense record found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((expense) => (
                  <tr key={expense.id} onClick={() => { setSelectedExpense(expense); setShowDetailsModal(true); }} className="border-b hover:bg-gray-200 cursor-pointer">
                    <td className="px-8 py-3 text-gray-700">{expense.type}</td>
                    <td className="px-8 py-3 text-gray-700">{expense.category}</td>
                    <td className="px-4 py-3 text-gray-700">{new Date(expense.dateCreated).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
            </nav>
          </div>
        </div>
      </div>

      {/* 🟩 Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-black opacity-10 pointer-events-auto"
            onClick={() => setShowAddModal(false)}
          ></div>

          <div
            className="bg-white rounded-xl shadow-lg w-[420px] overflow-hidden z-10 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1E3358] flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-white text-blue-600 p-2 rounded-full">
                  <Plus size={18} />
                </div>
                <h2 className="text-white text-lg font-semibold">Add Expense</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <input
                  type="text"
                  placeholder="Enter Type of Expense"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
                />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <label className="text-xs text-gray-500">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
                >
                  <option value="PS">Personnel Services (PS)</option>
                  <option value="MOOE">Maintenance of Office Expenditure (MOOE)</option>
                  <option value="CO">Capital Outlay (CO)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-4 py-3 bg-gray-50 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟩 Edit Expense Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-black opacity-10 pointer-events-auto"
            onClick={() => setShowEditModal(false)}
          ></div>

          <div
            className="bg-white rounded-xl shadow-lg w-[420px] overflow-hidden z-10 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1E3358] flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-white text-blue-600 p-2 rounded-full">
                  <Edit size={18} />
                </div>
                <h2 className="text-white text-lg font-semibold">Edit Expense</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <label className="text-xs text-gray-500">Type of Expense</label>
                <input
                  type="text"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
                />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <label className="text-xs text-gray-500">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
                >
                  <option value="PS">Personnel Services (PS)</option>
                  <option value="MOOE">Maintenance of Office Expenditure (MOOE)</option>
                  <option value="CO">Capital Outlay (CO)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-4 py-3 bg-gray-50 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟦 Expense Details Panel - Enhanced Modern UI (Same as Office Details) */}
      {showDetailsModal && selectedExpense && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay with blur effect */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300"
            onClick={() => setShowDetailsModal(false)}
          ></div>

          {/* Right-side Sliding Panel */}
          <aside
            className="ml-auto w-full sm:w-[600px] h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl overflow-hidden z-10 flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient accent */}
            <div className="relative bg-gradient-to-r from-blue-600 px-6 py-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white text-2xl font-bold tracking-tight">Expense Details</h2>
                    <p className="text-blue-100 text-sm mt-0.5">View and manage expense information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Body with enhanced design */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
              
              {/* Expense Type Card */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-xl">
                    <Tag className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      Type of Expense
                    </p>
                    <h3 className="text-white text-2xl font-bold leading-tight">
                      {selectedExpense.type}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Category Card with enhanced styling */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${getCategoryColor(selectedExpense.category)}`}>
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      Category
                    </p>
                    <div className="space-y-1">
                      <h3 className="text-white text-xl font-bold">
                        {selectedExpense.category}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {getCategoryFullName(selectedExpense.category)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Time Card */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500/20 p-3 rounded-xl">
                    <Calendar className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      Date & Time Created
                    </p>
                    <div className="space-y-2">
                      <p className="text-white font-medium">
                        {new Date(selectedExpense.dateCreated).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Clock size={14} />
                        <span>
                          {new Date(selectedExpense.dateCreated).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Timestamp Card */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/10 p-1.5 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">
                    Full Timestamp
                  </p>
                </div>
                <p className="text-white font-mono text-sm">
                  {new Date(selectedExpense.dateCreated).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>

              {/* Expense ID */}
             
            </div>

            {/* Footer with enhanced buttons */}
            <div className="flex justify-end gap-3 px-6 py-5 border-t border-white/10 bg-black/20 backdrop-blur-sm">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 font-semibold text-sm flex items-center gap-2"
              >
                <X size={16} />
                Close
              </button>

              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedExpense);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 font-semibold text-sm flex items-center gap-2 shadow-lg"
              >
                <Edit size={16} />
                Edit Expense
              </button>

              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openDeleteModal(selectedExpense);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 font-semibold text-sm flex items-center gap-2 shadow-lg"
              >
                <Trash2 size={16} />
                Delete Expense
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 🟥 Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="absolute inset-0 bg-black opacity-20 pointer-events-auto"
            onClick={() => setShowDeleteModal(false)}
          ></div>
          <div className="bg-white rounded-xl shadow-lg w-[420px] p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3 text-center text-red-600">Confirm Delete</h2>
            <p className="text-gray-700 text-center mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteType}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}