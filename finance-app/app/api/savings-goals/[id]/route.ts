import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const goal = await prisma.savingsGoal.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error fetching savings goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        name: body.name,
        targetAmount: body.targetAmount
          ? parseFloat(body.targetAmount)
          : undefined,
        currentAmount: body.currentAmount
          ? parseFloat(body.currentAmount)
          : undefined,
        description: body.description,
        targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
        color: body.color,
        icon: body.icon,
        order: body.order,
        isCompleted: body.isCompleted,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error updating savings goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.savingsGoal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
