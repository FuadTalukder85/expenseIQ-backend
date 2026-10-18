import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { CategoryRoutes } from "../modules/category/category.route";
import { DepartmentRoutes } from "../modules/department/department.route";
import { ExpenseRoutes } from "../modules/expense/expense.route";
import { PolicyRoutes } from "../modules/policy/policy.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

const moduleRoutes: { path: string; route: Router }[] = [
  { path: "/auth", route: AuthRoutes },
  { path: "/departments", route: DepartmentRoutes },
  { path: "/categories", route: CategoryRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/approval-policy", route: PolicyRoutes },
  { path: "/expenses", route: ExpenseRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const IndexRoutes = router;
