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
  const [ps, setPs] = useState<string>(""); 
  const [mooe, setMooe] = useState<string>(""); 
  const [co, setCo] = useState<string>(""); 

  const totalBudget =
    (parseFloat(ps) || 0) + (parseFloat(mooe) || 0) + (parseFloat(co) || 0);

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

    // Prevent duplicate budget for an office (only if adding new)
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

      // Refresh budgets
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

      const refreshed = await fetch("/api/addbudget");
      const refreshedData = await refreshed.json();
      setBudgets(refreshedData);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredBudgets = budgets.filter((b) =>
    b.office.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-lg" >
        <table className="min-w-full border-collapse" >
          <thead className="bg-gray-100 text-gray-700 border-b text-white border-b bg-cover bg-center"  
            style={{ backgroundImage: "url('/img/blue.jpg')" }} >
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
            {filteredBudgets.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-6 text-gray-500 italic"
                >
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
              filteredBudgets.map((b, i) => (
                <tr key={b.id} className="border-b">
                  <td className="px-6 py-3">{b.office}</td>
                  <td className="px-6 py-3">₱{b.ps.toLocaleString()}</td>
                  <td className="px-6 py-3">₱{b.mooe.toLocaleString()}</td>
                  <td className="px-6 py-3">₱{b.co.toLocaleString()}</td>
                  <td className="px-6 py-3 font-semibold">
                    ₱{b.total.toLocaleString()}
                  </td>
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
                    disabled={alreadyBudgeted && editingId === null} // disable only when adding new
                  >
                    {office.name} {alreadyBudgeted && editingId === null ? "(Already Budgeted)" : ""}
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
    </div>
  );
}
