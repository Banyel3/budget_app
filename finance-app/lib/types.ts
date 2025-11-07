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
