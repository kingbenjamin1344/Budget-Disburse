"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Search, Plus, X, Edit, Trash2, LockKeyhole } from "lucide-react";

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

    if (
      editingId === null &&
      budgets.some((b) => b.office === selectedOffice?.name)
    ) {
      return toast.error("This office already has a budget allocated.") as any;
    }

    const budgetData = {
      id: editingId !== null ? budgets[editingId]?.id : undefined,
      office: selectedOffice?.name,
      ps: parseFloat(ps) || 0,
      mooe: parseFloat(mooe) || 0,
      co: parseFloat(co) || 0,
      total: totalBudget,
      dateCreated: new Date().toLocaleDateString(),
    };

    try {
      const method = editingId !== null ? "PUT" : "POST";
      const res = await fetch("/api/addbudget", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData),
      });

      const data = await res.json();
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
    b.office.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredBudgets.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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

         {/*   <button
            onClick={() => {
   
            }}
            className="flex items-center bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
          >
            <LockKeyhole className="w-4 h-4 mr-2" /> Lock Budget
          </button>  */}
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

{/* 🟦 Budget Details Panel */}
{showDetailsModal && selectedBudget && (
  <div className="fixed inset-0 z-50 flex">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setShowDetailsModal(false)}
    ></div>

    {/* Right-side Sliding Panel */}
    <aside
      className="ml-auto w-full sm:w-[520px] h-full bg-[#0F2544] shadow-xl overflow-hidden z-10 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
        <h2 className="text-white text-2xl font-bold">Budget Details</h2>
        <button
          onClick={() => setShowDetailsModal(false)}
          className="text-white hover:text-gray-300"
        >
          <X size={24} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6 text-white flex-1 overflow-y-auto">

        {/* Office */}
        <div className="text-center">
          <div className="text-sm text-blue-200 uppercase tracking-wide">
            Office
          </div>
          <div className="text-2xl font-bold mt-1">
            {selectedBudget.item.office}
          </div>
        </div>

        <hr className="border-white/20" />

        {/* Budget Breakdown */}
        <div className="space-y-5">

          <div className="flex justify-between items-center">
            <span className="text-blue-200">
              Personal Services
            </span>
            <span className="text-xl font-bold">
              ₱{selectedBudget.item.ps.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-blue-200">
              MOOE
            </span>
            <span className="text-xl font-bold">
              ₱{selectedBudget.item.mooe.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-blue-200">
              Capital Outlays
            </span>
            <span className="text-xl font-bold">
              ₱{selectedBudget.item.co.toLocaleString()}
            </span>
          </div>

        </div>

        <hr className="border-white/20" />

        {/* Total */}
        <div className="flex justify-between items-center bg-white/10 rounded-lg p-4">
          <span className="text-lg text-blue-100 font-semibold">
            Total Budget
          </span>
          <span className="text-2xl font-extrabold">
            ₱{selectedBudget.item.total.toLocaleString()}
          </span>
        </div>

        <hr className="border-white/20" />

        {/* Date */}
        <div className="text-center">
          <div className="text-sm text-blue-200">
            Date & Time Created
          </div>
          <div className="font-semibold mt-1">
            {new Date(selectedBudget.item.dateCreated).toLocaleString()}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="mt-auto flex justify-end gap-3 px-6 py-4 border-t border-white/20 bg-[#0F2544]">

        <button
          onClick={() => setShowDetailsModal(false)}
          className="px-5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 text-lg font-semibold"
        >
          Close
        </button>

        <button
          onClick={() => {
            setShowDetailsModal(false);
            handleEdit(selectedBudget.index);
          }}
          className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold"
        >
          <Edit />
        </button>

        <button
          onClick={() => {
            setShowDetailsModal(false);
            handleDeleteClick(selectedBudget.index);
          }}
          className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-lg font-semibold"
        >
          <Trash2 />
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
