import type { Request, Response } from "express";
import type { AppConfig } from "./config";
import parseClientCredentials from "./parseClientCredentials";
import type TokenService from "./tokenService";

export default function createOauthTokenHandler(config: AppConfig, tokenService: TokenService) {
  return function oauthTokenHandler(req: Request, res: Response): void {
    if (req.body?.grant_type !== "client_credentials") {
      res.status(400).json({
        error: "unsupported_grant_type",
        error_description: "only grant_type=client_credentials is supported",
      });
      return;
    }

    const credentials = parseClientCredentials(req);
    const isValidClient =
      credentials?.clientId === config.clientId && credentials?.clientSecret === config.clientSecret;

    if (!isValidClient) {
      res.status(401).json({
        error: "invalid_client",
        error_description: "invalid client_id or client_secret",
      });
      return;
    }

    const { accessToken, expiresIn } = tokenService.issueToken();
    res.status(200).json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
    });
  };
}
