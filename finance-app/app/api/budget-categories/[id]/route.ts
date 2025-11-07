import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if category exists and if it's predetermined
    const existingCategory = await prisma.budgetCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Prevent editing name and slug of predetermined categories
    const updateData: any = {
      percentage: body.percentage ? parseFloat(body.percentage) : undefined,
      color: body.color,
      icon: body.icon,
      order: body.order,
      isActive: body.isActive,
    };

    // Only allow name changes for non-predetermined categories
    if (!existingCategory.isPredetermined) {
      updateData.name = body.name;
    }

    // Allow parentId changes for non-predetermined categories
    if (!existingCategory.isPredetermined && body.parentId !== undefined) {
      updateData.parentId = body.parentId || null;
    }

    const category = await prisma.budgetCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating budget category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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
    
    // Check if category exists and if it's predetermined
    const category = await prisma.budgetCategory.findUnique({
      where: { id },
      include: { subcategories: true }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of predetermined main categories
    if (category.isPredetermined) {
      return NextResponse.json(
        { error: "Cannot delete predetermined categories" },
        { status: 400 }
      );
    }

    // Check if category has subcategories
    if (category.subcategories.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories. Delete subcategories first." },
        { status: 400 }
      );
    }

    await prisma.budgetCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
