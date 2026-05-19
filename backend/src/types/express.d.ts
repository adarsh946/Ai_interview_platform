import express from "express";
import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

declare global {
  namespace Express {
    interface User extends User {
      id: string;
    } // passport attaches this
  }
}
