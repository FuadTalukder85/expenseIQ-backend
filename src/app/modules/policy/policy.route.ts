import { Router } from "express";
import { Role } from "@prisma/client";
import { auth, authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { PolicyController } from "./policy.controller";
import { PolicyValidation } from "./policy.validation";

const router = Router();

router.get("/", auth(), PolicyController.getPolicy);
router.get("/all", auth(), authorize(Role.ADMIN), PolicyController.getAllPolicies);

router.patch(
  "/",
  auth(),
  authorize(Role.ADMIN),
  validateRequest(PolicyValidation.updatePolicyZodSchema),
  PolicyController.updatePolicy,
);

export const PolicyRoutes = router;
