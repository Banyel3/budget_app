import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        contributions: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, targetAmount, description, targetDate, color, icon, order } =
      body;

    const goal = await prisma.savingsGoal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        description,
        targetDate: targetDate ? new Date(targetDate) : null,
        color: color || "#10b981",
        icon,
        order: order || 0,
        currentAmount: 0,
        isActive: true,
        isCompleted: false,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating savings goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
