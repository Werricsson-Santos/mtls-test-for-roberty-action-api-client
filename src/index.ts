import "dotenv/config";
import { readFileSync } from "node:fs";
import { createServer } from "node:https";
import createApp from "./server";
import loadConfig from "./config";

const config = loadConfig();
const app = createApp(config);

const httpsServer = createServer(
  {
    key: readFileSync(config.tlsKeyPath),
    cert: readFileSync(config.tlsCertPath),
    ca: [readFileSync(config.tlsCaPath)],
    requestCert: true,
    rejectUnauthorized: config.strictMtls,
  },
  app,
);

httpsServer.listen(config.port, () => {
  console.log(`mTLS test API listening on https://localhost:${config.port}`);
});
