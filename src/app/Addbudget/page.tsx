"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Search, Plus, X, Edit, Trash2, LockKeyhole, Building2, Calendar, Clock, DollarSign, TrendingUp, PieChart, FileText } from "lucide-react";

export default function AddBudgetPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [budgets, setBudgets] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [officeId, setOfficeId] = useState<number | "">("");
  const [ps, setPs] = useState<string>("");
  const [mooe, setMooe] = useState<string>("");
  const [co, setCo] = useState<string>("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // Details modal
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const totalBudget =
    (parseFloat(ps) || 0) + (parseFloat(mooe) || 0) + (parseFloat(co) || 0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Loading state for initial data load
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const res = await fetch("/api/addbudget");
        const data = await res.json();
        setBudgets(data);
      } catch (error) {
        console.error("Failed to fetch budgets:", error);
      }
    };

    const fetchOffices = async () => {
      try {
        const res = await fetch("/api/offices");
        const data = await res.json();
        setOffices(data);
      } catch (error) {
        console.error("Failed to fetch offices:", error);
      }
    };

    Promise.all([fetchBudgets(), fetchOffices()]).then(() => {
      setIsLoading(false);
    });
  }, []);

  const handleSaveBudget = async () => {
    if (!officeId) return toast.error("Please select an office");

    const selectedOffice = offices.find((o) => o.id === officeId);
    
    if (!selectedOffice) {
      return toast.error("Selected office not found");
    }

    if (
      editingId === null &&
      budgets.some((b) => b.office === selectedOffice?.name)
    ) {
      return toast.error("This office already has a budget allocated.") as any;
    }

    const isEditing = editingId !== null;
    const budgetData: any = {
      office: selectedOffice.name,
      ps: parseFloat(ps) || 0,
      mooe: parseFloat(mooe) || 0,
      co: parseFloat(co) || 0,
      total: totalBudget,
    };

    // Only include ID for PUT requests
    if (isEditing) {
      budgetData.id = budgets[editingId]?.id;
    }

    try {
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/addbudget", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData),
      });

      const data = await res.json();
      console.log("🔍 AddBudget API Response:", { status: res.status, data, ok: res.ok });
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setShowModal(false);
      setEditingId(null);
      setOfficeId("");
      setPs("");
      setMooe("");
      setCo("");

      const refreshed = await fetch("/api/addbudget");
      const refreshedData = await refreshed.json();
      setBudgets(refreshedData);
      toast.success(editingId !== null ? "Budget updated successfully" : "Budget created successfully");
    } catch (error) {
      toast.error("Failed to save budget");
      console.error(error);
    }
  };

  const handleEdit = (index: number) => {
    const budget = budgets[index];
    const office = offices.find((o) => o.name === budget.office);
    setOfficeId(office?.id || "");
    setPs(String(budget.ps));
    setMooe(String(budget.mooe));
    setCo(String(budget.co));
    setEditingId(index);
    setShowModal(true);
  };

  const handleDeleteClick = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteIndex === null) return;
    const budget = budgets[deleteIndex];

    try {
      const res = await fetch("/api/addbudget", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: budget.id }),
      });
      if (!res.ok) throw new Error("Failed to delete");

      const refreshed = await fetch("/api/addbudget");
      const refreshedData = await refreshed.json();
      setBudgets(refreshedData);
      toast.success("Budget deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete budget");
    } finally {
      setShowDeleteModal(false);
      setDeleteIndex(null);
    }
  };

  const filteredBudgets = budgets.filter((b) =>
    b.office?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredBudgets.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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
      {/* === HEADER === */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Budget Allocation</h1>

        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search office..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <button
            onClick={() => {
              setShowModal(true);
              setEditingId(null);
              setOfficeId("");
              setPs("");
              setMooe("");
              setCo("");
            }}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Budget
          </button>
        </div>
      </div>
      <hr className="border-gray-300 mb-6" />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
        <div className="flex-grow overflow-y-auto">
          <table className="min-w-full border-collapse">
            <thead
              className="text-white border-b bg-cover bg-center"
              style={{ backgroundImage: "url('/img/blue.jpg')" }}
            >
              <tr>
                <th className="px-6 py-2 text-left font-semibold">Office</th>
                <th className="px-3 py-2 text-left font-semibold">PS</th>
                <th className="px-3 py-2 text-left font-semibold">MOOE</th>
                <th className="px-3 py-2 text-left font-semibold">CO</th>
                <th className="px-3 py-2 text-left font-semibold">Total</th>
                <th className="px-3 py-2 text-left font-semibold">Date Created</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-gray-500 italic text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Image
                        src="/img/soe.png"
                        alt="No data"
                        width={200}
                        height={200}
                        className="mb-2 object-contain"
                        loading="lazy"
                      />
                      <span>No budgets found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((b, i) => (
                  <tr key={b.id} onClick={() => { setSelectedBudget({ item: b, index: startIndex + i }); setShowDetailsModal(true); }} className="border-b hover:bg-gray-200 cursor-pointer">
                    <td className="px-6 py-3">{b.office}</td>
                    <td className="px-6 py-3">₱{b.ps.toLocaleString()}</td>
                    <td className="px-6 py-3">₱{b.mooe.toLocaleString()}</td>
                    <td className="px-6 py-3">₱{b.co.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-gray-700 border border-gray-700 font-semibold">
                        ₱{b.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3">{b.dateCreated}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - right bottom */}
        <div className="border-t border-gray-200 p-2 bg-gray-50">
          <div className="flex justify-end items-end">
            <nav aria-label="Page navigation">
              <ul className="inline-flex text-sm shadow-md rounded-lg overflow-hidden bg-white">
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-5 py-2 border-r border-gray-200 font-semibold text-gray-600 bg-white transition-all ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50 hover:text-blue-600"}`}
                  >
                    Prev
                  </button>
                </li>
                <li>
                  <span className="px-5 py-2 font-bold text-blue-700 bg-white text-lg border-r border-gray-200 select-none">
                    {currentPage}
                  </span>
                </li>
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-5 py-2 font-semibold text-gray-600 bg-white transition-all ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50 hover:text-blue-600"}`}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* 🟩 Add/Edit Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-black opacity-10 pointer-events-auto"
            onClick={() => setShowModal(false)}
          ></div>

          <div
            className="bg-white rounded-xl shadow-lg w-[420px] overflow-hidden z-10 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1E3358] flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-white text-blue-600 p-2 rounded-full">
                  {editingId !== null ? <Edit size={18} /> : <Plus size={18} />}
                </div>
                <h2 className="text-white text-lg font-semibold">
                  {editingId !== null ? "Edit Budget" : "Add Budget"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <select
                value={officeId}
                onChange={(e) => setOfficeId(Number(e.target.value))}
                className="w-full bg-gray-100 rounded-lg p-3"
              >
                <option value="">Select Office</option>
                {offices.map((office) => {
                  const alreadyBudgeted = budgets.some(
                    (b) => b.office === office.name
                  );
                  return (
                    <option
                      key={office.id}
                      value={office.id}
                      disabled={alreadyBudgeted && editingId === null}
                    >
                      {office.name}{" "}
                      {alreadyBudgeted && editingId === null ? "(Already Budgeted)" : ""}
                    </option>
                  );
                })}
              </select>

              <input
                type="number"
                placeholder="PS"
                value={ps}
                onChange={(e) => setPs(e.target.value)}
                className="w-full bg-gray-100 rounded-lg p-3"
              />
              <input
                type="number"
                placeholder="MOOE"
                value={mooe}
                onChange={(e) => setMooe(e.target.value)}
                className="w-full bg-gray-100 rounded-lg p-3"
              />
              <input
                type="number"
                placeholder="CO"
                value={co}
                onChange={(e) => setCo(e.target.value)}
                className="w-full bg-gray-100 rounded-lg p-3"
              />

              <p className="font-semibold">Total Budget: ₱{totalBudget.toLocaleString()}</p>
            </div>

            <div className="flex justify-end gap-3 px-4 py-3 bg-gray-50 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
              >
                {editingId !== null ? "Save Changes" : "Add Budget"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟦 Budget Details Panel - Enhanced Modern UI */}
      {showDetailsModal && selectedBudget && (
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
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white text-2xl font-bold tracking-tight">Budget Details</h2>
                    <p className="text-blue-100 text-sm mt-0.5">View and manage budget allocation</p>
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

              {/* Office Name Card */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      Office
                    </p>
                    <h3 className="text-white text-2xl font-bold leading-tight">
                      {selectedBudget.item.office}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Budget Breakdown Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
                    Budget Breakdown
                  </p>
                </div>

                {/* PS Card */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">
                          Personal Services
                        </p>
                        <p className="text-gray-400 text-xs">PS</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xl font-bold">
                        {formatCurrency(selectedBudget.item.ps)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* MOOE Card */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/20 p-2 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-green-300 text-xs font-semibold uppercase tracking-wider">
                          MOOE
                        </p>
                        <p className="text-gray-400 text-xs">Maintenance and Other Operating Expenses</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xl font-bold">
                        {formatCurrency(selectedBudget.item.mooe)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CO Card */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500/20 p-2 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
                          Capital Outlays
                        </p>
                        <p className="text-gray-400 text-xs">CO</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xl font-bold">
                        {formatCurrency(selectedBudget.item.co)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Budget Card */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 p-6 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/30 p-3 rounded-xl">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-green-300 text-xs font-semibold uppercase tracking-wider">
                        Total Budget
                      </p>
                      <p className="text-gray-300 text-xs">Overall allocation</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-3xl font-bold">
                      {formatCurrency(selectedBudget.item.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Created Card */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500/20 p-3 rounded-xl">
                    <Calendar className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                   
                    <div className="space-y-2">
                      <p className="text-white font-medium">
                        {new Date(selectedBudget.item.dateCreated).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Clock size={14} />
                        <span>
                          {new Date(selectedBudget.item.dateCreated).toLocaleTimeString('en-US', {
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
             

              {/* Budget ID */}
              
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
                  handleEdit(selectedBudget.index);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 font-semibold text-sm flex items-center gap-2 shadow-lg"
              >
                <Edit size={16} />
                Edit Budget
              </button>

              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleDeleteClick(selectedBudget.index);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 font-semibold text-sm flex items-center gap-2 shadow-lg"
              >
                <Trash2 size={16} />
                Delete Budget
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 🟥 Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="absolute inset-0 bg-black opacity-20 pointer-events-auto"
            onClick={() => setShowDeleteModal(false)}
          ></div>
          <div className="bg-white rounded-xl shadow-lg w-[420px] p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3 text-center text-red-600">
              Confirm Delete
            </h2>
            <p className="text-gray-700 text-center mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteIndex !== null ? budgets[deleteIndex]?.office : ""}
              </span>
              ?
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