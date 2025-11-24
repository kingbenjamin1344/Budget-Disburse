"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";

export default function AddOfficePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [offices, setOffices] = useState<any[]>([]);
  const [newOffice, setNewOffice] = useState("");
  const [loading, setLoading] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState<{ id: number; name: string } | null>(null);

  const [editingOffice, setEditingOffice] = useState<{ id: number; name: string } | null>(null);
  const [editName, setEditName] = useState("");

  // 🟩 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleDeleteClick = (office: any) => {
    setOfficeToDelete(office);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!officeToDelete) return;
    try {
      const res = await fetch("/api/offices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: officeToDelete.id }),
      });
      if (!res.ok) throw new Error("Failed to delete office");

      setDeleteModal(false);
      setOfficeToDelete(null);
      fetchOffices();
    } catch (error) {
      console.error(error);
      alert("Error deleting office");
    }
  };

  // 🟩 Filter and paginate
  const filteredOffices = offices.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOffices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredOffices.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="w-full p-4">
      {/* === HEADER WITH CONTROLS INLINE === */}
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
  {/* Left: Dashboard Title */}
  <div>
    <h1 className="text-3xl font-bold text-gray-800">
      Office
    </h1>
  </div>

  {/* Right: Search and Add Button */}
  <div className="flex items-center space-x-2 w-full sm:w-auto mt-4 sm:mt-0">
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

    {/* Add Office Button */}
    <button
      onClick={() => setAddModal(true)}
      className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Office
    </button>
  </div>
</div>

{/* Divider line */}
<hr className="border-gray-300 mt-4 mb-6" />


      {/* 🟩 Table with Pagination */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
        <div className="flex-grow overflow-y-auto">
          <table className="min-w-full border-collapse">
            <thead
              className="text-white border-b bg-cover bg-center"
              style={{ backgroundImage: "url('/img/blue.jpg')" }}
            >
              <tr>
                  <th className="px-6 py-2 text-left font-semibold w-2/5">List of Office</th>
                  <th className="px-4 py-2 text-left font-semibold w-2/5">Date Created</th>
                  <th className="px-4 py-2 text-center font-semibold w-1/5">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-gray-500 italic text-center">
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
                currentItems.map((office) => (
                  <tr key={office.id} className="border-b hover:bg-gray-200">
                    <td className="px-4 py-2">{office.name}</td>
                    <td className="px-6 py-3">
                      {new Date(office.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-center space-x-4">
                      <button
                        onClick={() => handleEdit(office)}
                        className="text-blue-500 hover:text-blue-700 transition"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(office)}
                        className="text-red-500 hover:text-red-700 transition"
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

        {/* Pagination Bar */}
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

{/* 🟩 Add Office Modal (Subtle Overlay) */}
{addModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
    {/* Subtle background overlay */}
    <div
      className="absolute inset-0 bg-black opacity-10 pointer-events-auto"
      onClick={() => setAddModal(false)}
    ></div>

    {/* Modal */}
    <div
      className="bg-white rounded-xl shadow-lg w-[420px] overflow-hidden z-10 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="bg-[#1E3358] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-white text-blue-600 p-2 rounded-full">
            <Plus size={18} />
          </div>
          <h2 className="text-white text-lg font-semibold">Add Office</h2>
        </div>
        <button
          onClick={() => setAddModal(false)}
          className="text-white hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* BODY */}
      <div className="p-5 space-y-4">
        <div className="bg-gray-100 rounded-lg p-3">
          <label className="text-xs text-gray-500">Office Name</label>
          <input
            type="text"
            value={newOffice}
            onChange={(e) => setNewOffice(e.target.value)}
            className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 px-4 py-3 bg-gray-50 border-t">
        <button
          onClick={() => setAddModal(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleAddOffice}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-green-600"
          }`}
        >
          {loading ? "Adding..." : "Add Office"}
        </button>
      </div>
    </div>
  </div>
)}

{/* 🟩 Edit Office Modal (Subtle Overlay) */}
{editModal && editingOffice && (
  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
    {/* Subtle background overlay */}
    <div
      className="absolute inset-0 bg-black opacity-10 pointer-events-auto"
      onClick={() => setEditModal(false)}
    ></div>

    {/* Modal */}
    <div
      className="bg-white rounded-xl shadow-lg w-[420px] overflow-hidden z-10 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="bg-[#1E3358] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-white text-blue-600 p-2 rounded-full">
            <Edit size={18} />
          </div>
          <h2 className="text-white text-lg font-semibold">Edit Office</h2>
        </div>
        <button
          onClick={() => setEditModal(false)}
          className="text-white hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* BODY */}
      <div className="p-5 space-y-4">
        <div className="bg-gray-100 rounded-lg p-3">
          <label className="text-xs text-gray-500">Office Name</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 px-4 py-3 bg-gray-50 border-t">
        <button
          onClick={() => setEditModal(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveEdit}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
)}


      {/* 🟥 Delete Confirmation Modal */}
      {deleteModal && officeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-20 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3 text-center text-red-600">
              Confirm Delete
            </h2>
            <p className="text-gray-700 text-center mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{officeToDelete.name}</span>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModal(false)}
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
