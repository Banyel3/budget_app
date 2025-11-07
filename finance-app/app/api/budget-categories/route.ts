import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.budgetCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        allocations: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching budget categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, percentage, color, icon, order } = body;

    const category = await prisma.budgetCategory.create({
      data: {
        name,
        percentage: parseFloat(percentage),
        color: color || "#3b82f6",
        icon,
        order: order || 0,
        isActive: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating budget category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
