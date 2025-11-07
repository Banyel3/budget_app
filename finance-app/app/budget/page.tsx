"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Plus, Edit2, Trash2, PieChart } from "lucide-react";
import BudgetCategoryModal from "@/components/BudgetCategoryModal";
import { BudgetCategory } from "@/lib/types";

export default function BudgetPage() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, dashboardRes] = await Promise.all([
        fetch("/api/budget-categories"),
        fetch("/api/dashboard"),
      ]);
      const categoriesData = await categoriesRes.json();
      const dashboardData = await dashboardRes.json();
      setCategories(categoriesData);
      setDailyIncome(dashboardData.dailyIncome || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const totalPercentage = categories.reduce(
    (sum, cat) => sum + cat.percentage,
    0
  );
  const remainingPercentage = 100 - totalPercentage;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      {/* Page Header */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Budget Allocation
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your spending categories
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Add Category</span>
            <span className="md:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <PieChart className="w-8 h-8 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Total Allocated</p>
          <p className="text-3xl font-bold">{totalPercentage.toFixed(2)}%</p>
          <p className="text-xs opacity-80 mt-2">of daily income</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Daily Budget</p>
          <p className="text-3xl font-bold">
            {formatCurrency((dailyIncome * totalPercentage) / 100)}
          </p>
          <p className="text-xs opacity-80 mt-2">allocated amount</p>
        </div>

        <div
          className={`bg-gradient-to-br rounded-2xl p-6 text-white shadow-lg ${
            remainingPercentage >= 0
              ? "from-purple-500 to-pink-600"
              : "from-red-500 to-orange-600"
          }`}
        >
          <PieChart className="w-8 h-8 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">
            {remainingPercentage >= 0 ? "Remaining" : "Over Budget"}
          </p>
          <p className="text-3xl font-bold">
            {Math.abs(remainingPercentage).toFixed(2)}%
          </p>
          <p className="text-xs opacity-80 mt-2">
            {remainingPercentage >= 0
              ? "available to allocate"
              : "exceeds 100%"}
          </p>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Budget Categories</h2>
          {dailyIncome === 0 && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Set income to see allocations
            </span>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No budget categories yet</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Category
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const amount = (dailyIncome * category.percentage) / 100;
              return (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {category.percentage}% of income
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(amount)}
                      </p>
                      <p className="text-xs text-gray-500">per day</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(category.percentage, 100)}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Weekly</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(amount * 7)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Monthly</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(amount * 30)}
                      </p>
                    </div>
                    <div className="text-right">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget Tips */}
      {categories.length > 0 && (
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Budget Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Try to keep essential expenses below 50% of your income</li>
            <li>• Allocate at least 20% for savings and investments</li>
            <li>
              • Review and adjust your budget monthly based on actual spending
            </li>
            {remainingPercentage < 0 && (
              <li className="text-red-600 font-semibold">
                ⚠️ Your budget exceeds 100%! Consider reducing some allocations
              </li>
            )}
          </ul>
        </div>
      )}

      <BudgetCategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchData}
      />
    </div>
  );
}
