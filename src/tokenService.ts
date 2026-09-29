import { randomBytes } from "node:crypto";

interface IssuedToken {
  expiresAt: number;
}

interface TokenResult {
  accessToken: string;
  expiresIn: number;
}

export default class TokenService {
  private readonly tokens = new Map<string, IssuedToken>();

  constructor(private readonly ttlSeconds: number) {}

  issueToken(): TokenResult {
    const accessToken = randomBytes(32).toString("hex");
    this.tokens.set(accessToken, { expiresAt: Date.now() + this.ttlSeconds * 1000 });
    return { accessToken, expiresIn: this.ttlSeconds };
  }

  isValid(accessToken: string): boolean {
    const token = this.tokens.get(accessToken);
    if (!token) {
      return false;
    }
    if (token.expiresAt < Date.now()) {
      this.tokens.delete(accessToken);
      return false;
    }
    return true;
  }
}
