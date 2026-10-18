import { prisma } from "../../lib/prisma";

const getPolicy = async (departmentId?: string | null) => {
  if (departmentId) {
    const deptPolicy = await prisma.approvalPolicy.findUnique({
      where: { departmentId },
      include: { department: { select: { id: true, name: true } } },
    });
    if (deptPolicy) return deptPolicy;
  }

  // Global default policy
  const globalPolicy = await prisma.approvalPolicy.findFirst({
    where: { departmentId: null },
  });

  if (globalPolicy) return globalPolicy;

  // If no policy exists yet, create default 500
  return prisma.approvalPolicy.create({
    data: {
      thresholdAmount: 500,
      departmentId: null,
    },
  });
};

const getAllPolicies = async () => {
  return prisma.approvalPolicy.findMany({
    include: {
      department: {
        select: { id: true, name: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
};

const updatePolicy = async (payload: {
  thresholdAmount: number;
  departmentId?: string | null;
}) => {
  const deptId = payload.departmentId || null;

  const existing = await prisma.approvalPolicy.findFirst({
    where: { departmentId: deptId },
  });

  if (existing) {
    return prisma.approvalPolicy.update({
      where: { id: existing.id },
      data: {
        thresholdAmount: payload.thresholdAmount,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
    });
  }

  return prisma.approvalPolicy.create({
    data: {
      thresholdAmount: payload.thresholdAmount,
      departmentId: deptId,
    },
    include: {
      department: {
        select: { id: true, name: true },
      },
    },
  });
};

export const PolicyService = {
  getPolicy,
  getAllPolicies,
  updatePolicy,
};
