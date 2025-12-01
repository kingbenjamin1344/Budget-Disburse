"use client";

export default function LogoutModal({ isOpen, onCancel, onConfirm }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm text-center animate-fadeIn">
        <h2 className="text-lg font-semibold mb-4">
          Are you sure you want to log out?
        </h2>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 transition"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
