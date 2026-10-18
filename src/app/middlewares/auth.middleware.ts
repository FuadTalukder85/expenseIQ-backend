import { NextFunction, Request, Response } from "express";
import status from "http-status";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { envVars } from "../config/env";
import AppError from "../errors/AppError";
import { prisma } from "../lib/prisma";
import { IAuthUser } from "../types/express";

export const auth = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError(status.UNAUTHORIZED, "No authorization token provided");
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        throw new AppError(status.UNAUTHORIZED, "Invalid authorization header format");
      }

      let decoded: IAuthUser;
      try {
        decoded = jwt.verify(token, envVars.JWT.SECRET) as IAuthUser;
      } catch {
        throw new AppError(status.UNAUTHORIZED, "Invalid or expired token");
      }

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          departmentId: true,
        },
      });

      if (!user) {
        throw new AppError(status.UNAUTHORIZED, "User account no longer exists");
      }

      if (!user.isActive) {
        throw new AppError(status.UNAUTHORIZED, "Account is deactivated. Please contact admin.");
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(status.UNAUTHORIZED, "You must be logged in to perform this action");
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        throw new AppError(status.FORBIDDEN, `Forbidden: You do not have permission to access this resource`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
