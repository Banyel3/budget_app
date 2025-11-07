"use client";

import { useEffect, useState } from "react";
import { DashboardData, CacheUtils, CACHE_KEYS, CACHE_TTL } from "@/lib/types";
import {
  Wallet,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Calendar,
  Plus,
  Settings,
} from "lucide-react";
import IncomeModal from "./IncomeModal";
import SavingsGoalModal from "./SavingsGoalModal";
import DebtModal from "./DebtModal";
import BudgetCategoryModal from "./BudgetCategoryModal";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async (forceRefresh: boolean = false) => {
    try {
      // Try to get cached data first
      if (!forceRefresh) {
        const cachedData = CacheUtils.get<DashboardData>(CACHE_KEYS.DASHBOARD);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          
          // Fetch fresh data in background and update cache
          fetchFreshData();
          return;
        }
      }

      // If no cache or force refresh, fetch fresh data
      await fetchFreshData();
    } catch (error) {
      console.error("Error in fetchDashboard:", error);
      setLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }
      
      const result = await response.json();
      
      // Cache the fresh data
      CacheUtils.set(CACHE_KEYS.DASHBOARD, result, CACHE_TTL.MEDIUM);
      
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      // Set some default data to prevent UI crashes
      const defaultData = {
        income: null,
        dailyIncome: 0,
        categories: [],
        totalBudgetPercentage: 0,
        savingsGoals: [],
        totalSavings: 0,
        totalSavingsTarget: 0,
        savingsProgress: 0,
        debts: [],
        totalDebt: 0,
        completedGoals: 0,
        activeGoals: 0,
        activeDebts: 0,
      };
      setData(defaultData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="text-xl font-medium text-gray-700 animate-pulse">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      {/* Page Title - Mobile Only */}
      <header className="mb-6 md:mb-8">
        <div className="md:hidden">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">
            Track your financial journey
          </p>
        </div>
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-600 mt-1">Here's your financial overview</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Daily Income Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8" />
            <span className="text-sm opacity-90">
              {data?.income?.frequency || "daily"}
            </span>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Income</h3>
          <p className="text-2xl md:text-3xl font-bold">
            {formatCurrency(data?.dailyIncome || 0)}
          </p>
          <p className="text-xs mt-2 opacity-75">
            {data?.income ? `${data.income.frequency} rate` : "No income set"}
          </p>
        </div>

        {/* Total Savings Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <PiggyBank className="w-8 h-8" />
            <span className="text-sm opacity-90">
              {data?.activeGoals} active
            </span>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Savings</h3>
          <p className="text-2xl md:text-3xl font-bold">
            {formatCurrency(data?.totalSavings || 0)}
          </p>
          <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${Math.min(data?.savingsProgress || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Total Debt Card */}
        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="w-8 h-8" />
            <span className="text-sm opacity-90">
              {data?.activeDebts} active
            </span>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Debt</h3>
          <p className="text-2xl md:text-3xl font-bold">
            {formatCurrency(data?.totalDebt || 0)}
          </p>
          <p className="text-xs mt-2 opacity-75">
            {data?.debts.length === 0 ? "No debts! 🎉" : "Keep paying!"}
          </p>
        </div>

        {/* Budget Status Card */}
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8" />
            <span className="text-sm opacity-90">
              {data?.categories.length} categories
            </span>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">
            Budget Allocated
          </h3>
          <p className="text-2xl md:text-3xl font-bold">
            {data?.totalBudgetPercentage || 0}%
          </p>
          <p className="text-xs mt-2 opacity-75">
            {data?.totalBudgetPercentage === 100
              ? "Fully allocated"
              : "Adjust allocation"}
          </p>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Budget Allocation
            </h2>
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-5 h-5 text-blue-600" />
            </button>
          </div>
          <div className="space-y-4">
            {data?.categories && data.categories.length > 0 ? (
              data.categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-gray-700 font-medium">
                      {category.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency(category.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {category.percentage}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No budget categories yet. Add one to get started!
              </p>
            )}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Savings Goals</h2>
            <button
              onClick={() => setGoalModalOpen(true)}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-5 h-5 text-blue-600" />
            </button>
          </div>
          <div className="space-y-4">
            {data?.savingsGoals && data.savingsGoals.length > 0 ? (
              data.savingsGoals.slice(0, 5).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div
                    key={goal.id}
                    className="border-b border-gray-100 pb-4 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">
                        {goal.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: goal.color,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {formatCurrency(goal.currentAmount)} /{" "}
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-8">
                No savings goals yet. Set your first goal!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Active Debts */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Active Debts</h2>
          <button
            onClick={() => setDebtModalOpen(true)}
            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-5 h-5 text-blue-600" />
          </button>
        </div>
        <div className="space-y-4">
          {data?.debts && data.debts.length > 0 ? (
            data.debts.map((debt) => {
              const progress =
                ((debt.principalAmount - debt.currentBalance) /
                  debt.principalAmount) *
                100;
              return (
                <div
                  key={debt.id}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {debt.name}
                      </h3>
                      {debt.creditor && (
                        <p className="text-sm text-gray-500">{debt.creditor}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(debt.currentBalance)}
                      </p>
                      <p className="text-xs text-gray-500">
                        of {formatCurrency(debt.principalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-gradient-to-r from-red-500 to-pink-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {formatCurrency(debt.repaymentAmount)}/
                      {debt.repaymentFrequency}
                    </span>
                    {debt.dueDate && (
                      <span className="text-gray-500">
                        Due: {new Date(debt.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-6xl mb-4">🎉</p>
              <p className="text-xl font-semibold text-gray-900 mb-2">
                No active debts!
              </p>
              <p className="text-gray-500">
                You're debt-free! Keep up the great work!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setIncomeModalOpen(true)}
          className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2"
        >
          <Wallet className="w-8 h-8 text-green-600" />
          <span className="text-sm font-medium text-gray-700">Set Income</span>
        </button>
        <button
          onClick={() => setGoalModalOpen(true)}
          className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2"
        >
          <PiggyBank className="w-8 h-8 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Add Goal</span>
        </button>
        <button
          onClick={() => setDebtModalOpen(true)}
          className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2"
        >
          <CreditCard className="w-8 h-8 text-red-600" />
          <span className="text-sm font-medium text-gray-700">Add Debt</span>
        </button>
        <button 
          onClick={() => window.location.href = '/calendar'}
          className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2"
        >
          <Calendar className="w-8 h-8 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">
            View Calendar
          </span>
        </button>
      </div>

      {/* Modals */}
      <IncomeModal
        isOpen={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        onSave={() => {
          // Clear cache and force refresh when data changes
          CacheUtils.clear(CACHE_KEYS.DASHBOARD);
          CacheUtils.clear(CACHE_KEYS.INCOME);
          fetchDashboard(true);
        }}
      />
      <SavingsGoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onSave={() => {
          // Clear cache and force refresh when data changes
          CacheUtils.clear(CACHE_KEYS.DASHBOARD);
          CacheUtils.clear(CACHE_KEYS.SAVINGS_GOALS);
          fetchDashboard(true);
        }}
      />
      <DebtModal
        isOpen={debtModalOpen}
        onClose={() => setDebtModalOpen(false)}
        onSave={() => {
          // Clear cache and force refresh when data changes
          CacheUtils.clear(CACHE_KEYS.DASHBOARD);
          CacheUtils.clear(CACHE_KEYS.DEBTS);
          fetchDashboard(true);
        }}
      />
      <BudgetCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={() => {
          // Clear cache and force refresh when data changes
          CacheUtils.clear(CACHE_KEYS.DASHBOARD);
          CacheUtils.clear(CACHE_KEYS.CATEGORIES);
          fetchDashboard(true);
        }}
        categories={data?.categories || []}
      />
    </div>
  );
}
