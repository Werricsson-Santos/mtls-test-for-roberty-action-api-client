import type { NextFunction, Request, Response } from "express";
import type { TLSSocket } from "node:tls";

export default function verifyClientCertificate(req: Request, res: Response, next: NextFunction): void {
  const socket = req.socket as TLSSocket;
  const certificate = socket.getPeerCertificate();

  if (!socket.authorized || !certificate || Object.keys(certificate).length === 0) {
    res.status(401).json({
      error: "invalid_client",
      error_description: "a valid mTLS client certificate is required",
    });
    return;
  }

  next();
}
