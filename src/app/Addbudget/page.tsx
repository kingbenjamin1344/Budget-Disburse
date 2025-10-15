"use client";
import { useEffect, useState } from "react";
import { Search, Plus, X } from "lucide-react";

export default function AddBudgetPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [budgets, setBudgets] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [officeId, setOfficeId] = useState<number | "">("");
  const [ps, setPs] = useState<number>(0);
  const [mooe, setMooe] = useState<number>(0);
  const [co, setCo] = useState<number>(0);
  const totalBudget = ps + mooe + co;

  // Fetch all budgets from API
  const fetchBudgets = async () => {
    try {
      const res = await fetch("/api/addbudget");
      const data = await res.json();
      setBudgets(data);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
    }
  };

  // Fetch offices (sample API)
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
    fetchBudgets();
  }, []);

  // Save budget (add or update)
  const handleSaveBudget = async () => {
    if (!officeId) return alert("Please select an office");

    const selectedOffice = offices.find((o) => o.id === officeId);
    const budgetData = {
      id: editingId !== null ? budgets[editingId]?.id : undefined,
      office: selectedOffice?.name,
      ps,
      mooe,
      co,
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

      await fetchBudgets();
      setShowModal(false);
      setEditingId(null);
      setOfficeId("");
      setPs(0);
      setMooe(0);
      setCo(0);
    } catch (error) {
      alert("Failed to save budget");
      console.error(error);
    }
  };

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

  const handleDelete = async (index: number) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    const budget = budgets[index];

    try {
      const res = await fetch("/api/addbudget", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: budget.id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchBudgets();
    } catch (error) {
      console.error(error);
    }
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
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setEditingId(null);
          }}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Budget
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-lg">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Office</th>
              <th className="px-6 py-3 text-left font-semibold">PS</th>
              <th className="px-6 py-3 text-left font-semibold">MOOE</th>
              <th className="px-6 py-3 text-left font-semibold">CO</th>
              <th className="px-6 py-3 text-left font-semibold">Total</th>
              <th className="px-6 py-3 text-left font-semibold">Date Created</th>
              <th className="px-6 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500 italic">
                  No budgets found.
                </td>
              </tr>
            ) : (
              budgets
                .filter((b) =>
                  b.office.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((b, i) => (
                  <tr key={b.id} className="border-b">
                    <td className="px-6 py-3">{b.office}</td>
                    <td className="px-6 py-3">₱{b.ps.toLocaleString()}</td>
                    <td className="px-6 py-3">₱{b.mooe.toLocaleString()}</td>
                    <td className="px-6 py-3">₱{b.co.toLocaleString()}</td>
                    <td className="px-6 py-3 font-semibold">₱{b.total.toLocaleString()}</td>
                    <td className="px-6 py-3">{b.dateCreated}</td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => handleEdit(i)}
                        className="text-blue-500 hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(i)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingId !== null ? "Edit Budget" : "Add Budget"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <select
              value={officeId}
              onChange={(e) => setOfficeId(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-md mb-3"
            >
              <option value="">Select Office</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="PS"
              value={ps}
              onChange={(e) => setPs(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-md mb-3"
            />
            <input
              type="number"
              placeholder="MOOE"
              value={mooe}
              onChange={(e) => setMooe(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded-md mb-3"
            />
            <input
              type="number"
              placeholder="CO"
              value={co}
              onChange={(e) => setCo(Number(e.target.value))}
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
    </div>
  );
}
