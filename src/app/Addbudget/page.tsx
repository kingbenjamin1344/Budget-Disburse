"use client";
import { useEffect, useState } from "react";
import { Search, Plus, X, Edit, Trash2 } from "lucide-react";

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

  const totalBudget =
    (parseFloat(ps) || 0) + (parseFloat(mooe) || 0) + (parseFloat(co) || 0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

    fetchBudgets();
    fetchOffices();
  }, []);

  const handleSaveBudget = async () => {
    if (!officeId) return alert("Please select an office");

    const selectedOffice = offices.find((o) => o.id === officeId);

    if (
      editingId === null &&
      budgets.some((b) => b.office === selectedOffice?.name)
    ) {
      return alert("This office already has a budget allocated.");
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
    } catch (error) {
      alert("Failed to save budget");
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
    } catch (error) {
      console.error(error);
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
    <div className="w-full p-4">
      {/* === HEADER === */}
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
  {/* Left: Title */}
  <h1 className="text-3xl font-bold text-gray-800">Budget Allocation</h1>

  {/* Right: Search + Add button */}
  <div className="flex items-center space-x-2 mt-2 sm:mt-0">
    {/* Search */}
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

    {/* Add Budget Button */}
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
                <th className="px-3 py-2 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-gray-500 italic text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src="/img/soe.png"
                        alt="No data"
                        className="mb-2 max-w-[200px] h-auto object-contain"
                      />
                      <span>No budgets found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((b, i) => (
                  <tr key={b.id} className="border-b hover:bg-gray-200">
                    <td className="px-6 py-3">{b.office}</td>
                    <td className="px-6 py-3">₱{b.ps.toLocaleString()}</td>
                    <td className="px-6 py-3">₱{b.mooe.toLocaleString()}</td>
                    <td className="px-6 py-3">₱{b.co.toLocaleString()}</td>
                    <td className="px-6 py-3 font-semibold">
                      ₱{b.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-3">{b.dateCreated}</td>
                    <td className="px-6 py-3 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(startIndex + i)}
                        className="text-blue-500 hover:text-blue-700 transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(startIndex + i)}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10">
            <div className="relative mb-4">
              <h2 className="text-lg font-semibold text-center">
                {editingId !== null ? "Edit Budget" : "Add Budget"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-0 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <select
              value={officeId}
              onChange={(e) => setOfficeId(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-md mb-3"
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
                    {alreadyBudgeted && editingId === null
                      ? "(Already Budgeted)"
                      : ""}
                  </option>
                );
              })}
            </select>

            <input
              type="number"
              placeholder="PS"
              value={ps}
              onChange={(e) => setPs(e.target.value)}
              className="w-full border px-3 py-2 rounded-md mb-3"
            />
            <input
              type="number"
              placeholder="MOOE"
              value={mooe}
              onChange={(e) => setMooe(e.target.value)}
              className="w-full border px-3 py-2 rounded-md mb-3"
            />
            <input
              type="number"
              placeholder="CO"
              value={co}
              onChange={(e) => setCo(e.target.value)}
              className="w-full border px-3 py-2 rounded-md mb-3"
            />

            <p className="mb-4 font-semibold">
              Total Budget: ₱{totalBudget.toLocaleString()}
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                {editingId !== null ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
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
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
