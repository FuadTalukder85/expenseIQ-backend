import bcryptjs from "bcryptjs";
import status from "http-status";
import { Role } from "@prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const createUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role: Role;
  departmentId: string;
  managerId?: string | null;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });

  if (existing) {
    throw new AppError(status.CONFLICT, "A user with this email already exists");
  }

  const department = await prisma.department.findUnique({
    where: { id: payload.departmentId },
  });

  if (!department) {
    throw new AppError(status.NOT_FOUND, "Specified department not found");
  }

  if (payload.managerId) {
    const manager = await prisma.user.findUnique({
      where: { id: payload.managerId },
    });
    if (!manager) {
      throw new AppError(status.NOT_FOUND, "Specified manager not found");
    }
  }

  const passwordHash = await bcryptjs.hash(payload.password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: payload.role,
      departmentId: payload.departmentId,
      managerId: payload.managerId || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      departmentId: true,
      department: {
        select: { id: true, name: true },
      },
      managerId: true,
      manager: {
        select: { id: true, name: true, email: true, role: true },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return newUser;
};

const getAllUsers = async (query: {
  role?: Role;
  departmentId?: string;
  search?: string;
}) => {
  const { role, departmentId, search } = query;

  const whereConditions: Record<string, unknown> = {};

  if (role) {
    whereConditions.role = role;
  }

  if (departmentId) {
    whereConditions.departmentId = departmentId;
  }

  if (search) {
    whereConditions.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where: whereConditions,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      departmentId: true,
      department: {
        select: { id: true, name: true },
      },
      managerId: true,
      manager: {
        select: { id: true, name: true, email: true, role: true },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return users;
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      departmentId: true,
      department: {
        select: { id: true, name: true, monthlyBudget: true },
      },
      managerId: true,
      manager: {
        select: { id: true, name: true, email: true, role: true },
      },
      reports: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return user;
};

const updateUser = async (
  id: string,
  payload: {
    name?: string;
    role?: Role;
    departmentId?: string;
    managerId?: string | null;
    isActive?: boolean;
  },
) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (payload.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: payload.departmentId },
    });
    if (!department) {
      throw new AppError(status.NOT_FOUND, "Specified department not found");
    }
  }

  if (payload.managerId) {
    if (payload.managerId === id) {
      throw new AppError(status.BAD_REQUEST, "A user cannot be their own manager");
    }
    const manager = await prisma.user.findUnique({
      where: { id: payload.managerId },
    });
    if (!manager) {
      throw new AppError(status.NOT_FOUND, "Specified manager not found");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(payload.name && { name: payload.name }),
      ...(payload.role && { role: payload.role }),
      ...(payload.departmentId && { departmentId: payload.departmentId }),
      ...(payload.managerId !== undefined && { managerId: payload.managerId }),
      ...(payload.isActive !== undefined && { isActive: payload.isActive }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      departmentId: true,
      department: {
        select: { id: true, name: true },
      },
      managerId: true,
      manager: {
        select: { id: true, name: true, email: true, role: true },
      },
      updatedAt: true,
    },
  });

  return updatedUser;
};

const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Deactivate user rather than breaking foreign keys if expenses exist
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: "User account deactivated successfully" };
};

export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
