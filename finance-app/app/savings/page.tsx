"use client";

import { useEffect, useState } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import SavingsGoalModal from "@/components/SavingsGoalModal";
import { SavingsGoal } from "@/lib/types";

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/savings-goals");
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
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

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "No date set";
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateDaysRemaining = (targetDate: string | Date | undefined) => {
    if (!targetDate) return 0;
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate statistics
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress =
    totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 p-4 md:p-8">
      {/* Page Header */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Savings Goals</h1>
            <p className="text-gray-600 mt-1">
              Track your financial milestones
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Add Goal</span>
            <span className="md:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <Target className="w-8 h-8 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Active Goals</p>
          <p className="text-3xl font-bold">{activeGoals.length}</p>
          <p className="text-xs opacity-80 mt-2">in progress</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
          <DollarSign className="w-8 h-8 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Total Saved</p>
          <p className="text-3xl font-bold">{formatCurrency(totalSaved)}</p>
          <p className="text-xs opacity-80 mt-2">across all goals</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Overall Progress</p>
          <p className="text-3xl font-bold">{overallProgress.toFixed(1)}%</p>
          <p className="text-xs opacity-80 mt-2">of total target</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <CheckCircle2 className="w-8 h-8 mb-3 opacity-90" />
          <p className="text-sm opacity-90 mb-1">Completed</p>
          <p className="text-3xl font-bold">{completedGoals.length}</p>
          <p className="text-xs opacity-80 mt-2">goals achieved</p>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Goals</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(
                goal.currentAmount,
                goal.targetAmount
              );
              const daysRemaining = calculateDaysRemaining(goal.targetDate);
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-green-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${goal.color}20` }}
                      >
                        <Target
                          className="w-6 h-6"
                          style={{ color: goal.color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {goal.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(goal.targetDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Target</p>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: goal.color }}
                      >
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Remaining</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Days Left</p>
                      <p
                        className={`font-semibold text-sm ${
                          daysRemaining < 0 ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {daysRemaining < 0
                          ? "Overdue"
                          : `${daysRemaining} days`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Daily Need</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {daysRemaining > 0
                          ? formatCurrency(remaining / daysRemaining)
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: `${goal.color}15`,
                        color: goal.color,
                      }}
                    >
                      Add Contribution
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Completed Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: goal.color }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(goal.targetAmount)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Achieved on {formatDate(goal.targetDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Target className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Savings Goals Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start building your future by setting your first savings goal
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Savings Tips */}
      {goals.length > 0 && (
        <div className="mt-8 bg-green-50 rounded-2xl p-6 border border-green-100">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Savings Tips
          </h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• Set up automatic transfers to make saving effortless</li>
            <li>
              • Break large goals into smaller milestones to stay motivated
            </li>
            <li>
              • Review and adjust your goals quarterly based on income changes
            </li>
            <li>• Celebrate when you reach milestones to maintain momentum</li>
          </ul>
        </div>
      )}

      <SavingsGoalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchGoals}
      />
    </div>
  );
}
