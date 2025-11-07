"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function DebtModal({ isOpen, onClose, onSave }: DebtModalProps) {
  const [name, setName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentFrequency, setRepaymentFrequency] = useState("daily");
  const [dueDate, setDueDate] = useState("");
  const [creditor, setCreditor] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          principalAmount,
          repaymentAmount,
          repaymentFrequency,
          dueDate: dueDate || null,
          creditor,
          description,
        }),
      });

      if (response.ok) {
        onSave();
        onClose();
        setName("");
        setPrincipalAmount("");
        setRepaymentAmount("");
        setRepaymentFrequency("daily");
        setDueDate("");
        setCreditor("");
        setDescription("");
      }
    } catch (error) {
      console.error("Error saving debt:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Debt</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Debt Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Personal Loan"
                required
              />
            </div>

            <div>
              <label
                htmlFor="principalAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Total Amount (PHP)
              </label>
              <input
                type="number"
                id="principalAmount"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="7000"
                required
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label
                htmlFor="repaymentAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Repayment Amount (PHP)
              </label>
              <input
                type="number"
                id="repaymentAmount"
                value={repaymentAmount}
                onChange={(e) => setRepaymentAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="500"
                required
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label
                htmlFor="repaymentFrequency"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Repayment Frequency
              </label>
              <select
                id="repaymentFrequency"
                value={repaymentFrequency}
                onChange={(e) => setRepaymentFrequency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="creditor"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Creditor (Optional)
              </label>
              <input
                type="text"
                id="creditor"
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Bank Name"
              />
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date (Optional)
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Notes about this debt..."
                rows={2}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Add Debt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
