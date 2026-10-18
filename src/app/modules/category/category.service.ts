import status from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const createCategory = async (payload: {
  name: string;
  taxRate: number;
  isActive?: boolean;
}) => {
  const existing = await prisma.category.findUnique({
    where: { name: payload.name },
  });

  if (existing) {
    throw new AppError(status.CONFLICT, "A category with this name already exists");
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name,
      taxRate: payload.taxRate,
      isActive: payload.isActive ?? true,
    },
  });

  return category;
};

const getAllCategories = async (includeInactive = false) => {
  const categories = await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
  });

  return categories;
};

const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { expenses: true },
      },
    },
  });

  if (!category) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  return category;
};

const updateCategory = async (
  id: string,
  payload: {
    name?: string;
    taxRate?: number;
    isActive?: boolean;
  },
) => {
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  if (payload.name && payload.name !== existing.name) {
    const duplicate = await prisma.category.findUnique({
      where: { name: payload.name },
    });
    if (duplicate) {
      throw new AppError(status.CONFLICT, "A category with this name already exists");
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(payload.name && { name: payload.name }),
      ...(payload.taxRate !== undefined && { taxRate: payload.taxRate }),
      ...(payload.isActive !== undefined && { isActive: payload.isActive }),
    },
  });

  return updated;
};

const deleteCategory = async (id: string) => {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { expenses: true },
      },
    },
  });

  if (!existing) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  if (existing._count.expenses > 0) {
    // If it has expenses, soft delete by deactivating
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  await prisma.category.delete({
    where: { id },
  });

  return { message: "Category deleted successfully" };
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
