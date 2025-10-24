"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Edit2 } from "lucide-react";

export default function AddOfficePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [offices, setOffices] = useState<any[]>([]);
  const [newOffice, setNewOffice] = useState("");
  const [loading, setLoading] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<{ id: number; name: string } | null>(null);
  const [editName, setEditName] = useState("");

  const fetchOffices = async () => {
    const res = await fetch("/api/offices");
    const data = await res.json();
    setOffices(data);
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  const handleAddOffice = async () => {
    if (!newOffice.trim()) return alert("Please enter an office name.");
    setLoading(true);
    const res = await fetch("/api/offices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newOffice }),
    });
    if (res.ok) {
      setNewOffice("");
      setAddModal(false);
      fetchOffices();
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this office?")) return;
    await fetch("/api/offices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchOffices();
  };

  const handleEdit = (office: any) => {
    setEditingOffice(office);
    setEditName(office.name);
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingOffice) return alert("Please enter a name");
    setLoading(true);
    const res = await fetch("/api/offices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingOffice.id, name: editName }),
    });
    if (res.ok) {
      setEditModal(false);
      setEditingOffice(null);
      fetchOffices();
    } else {
      alert("Failed to update office");
    }
    setLoading(false);
  };

  // Filter offices based on search term
  const filteredOffices = offices.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full p-4">
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
          onClick={() => setAddModal(true)}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Office
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead
            className="text-white border-b bg-cover bg-center"
            style={{ backgroundImage: "url('/img/site.jpg')" }}
          >

            <tr>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                List of Office
              </th>
              <th className="px-6 py-3 text-left font-semibold border-b border-gray-300">
                Date Created
              </th>
              <th className="px-6 py-3 text-center font-semibold border-b border-gray-300">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOffices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-gray-500 italic">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src="/img/addbudget.png"
                        alt="No data"
                        className="mb-2 max-w-[200px] h-auto object-contain"
                      />
                      <span>No offices found.</span>
                    </div>
                  </td>
                </tr>

            ) : (
              filteredOffices.map((office) => (
                <tr key={office.id} className="border-b">
                  <td className="px-6 py-3 text-gray-700">{office.name}</td>
                  <td className="px-6 py-3 text-gray-700">
                    {new Date(office.dateCreated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-center text-gray-700">
                    <div className="flex justify-center items-center space-x-4">
                      <button
                        onClick={() => handleEdit(office)}
                        className="flex items-center text-blue-500 hover:underline space-x-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(office.id)}
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

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3 text-center" >Add Office</h2>
            <input
              type="text"
              placeholder="Office Name"
              value={newOffice}
              onChange={(e) => setNewOffice(e.target.value)}
              className="w-full border px-3 py-2 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-200"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setAddModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOffice}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition"
              >
                {loading ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && editingOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3 text-center" >Edit Office</h2>
            <input
              type="text"
              placeholder="Office Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border px-3 py-2 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-200"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
