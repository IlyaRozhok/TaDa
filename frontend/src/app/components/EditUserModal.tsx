"use client";

import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useSetTenantCvVerificationMutation } from "@/store/api/tenantCv.api";

/**
 * The backend's verification vocabulary, plus "" for "leave unchanged":
 * the users table does not carry the CV's current badges, so the control
 * only ever sends the fields the admin explicitly picked.
 */
const VERIFICATION_CHOICES = [
  { value: "", label: "Leave unchanged" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
];

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  status: string;
  is_private_landlord?: boolean | null;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (
    id: string,
    data: {
      full_name: string;
      email: string;
      role: string;
      is_private_landlord?: boolean;
    }
  ) => Promise<void>;
  isLoading?: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "tenant",
    is_private_landlord: false,
  });
  // C2 verification badges. Self-contained: applied through its own PATCH,
  // not the user update, so the two writes can never be conflated.
  const [verification, setVerification] = useState({
    kyc_status: "",
    referencing_status: "",
  });
  const [verificationNote, setVerificationNote] = useState<string | null>(
    null,
  );
  const [setTenantCvVerification, { isLoading: isVerificationSaving }] =
    useSetTenantCvVerificationMutation();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email,
        role: user.role,
        is_private_landlord: user.is_private_landlord ?? false,
      });
      setVerification({ kyc_status: "", referencing_status: "" });
      setVerificationNote(null);
    }
  }, [user, isOpen]);

  const handleApplyVerification = async () => {
    if (!user) return;
    const payload: {
      userId: string;
      kyc_status?: string;
      referencing_status?: string;
    } = { userId: user.id };
    if (verification.kyc_status) payload.kyc_status = verification.kyc_status;
    if (verification.referencing_status) {
      payload.referencing_status = verification.referencing_status;
    }
    if (!payload.kyc_status && !payload.referencing_status) return;

    try {
      await setTenantCvVerification(payload).unwrap();
      setVerification({ kyc_status: "", referencing_status: "" });
      setVerificationNote("Badges updated");
    } catch {
      setVerificationNote("Failed to update badges");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      await onSubmit(user.id, formData);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[8px] flex items-center justify-center z-50 p-4">
      <div className="bg-black/50 backdrop-blur-[19px] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Edit User</h2>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50"
            >
              <option value="tenant">Tenant</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === "tenant" && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div>
                <p className="text-sm font-medium text-white/90">
                  Trust badges (admin-set)
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  Shown on the tenant&apos;s CV. Applied immediately — only
                  the fields you pick change.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    KYC
                  </label>
                  <select
                    value={verification.kyc_status}
                    onChange={(e) =>
                      setVerification({
                        ...verification,
                        kyc_status: e.target.value,
                      })
                    }
                    data-testid="edit-user-kyc"
                    className="w-full px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-sm text-white [&>option]:text-black"
                  >
                    {VERIFICATION_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Referencing
                  </label>
                  <select
                    value={verification.referencing_status}
                    onChange={(e) =>
                      setVerification({
                        ...verification,
                        referencing_status: e.target.value,
                      })
                    }
                    data-testid="edit-user-referencing"
                    className="w-full px-3 py-2 bg-white/10 backdrop-blur-[5px] border border-white/20 rounded-lg text-sm text-white [&>option]:text-black"
                  >
                    {VERIFICATION_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleApplyVerification}
                  disabled={
                    isVerificationSaving ||
                    (!verification.kyc_status &&
                      !verification.referencing_status)
                  }
                  data-testid="edit-user-apply-verification"
                  className="px-4 py-1.5 rounded-lg border border-white/20 text-sm text-white cursor-pointer hover:bg-white/10 disabled:opacity-40 disabled:cursor-default transition-colors"
                >
                  {isVerificationSaving ? "Applying..." : "Apply badges"}
                </button>
                {verificationNote && (
                  <span className="text-xs text-white/60">
                    {verificationNote}
                  </span>
                )}
              </div>
            </div>
          )}

          {formData.role === "operator" && (
            <div className="flex items-center space-x-2">
              <input
                id="edit_is_private_landlord"
                type="checkbox"
                checked={formData.is_private_landlord}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_private_landlord: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-white/30 text-white focus:ring-white/50 bg-white/10"
              />
              <label
                htmlFor="edit_is_private_landlord"
                className="text-sm font-medium text-white/90"
              >
                Private landlord
              </label>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-white/90 cursor-pointer hover:bg-white/10 rounded-lg transition-colors font-medium border border-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-white cursor-pointer text-black hover:bg-white/90 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Updating..." : "Update"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
