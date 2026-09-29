import path from "node:path";

export interface AppConfig {
  port: number;
  clientId: string;
  clientSecret: string;
  tokenTtlSeconds: number;
  strictMtls: boolean;
  tlsKeyPath: string;
  tlsCertPath: string;
  tlsCaPath: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default function loadConfig(): AppConfig {
  const certsDir = path.resolve(process.cwd(), "certs");

  return {
    port: Number(process.env.PORT ?? 8443),
    clientId: requireEnv("CLIENT_ID"),
    clientSecret: requireEnv("CLIENT_SECRET"),
    tokenTtlSeconds: Number(process.env.TOKEN_TTL_SECONDS ?? 3600),
    strictMtls: process.env.STRICT_MTLS === "true",
    tlsKeyPath: process.env.TLS_KEY_PATH ?? path.join(certsDir, "server.key"),
    tlsCertPath: process.env.TLS_CERT_PATH ?? path.join(certsDir, "server.crt"),
    tlsCaPath: process.env.TLS_CA_PATH ?? path.join(certsDir, "ca.crt"),
  };
}
