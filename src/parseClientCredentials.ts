import type { Request } from "express";

export interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

export default function parseClientCredentials(req: Request): ClientCredentials | null {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) {
      return null;
    }
    return {
      clientId: decoded.slice(0, separatorIndex),
      clientSecret: decoded.slice(separatorIndex + 1),
    };
  }

  const { client_id: clientId, client_secret: clientSecret } = req.body ?? {};
  if (typeof clientId === "string" && typeof clientSecret === "string") {
    return { clientId, clientSecret };
  }

  return null;
}
