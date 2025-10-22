"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";

export default function DisbursementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOffice, setFilterOffice] = useState("");
  const [filterExpense, setFilterExpense] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<{ type: string; category: string }[]>([]);

  const [formData, setFormData] = useState({
    dvNo: "",
    payee: "",
    office: "",
    expenseType: "",
    expenseCategory: "",
    amount: "",
  });

  // Fetch Offices + Expenses
  useEffect(() => {
    async function loadData() {
      try {
        const [officeRes, expenseRes] = await Promise.all([
          fetch("/api/offices"),
          fetch("/api/expenses"),
        ]);
        const officeData = await officeRes.json();
        const expenseData = await expenseRes.json();

        setOffices(officeData.map((o: any) => o.name));
        setExpenses(expenseData.map((e: any) => ({ type: e.type, category: e.category })));
      } catch (err) {
        console.error("Failed to fetch office/expense:", err);
      }
    }
    loadData();
  }, []);

  // Load disbursements
  useEffect(() => {
    async function loadDisbursements() {
      try {
        const res = await fetch("/api/disbursement");
        const data = await res.json();
        setDisbursements(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadDisbursements();
  }, []);

  // Auto-fill category when expenseType changes
  useEffect(() => {
    const match = expenses.find((e) => e.type === formData.expenseType);
    if (match) setFormData((prev) => ({ ...prev, expenseCategory: match.category }));
  }, [formData.expenseType, expenses]);

  // Open modal
  const handleAdd = () => {
    setShowModal(true);
    setEditingId(null);
    setFormData({
      dvNo: "",
      payee: "",
      office: "",
      expenseType: "",
      expenseCategory: "",
      amount: "",
    });
  };

  // Save or update
  const handleSave = async () => {
    if (!formData.dvNo || !formData.payee || !formData.office || !formData.expenseType || !formData.amount) {
      alert("Please fill all required fields");
      return;
    }

    const body = editingId
      ? { id: editingId, ...formData }
      : { ...formData, dateCreated: new Date().toISOString() };

    try {
      const res = await fetch("/api/disbursement", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save disbursement");
      const updated = await res.json();

      setDisbursements((prev) =>
        editingId ? prev.map((d) => (d.id === editingId ? updated : d)) : [updated, ...prev]
      );
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error saving disbursement.");
    }
  };

  const handleEdit = (id: number) => {
    const record = disbursements.find((d) => d.id === id);
    if (!record) return;
    setEditingId(id);
    setFormData(record);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch("/api/disbursement", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDisbursements((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting disbursement.");
    }
  };

  // Apply filters
  const filtered = disbursements.filter((item) => {
    const matchesSearch =
      item.dvNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.payee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOffice = filterOffice ? item.office === filterOffice : true;
    const matchesExpense = filterExpense ? item.expenseType === filterExpense : true;
    const matchesCategory = filterCategory ? item.expenseCategory === filterCategory : true;
    return matchesSearch && matchesOffice && matchesExpense && matchesCategory;
  });

  return (
    <div className="w-full p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
        <div className="flex flex-col md:flex-row items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search disbursement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Office Filter */}
          <select
            value={filterOffice}
            onChange={(e) => setFilterOffice(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Filter by Office</option>
            {offices.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          {/* Expense Type Filter */}
          <select
            value={filterExpense}
            onChange={(e) => setFilterExpense(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Filter by Expense Type</option>
            {expenses.map((e) => (
              <option key={e.type} value={e.type}>
                {e.type}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Filter by Category</option>
            {[...new Set(expenses.map((e) => e.category))].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
        >
          <Plus className="w-4 h-4 mr-2" /> Record Disbursement
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left">DV No.</th>
              <th className="px-6 py-3 text-left">Payee</th>
              <th className="px-6 py-3 text-left">Office</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{d.dvNo}</td>
                  <td className="px-6 py-3">{d.payee}</td>
                  <td className="px-6 py-3">{d.office}</td>
                  <td className="px-6 py-3">{d.expenseType}</td>
                  <td className="px-6 py-3">{d.expenseCategory}</td>
                  <td className="px-6 py-3">{d.amount}</td>
                  <td className="px-6 py-3">{new Date(d.dateCreated).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-center space-x-2">
                    <button onClick={() => handleEdit(d.id)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-gray-500 italic">
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src="/img/disburse.png"
                      alt="No data"
                      className="mb-2 max-w-[200px] h-auto object-contain"
                    />
                    <span>No disbursement records found.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
          <div className="bg-white border shadow-xl p-6 rounded-lg w-full max-w-md relative flex flex-col gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold mb-2 text-center">
              {editingId ? "Edit Disbursement" : "Record Disbursement"}
            </h2>

            <input
              type="text"
              placeholder="DV No."
              value={formData.dvNo}
              onChange={(e) => setFormData({ ...formData, dvNo: e.target.value })}
              className="border rounded-md p-2 w-full"
            />
            <input
              type="text"
              placeholder="Payee"
              value={formData.payee}
              onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
              className="border rounded-md p-2 w-full"
            />

            <select
              value={formData.office}
              onChange={(e) => setFormData({ ...formData, office: e.target.value })}
              className="border rounded-md p-2 w-full"
            >
              <option value="">Select Office</option>
              {offices.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <select
              value={formData.expenseType}
              onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
              className="border rounded-md p-2 w-full"
            >
              <option value="">Select Type</option>
              {expenses.map((e) => (
                <option key={e.type} value={e.type}>
                  {e.type}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Category"
              value={formData.expenseCategory}
              readOnly
              className="border rounded-md p-2 w-full bg-gray-100"
            />

            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="border rounded-md p-2 w-full"
            />

            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-3"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
