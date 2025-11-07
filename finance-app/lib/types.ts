export type FrequencyType = "daily" | "weekly" | "monthly";

export interface Income {
  id: string;
  amount: number;
  frequency: FrequencyType;
  isActive: boolean;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCategory {
  id: string;
  name: string;
  percentage: number;
  color: string;
  icon?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  description?: string;
  targetDate?: Date;
  color: string;
  icon?: string;
  isCompleted: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Debt {
  id: string;
  name: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  repaymentAmount: number;
  repaymentFrequency: FrequencyType;
  startDate: Date;
  dueDate?: Date;
  isPaid: boolean;
  isActive: boolean;
  creditor?: string;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardData {
  income: Income | null;
  dailyIncome: number;
  categories: {
    name: string;
    percentage: number;
    amount: number;
    color: string;
  }[];
  totalBudgetPercentage: number;
  savingsGoals: SavingsGoal[];
  totalSavings: number;
  totalSavingsTarget: number;
  savingsProgress: number;
  debts: Debt[];
  totalDebt: number;
  completedGoals: number;
  activeGoals: number;
  activeDebts: number;
}

export interface CacheConfig {
  key: string;
  ttl: number; // Time to live in milliseconds
  version: string;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  version: string;
  ttl: number;
}

// Cache utility functions
export const CacheUtils = {
  set: <T>(key: string, data: T, ttl: number = 5 * 60 * 1000, version: string = '1.0'): void => {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version,
        ttl
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  },

  get: <T>(key: string, currentVersion: string = '1.0'): T | null => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData: CachedData<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired or version mismatch
      if (now - cacheData.timestamp > cacheData.ttl || cacheData.version !== currentVersion) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      localStorage.removeItem(key);
      return null;
    }
  },

  clear: (key: string): void => {
    localStorage.removeItem(key);
  },

  clearAll: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('finance_app_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// Cache keys
export const CACHE_KEYS = {
  DASHBOARD: 'finance_app_dashboard',
  CATEGORIES: 'finance_app_categories',
  INCOME: 'finance_app_income',
  SAVINGS_GOALS: 'finance_app_savings_goals',
  DEBTS: 'finance_app_debts',
  USER_PREFERENCES: 'finance_app_preferences'
};

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,    // 2 minutes
  MEDIUM: 5 * 60 * 1000,   // 5 minutes  
  LONG: 15 * 60 * 1000,    // 15 minutes
  VERY_LONG: 60 * 60 * 1000 // 1 hour
};
