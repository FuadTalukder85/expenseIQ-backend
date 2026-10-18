import status from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const createDepartment = async (payload: {
  name: string;
  monthlyBudget: number;
  headId?: string | null;
}) => {
  const existing = await prisma.department.findUnique({
    where: { name: payload.name },
  });

  if (existing) {
    throw new AppError(status.CONFLICT, "A department with this name already exists");
  }

  if (payload.headId) {
    const headUser = await prisma.user.findUnique({
      where: { id: payload.headId },
    });
    if (!headUser) {
      throw new AppError(status.NOT_FOUND, "Assigned department head user not found");
    }
  }

  const department = await prisma.department.create({
    data: {
      name: payload.name,
      monthlyBudget: payload.monthlyBudget,
      headId: payload.headId || null,
    },
    include: {
      head: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return department;
};

const getAllDepartments = async () => {
  const departments = await prisma.department.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      head: {
        select: { id: true, name: true, email: true, role: true },
      },
      _count: {
        select: { members: true, expenses: true },
      },
    },
  });

  return departments;
};

const getDepartmentById = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      head: {
        select: { id: true, name: true, email: true, role: true },
      },
      members: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
      policy: true,
      _count: {
        select: { members: true, expenses: true },
      },
    },
  });

  if (!department) {
    throw new AppError(status.NOT_FOUND, "Department not found");
  }

  return department;
};

const updateDepartment = async (
  id: string,
  payload: {
    name?: string;
    monthlyBudget?: number;
    headId?: string | null;
  },
) => {
  const existing = await prisma.department.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(status.NOT_FOUND, "Department not found");
  }

  if (payload.name && payload.name !== existing.name) {
    const duplicate = await prisma.department.findUnique({
      where: { name: payload.name },
    });
    if (duplicate) {
      throw new AppError(status.CONFLICT, "A department with this name already exists");
    }
  }

  if (payload.headId) {
    const headUser = await prisma.user.findUnique({
      where: { id: payload.headId },
    });
    if (!headUser) {
      throw new AppError(status.NOT_FOUND, "Assigned department head user not found");
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      ...(payload.name && { name: payload.name }),
      ...(payload.monthlyBudget !== undefined && { monthlyBudget: payload.monthlyBudget }),
      ...(payload.headId !== undefined && { headId: payload.headId }),
    },
    include: {
      head: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return updated;
};

const deleteDepartment = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  if (!department) {
    throw new AppError(status.NOT_FOUND, "Department not found");
  }

  // Check list requirement: "Department with users cannot be deleted"
  if (department._count.members > 0) {
    throw new AppError(status.BAD_REQUEST, "Department with users cannot be deleted");
  }

  await prisma.department.delete({
    where: { id },
  });

  return { message: "Department deleted successfully" };
};

export const DepartmentService = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
