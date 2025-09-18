import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface customJwtPayload extends JwtPayload {
  userId: string;
}

const useMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers["authorization"];
  const token = header?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token not found",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as customJwtPayload;
    if (!decoded) {
      return res.status(401).json({
        message: "Invalid Token",
      });
    }

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid Token",
    });
  }
};

export default useMiddleware;
