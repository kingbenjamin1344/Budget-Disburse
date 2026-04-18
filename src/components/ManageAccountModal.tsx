"use client";

import { useState } from "react";
import { X, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

interface ManageAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function ManageAccountModal({
  isOpen,
  onClose,
  username,
}: ManageAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newUsername: username,
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (formData.newUsername.trim() !== username) {
      if (formData.newUsername.trim().length < 3) {
        newErrors.newUsername = "Username must be at least 3 characters";
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(formData.newUsername.trim())) {
        newErrors.newUsername =
          "Username can only contain letters, numbers, hyphens, and underscores";
      }
    }

    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form", { theme: "light" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/update-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newUsername: formData.newUsername.trim(),
          newPassword: formData.newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update credentials", {
          theme: "light",
        });
        return;
      }

      toast.success("Account updated successfully", { theme: "light" });
      setFormData({
        currentPassword: "",
        newUsername: username,
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error updating credentials:", error);
      toast.error("An error occurred. Please try again.", { theme: "light" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      currentPassword: "",
      newUsername: username,
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">Manage Account</h2>
            <p className="text-sm text-slate-500 mt-1">Update your superadmin credentials</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-all p-2 rounded-lg hover:bg-white/60"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {/* New Username */}
          <div>
            <label
              htmlFor="newUsername"
              className="block text-sm font-semibold text-slate-700 mb-2.5"
            >
              Username
            </label>
            <input
              type="text"
              id="newUsername"
              value={formData.newUsername}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newUsername: e.target.value,
                })
              }
              className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-slate-400 ${
                errors.newUsername
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50"
                  : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50 hover:bg-white"
              }`}
              placeholder="Enter new username (optional)"
            />
            {errors.newUsername && (
              <p className="text-red-600 text-xs mt-2 flex items-center gap-1.5 font-medium">
                <AlertCircle size={14} /> {errors.newUsername}
              </p>
            )}
          </div>

          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-semibold text-slate-700 mb-2.5"
            >
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                id="currentPassword"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentPassword: e.target.value,
                  })
                }
                className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-slate-400 pr-11 ${
                  errors.currentPassword
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50"
                    : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50 hover:bg-white"
                }`}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-600 text-xs mt-2 flex items-center gap-1.5 font-medium">
                <AlertCircle size={14} /> {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-semibold text-slate-700 mb-2.5"
            >
              New Password
            </label>
            <div className="relative group">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newPassword: e.target.value,
                  })
                }
                className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-slate-400 pr-11 ${
                  errors.newPassword
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50"
                    : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50 hover:bg-white"
                }`}
                placeholder="Leave blank to keep current password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-600 text-xs mt-2 flex items-center gap-1.5 font-medium">
                <AlertCircle size={14} /> {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          {formData.newPassword && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-slate-700 mb-2.5"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-slate-400 pr-11 ${
                    errors.confirmPassword
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-slate-50 hover:bg-white"
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1.5 font-medium">
                  <AlertCircle size={14} /> {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-blue-200 active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}