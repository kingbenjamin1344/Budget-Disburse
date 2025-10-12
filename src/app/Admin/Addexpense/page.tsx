"use client";
import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";

export default function AddExpensePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch expenses
  const fetchExpenses = async () => {
    const res = await fetch("/api/expenses");
    const data = await res.json();
    setExpenses(data);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Add expense
  const handleAddExpense = async () => {
    if (!type.trim() || !category.trim()) {
      alert("Please fill in both fields");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, category }),
    });

    if (res.ok) {
      setType("");
      setCategory("");
      fetchExpenses();
    } else {
      alert("Failed to add expense");
    }
    setLoading(false);
  };

  // Delete expense
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchExpenses();
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        {/* Search Bar */}
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

        {/* Add Expense Fields */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Type of Expense"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
          />
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
          />
          <button
            onClick={handleAddExpense}
            disabled={loading}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                Type of Expense
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                Category of Expense
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
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500 italic">
                  No expenses found.
                </td>
              </tr>
            ) : (
              expenses
                .filter((exp) =>
                  exp.type.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((expense) => (
                  <tr key={expense.id} className="border-b">
                    <td className="px-6 py-3 text-gray-700">{expense.type}</td>
                    <td className="px-6 py-3 text-gray-700">{expense.category}</td>
                    <td className="px-6 py-3 text-gray-700">
                      {new Date(expense.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      <button
                        onClick={() => handleDelete(expense.id)}
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
    </div>
  );
}
