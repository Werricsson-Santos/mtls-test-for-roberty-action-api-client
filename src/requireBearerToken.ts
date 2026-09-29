import type { NextFunction, Request, Response } from "express";
import type TokenService from "./tokenService";

export default function createRequireBearerToken(tokenService: TokenService) {
  return function requireBearerToken(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token || !tokenService.isValid(token)) {
      res.status(401).json({
        error: "invalid_token",
        error_description: "missing, invalid or expired access token",
      });
      return;
    }

    next();
  };
}
