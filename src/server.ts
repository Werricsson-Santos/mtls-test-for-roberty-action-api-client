import express from "express";
import type { TLSSocket } from "node:tls";
import type { AppConfig } from "./config";
import createOauthTokenHandler from "./oauthTokenHandler";
import createRequireBearerToken from "./requireBearerToken";
import TokenService from "./tokenService";
import verifyClientCertificate from "./verifyClientCertificate";

export default function createApp(config: AppConfig): express.Express {
  const app = express();
  const tokenService = new TokenService(config.tokenTtlSeconds);

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.post("/oauth/token", verifyClientCertificate, createOauthTokenHandler(config, tokenService));

  // Requires the client certificate AND a valid bearer token from /oauth/token.
  app.get("/api/whoami", verifyClientCertificate, createRequireBearerToken(tokenService), (req, res) => {
    const peer = (req.socket as TLSSocket).getPeerCertificate();
    res.status(200).json({ client: peer.subject?.CN, message: "authenticated" });
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  return app;
}
