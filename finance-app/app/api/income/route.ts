import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const incomes = await prisma.income.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(incomes);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    return NextResponse.json(
      { error: "Failed to fetch incomes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, frequency, startDate } = body;

    // Deactivate previous active income
    await prisma.income.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const income = await prisma.income.create({
      data: {
        amount: parseFloat(amount),
        frequency,
        startDate: startDate ? new Date(startDate) : new Date(),
        isActive: true,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json(
      { error: "Failed to create income" },
      { status: 500 }
    );
  }
}
