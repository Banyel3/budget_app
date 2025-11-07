import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        repayments: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!debt) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    return NextResponse.json(debt);
  } catch (error) {
    console.error("Error fetching debt:", error);
    return NextResponse.json(
      { error: "Failed to fetch debt" },
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

    const debt = await prisma.debt.update({
      where: { id },
      data: {
        name: body.name,
        principalAmount: body.principalAmount
          ? parseFloat(body.principalAmount)
          : undefined,
        currentBalance: body.currentBalance
          ? parseFloat(body.currentBalance)
          : undefined,
        interestRate:
          body.interestRate !== undefined
            ? parseFloat(body.interestRate)
            : undefined,
        repaymentAmount: body.repaymentAmount
          ? parseFloat(body.repaymentAmount)
          : undefined,
        repaymentFrequency: body.repaymentFrequency,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        creditor: body.creditor,
        description: body.description,
        color: body.color,
        isPaid: body.isPaid,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(debt);
  } catch (error) {
    console.error("Error updating debt:", error);
    return NextResponse.json(
      { error: "Failed to update debt" },
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
    await prisma.debt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting debt:", error);
    return NextResponse.json(
      { error: "Failed to delete debt" },
      { status: 500 }
    );
  }
}
