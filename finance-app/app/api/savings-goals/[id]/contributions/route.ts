import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, date, note } = body;

    // Create contribution
    const contribution = await prisma.savingsContribution.create({
      data: {
        goalId: id,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        note,
      },
    });

    // Update goal's current amount
    await prisma.savingsGoal.update({
      where: { id },
      data: {
        currentAmount: {
          increment: parseFloat(amount),
        },
      },
    });

    // Check if goal is completed
    const goal = await prisma.savingsGoal.findUnique({
      where: { id },
    });

    if (goal && goal.currentAmount >= goal.targetAmount) {
      await prisma.savingsGoal.update({
        where: { id },
        data: { isCompleted: true },
      });
    }

    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    console.error("Error adding contribution:", error);
    return NextResponse.json(
      { error: "Failed to add contribution" },
      { status: 500 }
    );
  }
}
