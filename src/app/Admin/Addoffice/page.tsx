"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

export default function AddOfficePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [offices, setOffices] = useState<any[]>([]);
  const [newOffice, setNewOffice] = useState("");
  const [loading, setLoading] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState<{ id: number; name: string } | null>(null);

  // Details modal
  const [selectedOffice, setSelectedOffice] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
    if (!newOffice.trim()) return toast.error("Please enter an office name.");
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
      toast.success("Office created successfully");
    }
    setLoading(false);
  };

  const handleEdit = (office: any) => {
    setEditingOffice(office);
    setEditName(office.name);
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingOffice) return toast.error("Please enter a name");
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
      toast.success("Office updated successfully");
    } else {
      toast.error("Failed to update office");
    }
    setLoading(false);
  };

  const handleDeleteClick = (office: any) => {
    setOfficeToDelete(office);
    setDeleteModal(true);
  };

const handleConfirmDelete = async () => {
  if (!officeToDelete) return;

  setLoading(true);

  try {
    const res = await fetch("/api/offices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: officeToDelete.id }),
    });

    const data = await res.json();

    // ❌ Delete blocked by backend
    if (!res.ok || data.success === false) {
      toast.error(
        data.message || "Unable to delete office. Please remove related records first."
      );
      return;
    }

    // ✅ Success
    toast.success("Office deleted successfully");
    setDeleteModal(false);
    setOfficeToDelete(null);
    fetchOffices();

  } catch (err) {
    // ⚠️ Network / unexpected failure only
    toast.error("Network error. Please try again.");
  } finally {
    setLoading(false);
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
                  <th className="px-8 py-3 text-left font-semibold ">List of Office</th>
                  <th className="px-8 py-3 text-left font-semibold w-2/5">Date Created</th>
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
                  <tr key={office.id} onClick={() => { setSelectedOffice(office); setShowDetailsModal(true); }} className="border-b hover:bg-gray-200 cursor-pointer">
                    <td className="px-10 py-3">{office.name}</td>
                    <td className="px-10 py-3">{new Date(office.dateCreated).toLocaleDateString()}</td>
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
          <input
            type="text"
            value={newOffice}
            placeholder="Enter Office Name"
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
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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

{/* 🟦 Office Details Panel */}
{showDetailsModal && selectedOffice && (
  <div className="fixed inset-0 z-50 flex">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/20"
      onClick={() => setShowDetailsModal(false)}
    ></div>

    {/* Right-side Sliding Panel */}
    <aside
      className="ml-auto w-full sm:w-[520px] h-full bg-white rounded-xl shadow-lg overflow-hidden z-10 pointer-events-auto flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1E3358]">
        <h2 className="text-white text-2xl font-bold">Office Details</h2>
        <button
          onClick={() => setShowDetailsModal(false)}
          className="text-white hover:text-gray-200"
        >
          <X size={24} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6 text-gray-800 flex-1 overflow-y-auto">
        <div className="text-center">
          <div className="text-sm text-gray-500">Name of the Office</div>
          <div className="font-bold text-xl">{selectedOffice.name}</div>
        </div>
        <hr className="border-gray-200" />

        <div className="text-center">
          <div className="text-sm text-gray-500">Created</div>
          <div className="font-bold text-xl">{new Date(selectedOffice.dateCreated).toLocaleString()}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex justify-end gap-3 px-6 py-4 bg-white border-t">
        <button
          onClick={() => setShowDetailsModal(false)}
          className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-lg font-semibold"
        >
          Close
        </button>

        <button
          onClick={() => { setShowDetailsModal(false); handleEdit(selectedOffice); }}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-lg font-semibold"
        >
          <Edit size={18} />
        </button>

        <button
          onClick={() => { setShowDetailsModal(false); handleDeleteClick(selectedOffice); }}
          className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-lg font-semibold"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </aside>
  </div>
)}


      {/* 🟥 Delete Confirmation Modal (Styled to Match Add Modal) */}
{deleteModal && officeToDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
    {/* Subtle overlay */}
    <div
      className="absolute inset-0 bg-black opacity-10 pointer-events-auto"
      onClick={() => setDeleteModal(false)}
    ></div>

    {/* Modal */}
    <div
      className="bg-white rounded-xl shadow-lg w-[420px] overflow-hidden z-10 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div className="bg-red-600 flex items-center justify-between px-4 py-3">
        <h2 className="text-white text-lg font-semibold">Confirm Delete</h2>
        <button
          onClick={() => setDeleteModal(false)}
          className="text-white hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* BODY */}
      <div className="p-5">
        <p className="text-gray-700 text-center">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{officeToDelete.name}</span>?
        </p>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 px-4 py-3 bg-gray-50 border-t">
        <button
          onClick={() => setDeleteModal(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>

        <button
          onClick={handleConfirmDelete}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
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

