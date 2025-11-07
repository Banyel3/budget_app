"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
} from "lucide-react";
import IncomeModal from "@/components/IncomeModal";
import { Income } from "@/lib/types";

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      const response = await fetch("/api/income");
      const data = await response.json();
      setIncomes(data);
    } catch (error) {
      console.error("Error fetching incomes:", error);
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

  const activeIncome = incomes.find((income) => income.isActive);

  const calculateDailyRate = (income: Income) => {
    switch (income.frequency) {
      case "daily":
        return income.amount;
      case "weekly":
        return income.amount / 7;
      case "monthly":
        return income.amount / 30;
      default:
        return income.amount;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-8">
      {/* Page Header */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Income Management
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage your income sources
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            <span className="hidden md:inline">Set Income</span>
            <span className="md:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Active Income Card */}
      {activeIncome && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Income
          </h2>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm opacity-90 mb-1">Current Income</p>
                <p className="text-4xl md:text-5xl font-bold">
                  {formatCurrency(activeIncome.amount)}
                </p>
                <p className="text-sm opacity-90 mt-2 capitalize">
                  {activeIncome.frequency} Rate
                </p>
              </div>
              <Wallet className="w-12 h-12 opacity-80" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t border-white/20">
              <div>
                <p className="text-xs opacity-80 mb-1">Daily Equivalent</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(calculateDailyRate(activeIncome))}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-80 mb-1">Weekly Equivalent</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(calculateDailyRate(activeIncome) * 7)}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-80 mb-1">Monthly Equivalent</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(calculateDailyRate(activeIncome) * 30)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm opacity-90">
              <CalendarIcon className="w-4 h-4" />
              <span>
                Active since{" "}
                {new Date(activeIncome.startDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Income History */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Income History</h2>

        {incomes.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No income records yet</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Your First Income
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {incomes.map((income) => (
              <div
                key={income.id}
                className={`border rounded-xl p-4 transition-all ${
                  income.isActive
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        income.isActive ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <DollarSign
                        className={`w-6 h-6 ${
                          income.isActive ? "text-green-600" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(income.amount)}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {income.frequency} • Started{" "}
                        {new Date(income.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {income.isActive && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {activeIncome && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Annual Projection</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(calculateDailyRate(activeIncome) * 365)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Based on current rate</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-8 h-8 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Days Active</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.floor(
                (new Date().getTime() -
                  new Date(activeIncome.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">Since start date</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-8 h-8 text-green-600" />
              <h3 className="font-semibold text-gray-900">
                Total Earned (Est.)
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                calculateDailyRate(activeIncome) *
                  Math.floor(
                    (new Date().getTime() -
                      new Date(activeIncome.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">Since activation</p>
          </div>
        </div>
      )}

      <IncomeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchIncomes}
      />
    </div>
  );
}
