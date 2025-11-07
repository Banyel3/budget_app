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

    // Create repayment
    const repayment = await prisma.debtRepayment.create({
      data: {
        debtId: id,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        note,
      },
    });

    // Update debt's current balance
    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: {
        currentBalance: {
          decrement: parseFloat(amount),
        },
      },
    });

    // Check if debt is fully paid
    if (updatedDebt.currentBalance <= 0) {
      await prisma.debt.update({
        where: { id },
        data: { isPaid: true, currentBalance: 0 },
      });
    }

    return NextResponse.json(repayment, { status: 201 });
  } catch (error) {
    console.error("Error adding repayment:", error);
    return NextResponse.json(
      { error: "Failed to add repayment" },
      { status: 500 }
    );
  }
}
