import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get active income
    const activeIncome = await prisma.income.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Get budget categories with allocations
    const categories = await prisma.budgetCategory.findMany({
      where: { isActive: true },
      include: {
        allocations: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    // Get active savings goals
    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    // Get active debts
    const debts = await prisma.debt.findMany({
      where: { isActive: true, isPaid: false },
      orderBy: { dueDate: "asc" },
    });

    // Calculate totals
    const totalSavings = savingsGoals.reduce(
      (sum, goal) => sum + goal.currentAmount,
      0
    );

    const totalSavingsTarget = savingsGoals.reduce(
      (sum, goal) => sum + goal.targetAmount,
      0
    );

    const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);

    // Calculate daily budget if income exists
    let dailyIncome = 0;
    if (activeIncome) {
      switch (activeIncome.frequency) {
        case "daily":
          dailyIncome = activeIncome.amount;
          break;
        case "weekly":
          dailyIncome = activeIncome.amount / 7;
          break;
        case "monthly":
          dailyIncome = activeIncome.amount / 30;
          break;
      }
    }

    // Calculate budget allocations
    const budgetAllocations = categories.map((category) => ({
      name: category.name,
      percentage: category.percentage,
      amount: (dailyIncome * category.percentage) / 100,
      color: category.color,
    }));

    const totalBudgetPercentage = categories.reduce(
      (sum, cat) => sum + cat.percentage,
      0
    );

    return NextResponse.json({
      income: activeIncome,
      dailyIncome,
      categories: budgetAllocations,
      totalBudgetPercentage,
      savingsGoals,
      totalSavings,
      totalSavingsTarget,
      savingsProgress:
        totalSavingsTarget > 0 ? (totalSavings / totalSavingsTarget) * 100 : 0,
      debts,
      totalDebt,
      completedGoals: savingsGoals.filter((g) => g.isCompleted).length,
      activeGoals: savingsGoals.filter((g) => !g.isCompleted).length,
      activeDebts: debts.length,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
