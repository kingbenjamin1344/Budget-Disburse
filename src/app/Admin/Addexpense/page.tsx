"use client";
import { useEffect, useState } from "react";
import { Search, Plus, Edit2 } from "lucide-react";

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

  const fetchExpenses = async () => {
    const res = await fetch("/api/expenses");
    const data = await res.json();
    setExpenses(data);
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
    } else alert("Failed to add expense");
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
      body: JSON.stringify({ id: editingId, type: editType, category: editCategory }),
    });

    if (res.ok) {
      setShowEditModal(false);
      setEditingId(null);
      fetchExpenses();
    } else alert("Failed to update expense");
  };

  const filteredExpenses = expenses.filter((exp) =>
    exp.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expense..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 border-b">
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
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500 italic">
                  No expense record found.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b">
                  <td className="px-6 py-3 text-gray-700">{expense.type}</td>
                  <td className="px-6 py-3 text-gray-700">{expense.category}</td>
                  <td className="px-6 py-3 text-gray-700">
                    {new Date(expense.dateCreated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-700">
                    <div className="flex justify-center items-center space-x-3">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-500 hover:underline flex items-center space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3">Add Expense</h2>
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

      {/* Edit Expense Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3">Edit Expense</h2>
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
