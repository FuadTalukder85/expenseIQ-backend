import { Role } from "@prisma/client";

export interface IAuthUser {
  id: string;
  email: string;
  role: Role;
  departmentId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
