import bcrypt from "bcryptjs";
import status from "http-status";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { envVars } from "../../config/env";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const loginUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new AppError(status.UNAUTHORIZED, "Account is deactivated. Please contact admin.");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatched) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
  };

  const token = jwt.sign(jwtPayload, envVars.JWT.SECRET, {
    expiresIn: envVars.JWT.EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  // Exclude passwordHash from response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userProfile } = user;

  return {
    token,
    user: userProfile,
  };
};

const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  role: Role;
  departmentId: string;
  managerId?: string | null;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(status.CONFLICT, "User with this email already exists");
  }

  const department = await prisma.department.findUnique({
    where: { id: payload.departmentId },
  });

  if (!department) {
    throw new AppError(status.NOT_FOUND, "Department not found with provided departmentId");
  }

  if (payload.managerId) {
    const manager = await prisma.user.findUnique({
      where: { id: payload.managerId },
    });
    if (!manager) {
      throw new AppError(status.NOT_FOUND, "Manager not found with provided managerId");
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(payload.password, salt);

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: payload.role,
      departmentId: payload.departmentId,
      managerId: payload.managerId || null,
      isActive: true,
    },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...createdUserProfile } = newUser;

  return createdUserProfile;
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          monthlyBudget: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      headOf: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User profile not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userProfile } = user;

  return userProfile;
};

export const AuthService = {
  loginUser,
  registerUser,
  getMe,
};
