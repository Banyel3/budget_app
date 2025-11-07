"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Plus, Edit2, Trash2, PieChart, X } from "lucide-react";
import BudgetCategoryModal from "@/components/BudgetCategoryModal";
import { BudgetCategory, CacheUtils, CACHE_KEYS, CACHE_TTL } from "@/lib/types";

export default function BudgetPage() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [allocateMethod, setAllocateMethod] = useState("equal");
  const [customAllocations, setCustomAllocations] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

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
      // Set default values to prevent UI crashes
      setCategories([]);
      setDailyIncome(0);
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

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/budget-categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      // Clear cache and refresh
      CacheUtils.clear(CACHE_KEYS.CATEGORIES);
      CacheUtils.clear(CACHE_KEYS.DASHBOARD);
      fetchData(true);
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(`Failed to delete category: ${error.message}`);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setSelectedParentCategory(null);
  };

  const handleAddSubcategory = (parentCategory) => {
    setSelectedParentCategory(parentCategory);
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleAllocateBudget = async () => {
    if (categories.length === 0) {
      alert("Please add some categories before allocating budget.");
      return;
    }

    try {
      let newAllocations = {};
      const mainCategories = categories.filter(cat => !cat.parentId);
      
      if (allocateMethod === "equal") {
        // Distribute remaining percentage equally among all main categories
        const availablePercentage = Math.max(remainingPercentage, 0);
        const equalShare = availablePercentage / mainCategories.length;
        
        mainCategories.forEach(category => {
          newAllocations[category.id] = category.percentage + equalShare;
        });
      } else if (allocateMethod === "proportional") {
        // Distribute remaining percentage proportionally based on current allocations
        const availablePercentage = Math.max(remainingPercentage, 0);
        const currentTotal = totalPercentage;
        
        if (currentTotal > 0) {
          mainCategories.forEach(category => {
            const proportion = category.percentage / currentTotal;
            newAllocations[category.id] = category.percentage + (availablePercentage * proportion);
          });
        } else {
          // If no current allocations, fall back to equal distribution
          const equalShare = availablePercentage / mainCategories.length;
          mainCategories.forEach(category => {
            newAllocations[category.id] = equalShare;
          });
        }
      } else if (allocateMethod === "custom") {
        // Use custom allocations
        newAllocations = { ...customAllocations };
      } else if (allocateMethod === "recommended") {
        // Apply 50/30/20 rule or similar recommended allocation
        const availablePercentage = Math.max(remainingPercentage, 100 - totalPercentage);
        
        // Find specific categories by slug/name
        const essentialsCategory = mainCategories.find(cat => cat.slug === "essentials");
        const savingsCategory = mainCategories.find(cat => cat.slug === "savings");
        const lifestyleCategory = mainCategories.find(cat => cat.slug === "lifestyle");
        const funCategory = mainCategories.find(cat => cat.slug === "fun");
        const debtsCategory = mainCategories.find(cat => cat.slug === "debts");
        
        if (essentialsCategory) newAllocations[essentialsCategory.id] = 50;
        if (savingsCategory) newAllocations[savingsCategory.id] = 20;
        if (lifestyleCategory) newAllocations[lifestyleCategory.id] = 15;
        if (funCategory) newAllocations[funCategory.id] = 10;
        if (debtsCategory) newAllocations[debtsCategory.id] = 5;
        
        // For any remaining categories, distribute remaining percentage
        const allocatedCategories = [essentialsCategory, savingsCategory, lifestyleCategory, funCategory, debtsCategory].filter(Boolean);
        const remainingCategories = mainCategories.filter(cat => !allocatedCategories.includes(cat));
        
        if (remainingCategories.length > 0) {
          const remainingForOthers = Math.max(0, 100 - Object.values(newAllocations).reduce((sum, val) => sum + val, 0));
          const shareForOthers = remainingForOthers / remainingCategories.length;
          remainingCategories.forEach(category => {
            newAllocations[category.id] = shareForOthers;
          });
        }
      }

      // Update categories with new allocations
      const updatePromises = Object.entries(newAllocations).map(async ([categoryId, percentage]) => {
        const response = await fetch(`/api/budget-categories/${categoryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ percentage: parseFloat(percentage.toFixed(2)) }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update category ${categoryId}`);
        }
      });

      await Promise.all(updatePromises);

      // Clear cache and refresh
      CacheUtils.clear(CACHE_KEYS.CATEGORIES);
      CacheUtils.clear(CACHE_KEYS.DASHBOARD);
      fetchData(true);
      setAllocateModalOpen(false);
      setCustomAllocations({});
    } catch (error) {
      console.error("Error allocating budget:", error);
      alert("Failed to allocate budget. Please try again.");
    }
  };

  const handleCustomAllocationChange = (categoryId, value) => {
    setCustomAllocations(prev => ({
      ...prev,
      [categoryId]: parseFloat(value) || 0
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center animate-pulse">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="text-xl font-medium text-gray-700 animate-pulse">Loading Budget...</div>
        </div>
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
          <div className="flex gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Add Category</span>
              <span className="md:hidden">New</span>
            </button>
            <button
              onClick={() => setAllocateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
            >
              <PieChart className="w-4 h-4" />
              <span className="hidden md:inline">
                {totalPercentage > 0 ? "Re-allocate Budget" : "Allocate Budget"}
              </span>
              <span className="md:hidden">
                {totalPercentage > 0 ? "Re-allocate" : "Allocate"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Budget Allocation Overview - Horizontal Layout */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Budget Allocation Overview</h2>
            <p className="text-gray-600 mt-1">
              {dailyIncome > 0 ? `Daily income: ${formatCurrency(dailyIncome)}` : "Set your income to see allocations"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              remainingPercentage >= 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
              {remainingPercentage >= 0 ? `${remainingPercentage.toFixed(1)}% Available` : `${Math.abs(remainingPercentage).toFixed(1)}% Over Budget`}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Budget Allocation</span>
            <span className="text-sm font-bold text-gray-900">{totalPercentage.toFixed(1)}% of 100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                totalPercentage <= 100 ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-red-500 to-orange-600"
              }`}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* First Row - Allocation Summary */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{totalPercentage.toFixed(1)}%</div>
              <div className="text-sm text-blue-700 font-medium">Total Allocated</div>
              <div className="text-xs text-blue-600 mt-1">{formatCurrency((dailyIncome * totalPercentage) / 100)} per day</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{categories.length}</div>
              <div className="text-sm text-green-700 font-medium">Active Categories</div>
              <div className="text-xs text-green-600 mt-1">Budget categories created</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{Math.max(remainingPercentage, 0).toFixed(1)}%</div>
              <div className="text-sm text-purple-700 font-medium">Available to Allocate</div>
              <div className="text-xs text-purple-600 mt-1">{formatCurrency((dailyIncome * Math.max(remainingPercentage, 0)) / 100)} per day</div>
            </div>
          </div>
        </div>

        {/* Second Row - Category Breakdown (Horizontal Scroll) */}
        {categories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {categories
                .filter(cat => !cat.parentId) // Only show main categories
                .map((mainCategory) => {
                  const subcategories = categories.filter(cat => cat.parentId === mainCategory.id);
                  const totalCategoryPercentage = mainCategory.percentage + subcategories.reduce((sum, sub) => sum + sub.percentage, 0);
                  const totalCategoryAmount = (dailyIncome * totalCategoryPercentage) / 100;
                  
                  return (
                    <div key={mainCategory.id} className="flex-shrink-0 w-64 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: mainCategory.color }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{mainCategory.name}</div>
                          {subcategories.length > 0 && (
                            <div className="text-xs text-gray-500">{subcategories.length} subcategories</div>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{totalCategoryPercentage.toFixed(1)}%</div>
                        <div className="text-sm font-medium text-gray-700">of total budget</div>
                        <div className="text-lg font-bold text-gray-900 mt-2">{formatCurrency(totalCategoryAmount)}</div>
                        <div className="text-xs text-gray-600">per day</div>
                      </div>
                      
                      {/* Progress bar for this category */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              backgroundColor: mainCategory.color,
                              width: `${Math.min((totalCategoryPercentage / 100) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {/* Scroll hint */}
            {categories.filter(cat => !cat.parentId).length > 3 && (
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500">← Scroll horizontally to see all categories →</p>
              </div>
            )}
          </div>
        )}
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
          <div className="space-y-6">
            {categories
              .filter(cat => !cat.parentId) // Only show main categories
              .map((mainCategory) => {
                const subcategories = categories.filter(cat => cat.parentId === mainCategory.id);
                const totalSubcategoryPercentage = subcategories.reduce((sum, sub) => sum + sub.percentage, 0);
                const mainAmount = (dailyIncome * mainCategory.percentage) / 100;
                const totalAmount = mainAmount + subcategories.reduce((sum, sub) => sum + (dailyIncome * sub.percentage) / 100, 0);
                
                return (
                  <div key={mainCategory.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Main Category Header */}
                    <div className="bg-gray-50 p-5 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${mainCategory.color}20` }}
                          >
                            {mainCategory.icon || "📁"}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {mainCategory.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {(mainCategory.percentage + totalSubcategoryPercentage).toFixed(2)}% total allocation
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(totalAmount)}
                            </p>
                            <p className="text-xs text-gray-500">per day total</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCategory(mainCategory)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!mainCategory.isPredetermined && (
                              <button
                                onClick={() => handleDeleteCategory(mainCategory.id, mainCategory.name)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main Category Direct Allocation (if any) */}
                    {mainCategory.percentage > 0 && (
                      <div className="p-4 bg-white border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: mainCategory.color }}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Direct Allocation</p>
                              <p className="text-sm text-gray-600">{mainCategory.percentage}% of income</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{formatCurrency(mainAmount)}</p>
                              <p className="text-xs text-gray-500">per day</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditCategory(mainCategory)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit direct allocation"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subcategories */}
                    {subcategories.length > 0 && (
                      <div className="bg-white">
                        {subcategories.map((subcategory, idx) => {
                          const subAmount = (dailyIncome * subcategory.percentage) / 100;
                          return (
                            <div
                              key={subcategory.id}
                              className={`p-4 ${idx < subcategories.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: subcategory.color }}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{subcategory.name}</p>
                                    <p className="text-sm text-gray-600">{subcategory.percentage}% of income</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="font-bold text-gray-900">{formatCurrency(subAmount)}</p>
                                    <p className="text-xs text-gray-500">per day</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleEditCategory(subcategory)}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Edit subcategory"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(subcategory.id, subcategory.name)}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Delete subcategory"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Subcategory Button */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div
                        onClick={() => handleAddSubcategory(mainCategory)}
                        className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm cursor-pointer"
                      >
                        + Add subcategory to {mainCategory.name}
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
        onClose={handleCloseModal}
        onSave={() => {
          // Clear cache and refresh
          CacheUtils.clear(CACHE_KEYS.CATEGORIES);
          CacheUtils.clear(CACHE_KEYS.DASHBOARD);
          fetchData(true);
          handleCloseModal();
        }}
        categories={categories}
        editingCategory={editingCategory}
        selectedParentCategory={selectedParentCategory}
      />

      {/* Allocate Budget Modal */}
      {allocateModalOpen && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {totalPercentage > 0 ? "Re-allocate Budget" : "Allocate Budget"}
              </h3>
              <button
                onClick={() => setAllocateModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">
                Choose how to distribute your budget across categories. 
                {remainingPercentage > 0 ? ` You have ${remainingPercentage.toFixed(1)}% remaining to allocate.` : ` Currently ${totalPercentage.toFixed(1)}% allocated.`}
              </p>
            </div>

            {/* Allocation Method Selection */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Allocation Method</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setAllocateMethod("equal")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    allocateMethod === "equal"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">Equal Distribution</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Distribute remaining budget equally among all categories
                  </div>
                </button>

                <button
                  onClick={() => setAllocateMethod("proportional")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    allocateMethod === "proportional"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">Proportional</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Distribute based on current allocation percentages
                  </div>
                </button>

                <button
                  onClick={() => setAllocateMethod("recommended")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    allocateMethod === "recommended"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">Recommended (50/30/20)</div>
                  <div className="text-sm text-gray-600 mt-1">
                    50% Essentials, 20% Savings, 15% Lifestyle, 10% Fun, 5% Debts
                  </div>
                </button>

                <button
                  onClick={() => setAllocateMethod("custom")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    allocateMethod === "custom"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">Custom</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Set specific percentages for each category
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Allocation Input */}
            {allocateMethod === "custom" && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Custom Allocations</h4>
                <div className="space-y-3">
                  {categories
                    .filter(cat => !cat.parentId)
                    .map((category) => (
                      <div key={category.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-600">
                            Current: {category.percentage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={customAllocations[category.id] || category.percentage}
                            onChange={(e) => handleCustomAllocationChange(category.id, e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <span className="text-gray-600">%</span>
                        </div>
                      </div>
                    ))}
                  
                  {/* Total indicator for custom allocations */}
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-indigo-900">Total Allocation:</span>
                      <span className={`font-bold ${
                        Object.values(customAllocations).reduce((sum, val) => sum + (val || 0), 0) > 100
                          ? "text-red-600"
                          : "text-indigo-600"
                      }`}>
                        {Object.values(customAllocations).reduce((sum, val) => sum + (val || 0), 0).toFixed(1)}%
                      </span>
                    </div>
                    {Object.values(customAllocations).reduce((sum, val) => sum + (val || 0), 0) > 100 && (
                      <div className="text-sm text-red-600 mt-1">
                        ⚠️ Total exceeds 100%. Please adjust the allocations.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Preview</h4>
              <div className="space-y-2">
                {categories
                  .filter(cat => !cat.parentId)
                  .map((category) => {
                    let newPercentage = category.percentage;
                    
                    if (allocateMethod === "equal") {
                      const availablePercentage = Math.max(remainingPercentage, 0);
                      const mainCategories = categories.filter(cat => !cat.parentId);
                      const equalShare = availablePercentage / mainCategories.length;
                      newPercentage = category.percentage + equalShare;
                    } else if (allocateMethod === "proportional") {
                      const availablePercentage = Math.max(remainingPercentage, 0);
                      if (totalPercentage > 0) {
                        const proportion = category.percentage / totalPercentage;
                        newPercentage = category.percentage + (availablePercentage * proportion);
                      } else {
                        const mainCategories = categories.filter(cat => !cat.parentId);
                        const equalShare = availablePercentage / mainCategories.length;
                        newPercentage = equalShare;
                      }
                    } else if (allocateMethod === "custom") {
                      newPercentage = customAllocations[category.id] || category.percentage;
                    } else if (allocateMethod === "recommended") {
                      if (category.slug === "essentials") newPercentage = 50;
                      else if (category.slug === "savings") newPercentage = 20;
                      else if (category.slug === "lifestyle") newPercentage = 15;
                      else if (category.slug === "fun") newPercentage = 10;
                      else if (category.slug === "debts") newPercentage = 5;
                      else {
                        // For custom categories, distribute remaining
                        const mainCategories = categories.filter(cat => !cat.parentId);
                        const predefinedCategories = mainCategories.filter(cat => 
                          ["essentials", "savings", "lifestyle", "fun", "debts"].includes(cat.slug)
                        );
                        const customCategories = mainCategories.filter(cat => 
                          !["essentials", "savings", "lifestyle", "fun", "debts"].includes(cat.slug)
                        );
                        if (customCategories.length > 0) {
                          newPercentage = 0; // Will be calculated based on remaining
                        }
                      }
                    }

                    const dailyAmount = (dailyIncome * newPercentage) / 100;

                    return (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {category.percentage.toFixed(1)}% → {newPercentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(dailyAmount)} per day
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setAllocateModalOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocateBudget}
                disabled={
                  allocateMethod === "custom" && 
                  Object.values(customAllocations).reduce((sum, val) => sum + (val || 0), 0) > 100
                }
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
