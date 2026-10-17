import { Router } from "express";

const router = Router();

const moduleRoutes: { path: string; route: Router }[] = [
  // Future modules:
  // { path: "/auth", route: AuthRoutes },
  // { path: "/users", route: UserRoutes },
  // { path: "/departments", route: DepartmentRoutes },
  // { path: "/categories", route: CategoryRoutes },
  // { path: "/expenses", route: ExpenseRoutes },
  // { path: "/approvals", route: ApprovalRoutes },
  // { path: "/notifications", route: NotificationRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const IndexRoutes = router;
