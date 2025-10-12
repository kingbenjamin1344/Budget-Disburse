"use client";
import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";

export default function AddOfficePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [offices, setOffices] = useState<any[]>([]);
  const [newOffice, setNewOffice] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch data
  const fetchOffices = async () => {
    const res = await fetch("/api/offices");
    const data = await res.json();
    setOffices(data);
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  // Add new office
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
      fetchOffices();
    }
    setLoading(false);
  };

  // Delete office
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this office?")) return;
    await fetch("/api/offices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchOffices();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        {/* Search */}
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

        {/* Add */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="New office name"
            value={newOffice}
            onChange={(e) => setNewOffice(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
          />
          <button
            onClick={handleAddOffice}
            disabled={loading}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? "Adding..." : "Add Office"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 border-b">
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
            {offices.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-6 text-gray-500 italic"
                >
                  No offices found.
                </td>
              </tr>
            ) : (
              offices
                .filter((o) =>
                  o.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((office: any) => (
                  <tr key={office.id} className="border-b">
                    <td className="px-6 py-3 text-gray-700">{office.name}</td>
                    <td className="px-6 py-3 text-gray-700">
                      {new Date(office.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      <button
                        onClick={() => handleDelete(office.id)}
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
