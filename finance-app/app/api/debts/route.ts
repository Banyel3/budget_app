import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const debts = await prisma.debt.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        repayments: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    });
    return NextResponse.json(debts);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json(
      { error: "Failed to fetch debts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      principalAmount,
      interestRate,
      repaymentAmount,
      repaymentFrequency,
      startDate,
      dueDate,
      creditor,
      description,
      color,
    } = body;

    const debt = await prisma.debt.create({
      data: {
        name,
        principalAmount: parseFloat(principalAmount),
        currentBalance: parseFloat(principalAmount),
        interestRate: interestRate ? parseFloat(interestRate) : 0,
        repaymentAmount: parseFloat(repaymentAmount),
        repaymentFrequency,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        creditor,
        description,
        color: color || "#ef4444",
        isPaid: false,
        isActive: true,
      },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    console.error("Error creating debt:", error);
    return NextResponse.json(
      { error: "Failed to create debt" },
      { status: 500 }
    );
  }
}
