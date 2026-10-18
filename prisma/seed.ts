import bcrypt from "bcryptjs";
import { prisma } from "../src/app/lib/prisma";
import { logger } from "../src/app/utils/logger";

async function main() {
  logger.info("🌱 Seeding database for ExpenseIQ...");

  // 1. Categories with tax rates
  const categories = [
    { name: "Travel", taxRate: 10.0 },
    { name: "Meals & Entertainment", taxRate: 15.0 },
    { name: "Office Supplies", taxRate: 5.0 },
    { name: "Software & Subscriptions", taxRate: 0.0 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { taxRate: cat.taxRate },
      create: { name: cat.name, taxRate: cat.taxRate },
    });
  }
  logger.info("✅ Categories seeded");

  // 2. Departments with monthly budgets
  const engineeringDept = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: { monthlyBudget: 50000.0 },
    create: { name: "Engineering", monthlyBudget: 50000.0 },
  });

  const financeDept = await prisma.department.upsert({
    where: { name: "Finance & Ops" },
    update: { monthlyBudget: 30000.0 },
    create: { name: "Finance & Ops", monthlyBudget: 30000.0 },
  });

  await prisma.department.upsert({
    where: { name: "Sales & Marketing" },
    update: { monthlyBudget: 20000.0 },
    create: { name: "Sales & Marketing", monthlyBudget: 20000.0 },
  });
  logger.info("✅ Departments seeded");

  // 3. Global Approval Policy (departmentId = null)
  const existingGlobalPolicy = await prisma.approvalPolicy.findFirst({
    where: { departmentId: null },
  });

  if (existingGlobalPolicy) {
    await prisma.approvalPolicy.update({
      where: { id: existingGlobalPolicy.id },
      data: { thresholdAmount: 500.0 },
    });
  } else {
    await prisma.approvalPolicy.create({
      data: { departmentId: null, thresholdAmount: 500.0 },
    });
  }
  logger.info("✅ Global approval policy seeded (threshold: 500)");

  // 4. Demo Users per role
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash("Password123!", salt);

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@expenseiq.com" },
    update: { role: "ADMIN", departmentId: engineeringDept.id, passwordHash: commonPasswordHash, isActive: true },
    create: {
      name: "System Admin",
      email: "admin@expenseiq.com",
      passwordHash: commonPasswordHash,
      role: "ADMIN",
      departmentId: engineeringDept.id,
      isActive: true,
    },
  });

  // Finance
  await prisma.user.upsert({
    where: { email: "finance@expenseiq.com" },
    update: { role: "FINANCE", departmentId: financeDept.id, passwordHash: commonPasswordHash, isActive: true },
    create: {
      name: "Fiona Finance",
      email: "finance@expenseiq.com",
      passwordHash: commonPasswordHash,
      role: "FINANCE",
      departmentId: financeDept.id,
      isActive: true,
    },
  });

  // Department Head (Engineering)
  const headUser = await prisma.user.upsert({
    where: { email: "head@expenseiq.com" },
    update: { role: "DEPT_HEAD", departmentId: engineeringDept.id, passwordHash: commonPasswordHash, isActive: true },
    create: {
      name: "Harry Head",
      email: "head@expenseiq.com",
      passwordHash: commonPasswordHash,
      role: "DEPT_HEAD",
      departmentId: engineeringDept.id,
      isActive: true,
    },
  });

  // Set headId on Engineering department
  await prisma.department.update({
    where: { id: engineeringDept.id },
    data: { headId: headUser.id },
  });

  // Manager (Engineering, reports to headUser)
  const managerUser = await prisma.user.upsert({
    where: { email: "manager@expenseiq.com" },
    update: {
      role: "MANAGER",
      departmentId: engineeringDept.id,
      passwordHash: commonPasswordHash,
      managerId: headUser.id,
      isActive: true,
    },
    create: {
      name: "Mike Manager",
      email: "manager@expenseiq.com",
      passwordHash: commonPasswordHash,
      role: "MANAGER",
      departmentId: engineeringDept.id,
      managerId: headUser.id,
      isActive: true,
    },
  });

  // Employee (Engineering, reports to managerUser)
  await prisma.user.upsert({
    where: { email: "employee@expenseiq.com" },
    update: {
      role: "EMPLOYEE",
      departmentId: engineeringDept.id,
      passwordHash: commonPasswordHash,
      managerId: managerUser.id,
      isActive: true,
    },
    create: {
      name: "Emma Employee",
      email: "employee@expenseiq.com",
      passwordHash: commonPasswordHash,
      role: "EMPLOYEE",
      departmentId: engineeringDept.id,
      managerId: managerUser.id,
      isActive: true,
    },
  });

  // Inactive User (for testing inactive login prevention)
  await prisma.user.upsert({
    where: { email: "inactive@expenseiq.com" },
    update: {
      role: "EMPLOYEE",
      departmentId: engineeringDept.id,
      passwordHash: commonPasswordHash,
      isActive: false,
    },
    create: {
      name: "Ian Inactive",
      email: "inactive@expenseiq.com",
      passwordHash: commonPasswordHash,
      role: "EMPLOYEE",
      departmentId: engineeringDept.id,
      isActive: false,
    },
  });

  logger.info("✅ Demo users seeded successfully");
  logger.info("🚀 Seeding completed successfully!");
}

main()
  .catch((e) => {
    logger.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
