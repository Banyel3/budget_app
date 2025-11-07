"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface BudgetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  categories?: any[]; // For parent category selection
  editingCategory?: any; // Category being edited
  selectedParentCategory?: any; // Pre-selected parent for subcategory creation
}

export default function BudgetCategoryModal({
  isOpen,
  onClose,
  onSave,
  categories = [],
  editingCategory = null,
  selectedParentCategory = null,
}: BudgetCategoryModalProps) {
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize form when editing or adding subcategory
  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name || "");
      setPercentage(editingCategory.percentage?.toString() || "");
      setColor(editingCategory.color || "#3b82f6");
      setParentId(editingCategory.parentId || "");
    } else if (selectedParentCategory) {
      // Adding subcategory - pre-select parent
      setName("");
      setPercentage("");
      setColor("#3b82f6");
      setParentId(selectedParentCategory.id);
    } else {
      // Reset form for new main category
      setName("");
      setPercentage("");
      setColor("#3b82f6");
      setParentId("");
    }
  }, [editingCategory, selectedParentCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingCategory 
        ? `/api/budget-categories/${editingCategory.id}`
        : "/api/budget-categories";
      
      const method = editingCategory ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, percentage, color, parentId: parentId || null }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        await response.json(); // Consume the response
      }

      onSave();
      onClose();
      setName("");
      setPercentage("");
      setColor("#3b82f6");
      setParentId("");
    } catch (error) {
      console.error("Error saving category:", error);
      alert(`Failed to ${editingCategory ? 'update' : 'create'} category. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#10b981", label: "Green" },
    { value: "#8b5cf6", label: "Purple" },
    { value: "#f59e0b", label: "Orange" },
    { value: "#ef4444", label: "Red" },
    { value: "#ec4899", label: "Pink" },
    { value: "#14b8a6", label: "Teal" },
    { value: "#f97316", label: "Orange" },
  ];

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingCategory 
              ? "Edit Category" 
              : selectedParentCategory 
                ? `Add Subcategory to ${selectedParentCategory.name}` 
                : "Add Budget Category"
            }
          </h2>
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
                htmlFor="parentId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category Type
              </label>
              <select
                id="parentId"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                disabled={selectedParentCategory && !editingCategory}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Main Category</option>
                {categories
                  .filter(cat => cat.isPredetermined || !cat.parentId)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      Subcategory of {category.name}
                    </option>
                  ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {selectedParentCategory && !editingCategory 
                  ? `Creating subcategory under "${selectedParentCategory.name}"`
                  : "Choose if this is a main category or subcategory"
                }
              </p>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={parentId ? "e.g., Emergency Fund, Credit Card" : "e.g., Custom Category"}
                disabled={editingCategory?.isPredetermined}
                required
              />
            </div>

            <div>
              <label
                htmlFor="percentage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Percentage of Income
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="percentage"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="25"
                  required
                  step="0.01"
                  min="0"
                  max="100"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  %
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Percentage of your income allocated to this category
              </p>
            </div>

            <div>
              <label
                htmlFor="color"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Color
              </label>
              <div className="grid grid-cols-8 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    className={`w-full h-10 rounded-lg border-2 transition-all ${
                      color === option.value
                        ? "border-gray-900 scale-110"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Tip:</strong> Make sure your total budget allocations
                don't exceed 100%. You can adjust percentages later.
              </p>
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
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : editingCategory ? "Update Category" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
