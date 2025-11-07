import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Ensure predetermined categories exist
    await ensurePredeterminedCategories();
    
    const categories = await prisma.budgetCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        allocations: {
          orderBy: { date: "desc" },
          take: 1,
        },
        subcategories: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        parent: true,
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

async function ensurePredeterminedCategories() {
  const predeterminedCategories = [
    { name: "Debts", slug: "debts", color: "#ef4444", icon: "💳", order: 1 },
    { name: "Savings", slug: "savings", color: "#10b981", icon: "💰", order: 2 },
    { name: "Essentials", slug: "essentials", color: "#3b82f6", icon: "🏠", order: 3 },
    { name: "Lifestyle", slug: "lifestyle", color: "#8b5cf6", icon: "🎯", order: 4 },
    { name: "Fun", slug: "fun", color: "#f59e0b", icon: "🎉", order: 5 },
  ];

  for (const category of predeterminedCategories) {
    await prisma.budgetCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        ...category,
        percentage: 0,
        isPredetermined: true,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, percentage, color, icon, order, parentId } = body;

    const category = await prisma.budgetCategory.create({
      data: {
        name,
        percentage: parseFloat(percentage),
        color: color || "#3b82f6",
        icon,
        order: order || 0,
        parentId: parentId || null,
        isPredetermined: false,
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
