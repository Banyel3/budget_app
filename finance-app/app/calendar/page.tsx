"use client";

import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Filter,
  Plus,
} from "lucide-react";
import { BudgetCategory, CacheUtils, CACHE_KEYS, CACHE_TTL } from "@/lib/types";

interface DayPayment {
  date: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  payments: DayPayment[];
}

export default function CalendarPage() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [payments, setPayments] = useState<Map<string, DayPayment[]>>(
    new Map()
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editPaymentIndex, setEditPaymentIndex] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [dailyIncome, setDailyIncome] = useState(0);
  const [showCategorySelect, setShowCategorySelect] = useState(false);

  useEffect(() => {
    fetchData();
    loadPayments();
  }, []);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, payments, selectedCategory]);

  const fetchData = async (forceRefresh: boolean = false) => {
    try {
      // Try to get cached data first
      if (!forceRefresh) {
        const cachedCategories = CacheUtils.get<BudgetCategory[]>(CACHE_KEYS.CATEGORIES);
        const cachedDashboard = CacheUtils.get<any>(CACHE_KEYS.DASHBOARD);
        
        if (cachedCategories && cachedDashboard) {
          setCategories(cachedCategories);
          setDailyIncome(cachedDashboard.dailyIncome || 0);
          setLoading(false);
          
          // Fetch fresh data in background
          fetchFreshData();
          return;
        }
      }

      // If no cache or force refresh, fetch fresh data
      await fetchFreshData();
    } catch (error) {
      console.error("Error in fetchData:", error);
      setLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      const [categoriesRes, dashboardRes] = await Promise.all([
        fetch("/api/budget-categories"),
        fetch("/api/dashboard"),
      ]);

      // Check categories response
      if (!categoriesRes.ok) {
        throw new Error(`Categories API error! status: ${categoriesRes.status}`);
      }
      const categoriesContentType = categoriesRes.headers.get("content-type");
      if (!categoriesContentType || !categoriesContentType.includes("application/json")) {
        throw new Error("Categories response is not JSON");
      }

      // Check dashboard response
      if (!dashboardRes.ok) {
        throw new Error(`Dashboard API error! status: ${dashboardRes.status}`);
      }
      const dashboardContentType = dashboardRes.headers.get("content-type");
      if (!dashboardContentType || !dashboardContentType.includes("application/json")) {
        throw new Error("Dashboard response is not JSON");
      }

      const categoriesData = await categoriesRes.json();
      const dashboardData = await dashboardRes.json();
      
      // Cache the fresh data
      CacheUtils.set(CACHE_KEYS.CATEGORIES, categoriesData, CACHE_TTL.MEDIUM);
      CacheUtils.set(CACHE_KEYS.DASHBOARD, dashboardData, CACHE_TTL.MEDIUM);
      
      setCategories(categoriesData || []);
      setDailyIncome(dashboardData.dailyIncome || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      setCategories([]);
      setDailyIncome(0);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = () => {
    const stored = localStorage.getItem("categoryPayments");
    if (stored) {
      const paymentsArray: [string, DayPayment[]][] = JSON.parse(stored);
      setPayments(new Map(paymentsArray));
    }
  };

  const savePayments = (newPayments: Map<string, DayPayment[]>) => {
    const paymentsArray = Array.from(newPayments.entries());
    localStorage.setItem("categoryPayments", JSON.stringify(paymentsArray));
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = date.toDateString();
      const dayPayments = payments.get(dateKey) || [];
      const filteredPayments =
        selectedCategory === "all"
          ? dayPayments
          : dayPayments.filter((p) => p.categoryId === selectedCategory);

      days.push({
        date,
        isCurrentMonth: false,
        payments: filteredPayments,
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toDateString();
      const dayPayments = payments.get(dateKey) || [];
      const filteredPayments =
        selectedCategory === "all"
          ? dayPayments
          : dayPayments.filter((p) => p.categoryId === selectedCategory);

      days.push({
        date,
        isCurrentMonth: true,
        payments: filteredPayments,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = date.toDateString();
      const dayPayments = payments.get(dateKey) || [];
      const filteredPayments =
        selectedCategory === "all"
          ? dayPayments
          : dayPayments.filter((p) => p.categoryId === selectedCategory);

      days.push({
        date,
        isCurrentMonth: false,
        payments: filteredPayments,
      });
    }

    setCalendarDays(days);
  };

  const handleDateClick = (date: Date) => {
    const dateKey = date.toDateString();
    const dayPayments = payments.get(dateKey) || [];
    
    // Filter payments by selected category if not "all"
    const filteredPayments = selectedCategory === "all" 
      ? dayPayments 
      : dayPayments.filter((p) => p.categoryId === selectedCategory);
    
    setSelectedDate(date);
    
    // If there are existing payments for this date (considering the filter), show edit options
    if (filteredPayments.length > 0) {
      // If only one payment for the filtered category, edit it directly
      if (filteredPayments.length === 1) {
        const paymentIndex = dayPayments.indexOf(filteredPayments[0]);
        setEditPaymentIndex(paymentIndex);
        setEditAmount(filteredPayments[0].amount.toString());
      } else {
        // Multiple payments - show selection modal for which one to edit
        setShowCategorySelect(true);
      }
    } else {
      // No existing payments for this category/date
      if (selectedCategory === "all") {
        // Show category selection when "all" is selected
        setShowCategorySelect(true);
      } else {
        // Auto-add payment for the selected category
        const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
        if (selectedCategoryData) {
          handleAddPayment(selectedCategoryData);
        }
      }
    }
  };

  const handleAddPayment = (category: BudgetCategory) => {
    if (!selectedDate) return;

    const dateKey = selectedDate.toDateString();
    const amount = (dailyIncome * category.percentage) / 100;

    const newPayment: DayPayment = {
      date: dateKey,
      categoryId: category.id,
      categoryName: category.name,
      amount,
      color: category.color,
    };

    const newPayments = new Map(payments);
    const existingPayments = newPayments.get(dateKey) || [];
    existingPayments.push(newPayment);
    newPayments.set(dateKey, existingPayments);

    setPayments(newPayments);
    savePayments(newPayments);
    setShowCategorySelect(false);
    setSelectedDate(null);
  };

  const handleEditPayment = (date: Date, paymentIndex: number) => {
    const dateKey = date.toDateString();
    const dayPayments = payments.get(dateKey);
    if (dayPayments && dayPayments[paymentIndex]) {
      setSelectedDate(date);
      setEditPaymentIndex(paymentIndex);
      setEditAmount(dayPayments[paymentIndex].amount.toString());
    }
  };

  const handleSaveEdit = () => {
    if (!selectedDate || editPaymentIndex === null) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid amount");
      return;
    }

    const dateKey = selectedDate.toDateString();
    const newPayments = new Map(payments);
    const dayPayments = newPayments.get(dateKey);

    if (dayPayments && dayPayments[editPaymentIndex]) {
      dayPayments[editPaymentIndex].amount = amount;
      newPayments.set(dateKey, dayPayments);
      setPayments(newPayments);
      savePayments(newPayments);
    }

    setSelectedDate(null);
    setEditPaymentIndex(null);
    setEditAmount("");
  };

  const handleDeletePayment = () => {
    if (!selectedDate || editPaymentIndex === null) return;

    const dateKey = selectedDate.toDateString();
    const newPayments = new Map(payments);
    const dayPayments = newPayments.get(dateKey);

    if (dayPayments) {
      dayPayments.splice(editPaymentIndex, 1);
      if (dayPayments.length === 0) {
        newPayments.delete(dateKey);
      } else {
        newPayments.set(dateKey, dayPayments);
      }
      setPayments(newPayments);
      savePayments(newPayments);
    }

    setSelectedDate(null);
    setEditPaymentIndex(null);
    setEditAmount("");
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Calculate monthly stats
  const totalPaymentsThisMonth = Array.from(payments.entries())
    .filter(([dateStr]) => {
      const paymentDate = new Date(dateStr);
      return (
        paymentDate.getMonth() === currentDate.getMonth() &&
        paymentDate.getFullYear() === currentDate.getFullYear()
      );
    })
    .flatMap(([, dayPayments]) => dayPayments)
    .filter(
      (p) => selectedCategory === "all" || p.categoryId === selectedCategory
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const daysMarkedThisMonth = calendarDays.filter(
    (d) => d.isCurrentMonth && d.payments.length > 0
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div className="text-xl font-medium text-gray-700 animate-pulse">Loading Calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      {/* Page Header */}
      <header className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Payment Calendar
            </h1>
            <p className="text-gray-600 mt-1">
              Track your budget category payments
            </p>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Today
          </button>
        </div>
      </header>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filter by Category</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                selectedCategory === category.id
                  ? "text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={{
                backgroundColor:
                  selectedCategory === category.id ? category.color : undefined,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Calendar */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Monthly Calendar
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Click dates to mark payments
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-lg font-bold text-indigo-600">
              {formatCurrency(totalPaymentsThisMonth)}
            </p>
            <p className="text-xs text-gray-500">
              {daysMarkedThisMonth} days marked
            </p>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h3 className="text-xl font-semibold text-gray-900">
            {formatMonthYear(currentDate)}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-gray-600 text-sm py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((dayData, index) => {
            const isCurrentDay = isToday(dayData.date);
            const hasPayments = dayData.payments.length > 0;
            const totalForDay = dayData.payments.reduce((sum, p) => sum + p.amount, 0);
            
            const handleDayClick = () => {
              if (dayData.isCurrentMonth) {
                handleDateClick(dayData.date);
              }
            };

            let dayClasses = "aspect-square p-2 rounded-xl transition-all relative min-h-[80px] cursor-pointer";
            if (!dayData.isCurrentMonth) {
              dayClasses += " opacity-20 pointer-events-none";
            }
            if (isCurrentDay) {
              dayClasses += " ring-2 ring-indigo-500";
            }
            if (hasPayments) {
              dayClasses += " bg-green-50 border-2 border-green-300";
            } else {
              dayClasses += " border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
            }

            let spanClasses = "text-sm font-semibold";
            if (isCurrentDay) {
              spanClasses += " text-indigo-700";
            } else if (hasPayments) {
              spanClasses += " text-green-700";
            } else {
              spanClasses += " text-gray-700";
            }

            return (
              <div
                key={index}
                onClick={handleDayClick}
                className={dayClasses}
              >
                <div className="flex flex-col h-full">
                  <span className={spanClasses}>
                    {dayData.date.getDate()}
                  </span>

                  {hasPayments && (
                    <div className="flex-1 flex flex-col justify-center items-center gap-1 mt-1">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {dayData.payments.map((payment, idx) => (
                          <div
                            key={idx}
                            className="w-3 h-3 rounded-full border border-white cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: payment.color }}
                            title={`${payment.categoryName}: ${formatCurrency(payment.amount)}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-green-700">
                        {formatCurrency(totalForDay)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-50 border-2 border-green-300 rounded-lg" />
              <span className="text-gray-700">Has Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-200 rounded-lg" />
              <span className="text-gray-700">No Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 ring-2 ring-indigo-500 rounded-lg" />
              <span className="text-gray-700">Today</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            💡 When "All Categories" is selected: Click dates to choose category. 
            When specific category is selected: Click dates to instantly add/edit payments for that category.
          </p>
        </div>
      </div>

      {/* Category Select Modal */}
      {showCategorySelect && selectedDate && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {(() => {
                  const dateKey = selectedDate.toDateString();
                  const dayPayments = payments.get(dateKey) || [];
                  const filteredPayments = selectedCategory === "all" 
                    ? dayPayments 
                    : dayPayments.filter((p) => p.categoryId === selectedCategory);
                  return filteredPayments.length > 0 ? "Select Payment to Edit" : "Select Category";
                })()}
              </h3>
              <button
                onClick={() => {
                  setShowCategorySelect(false);
                  setSelectedDate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              {selectedDate.toLocaleDateString("en-PH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedDate && (() => {
                const dateKey = selectedDate.toDateString();
                const dayPayments = payments.get(dateKey) || [];
                const filteredPayments = selectedCategory === "all" 
                  ? dayPayments 
                  : dayPayments.filter((p) => p.categoryId === selectedCategory);

                // If there are existing payments, show them for editing
                if (filteredPayments.length > 0) {
                  return (
                    <>
                      {filteredPayments.map((payment, idx) => {
                        const paymentIndex = dayPayments.indexOf(payment);
                        return (
                          <div
                            key={`${payment.categoryId}-${idx}`}
                            onClick={() => {
                              setEditPaymentIndex(paymentIndex);
                              setEditAmount(payment.amount.toString());
                              setShowCategorySelect(false);
                            }}
                            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 transition-all text-left cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${payment.color}20` }}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: payment.color }}
                                  />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {payment.categoryName}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Current payment
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </p>
                                <p className="text-xs text-gray-500">click to edit</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                }

                // No existing payments, show categories for adding new payments
                return (
                  <>
                    {categories.map((category) => {
                      const amount = (dailyIncome * category.percentage) / 100;
                      return (
                        <div
                          key={category.id}
                          onClick={() => handleAddPayment(category)}
                          className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 transition-all text-left cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {category.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {category.percentage}% of income
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">
                                {formatCurrency(amount)}
                              </p>
                              <p className="text-xs text-gray-500">suggested</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {selectedDate && editPaymentIndex !== null && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Payment</h3>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setEditPaymentIndex(null);
                  setEditAmount("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                {selectedDate.toLocaleDateString("en-PH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₱
                </span>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDeletePayment}
                className="flex-1 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setEditPaymentIndex(null);
                  setEditAmount("");
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Exit
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
