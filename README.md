# mtls-test-api

API de teste para o fluxo OAuth2 `client_credentials`, exigindo **certificado de cliente mTLS (PFX)** além de `client_id`/`client_secret`. Se tudo estiver correto, retorna um `access_token`; caso contrário, acesso negado (401).

## Como funciona

`POST /oauth/token`

1. A conexão TLS exige um certificado de cliente (`requestCert: true`).
2. O `client_id`/`client_secret` pode vir via **HTTP Basic Auth** (`Authorization: Basic base64(client_id:client_secret)`) ou no corpo (`client_id`, `client_secret`).
3. O corpo (`application/x-www-form-urlencoded`) deve conter `grant_type=client_credentials`.
4. Se tudo for válido: `200` com `{ access_token, token_type, expires_in }`.
5. Se o certificado, o grant_type ou as credenciais estiverem errados: `401`/`400` com `{ error, error_description }`.

Por padrão (`STRICT_MTLS=false`), o handshake TLS é concluído mesmo sem certificado válido, e a própria API responde com JSON 401 — mais fácil de testar no curl/Postman. Com `STRICT_MTLS=true`, o Node rejeita a conexão TLS caso o certificado não seja válido (mais próximo de um ambiente de produção).

## Setup

```bash
npm install
cp .env.example .env      # ajuste CLIENT_ID/CLIENT_SECRET se quiser
npm run certs              # gera CA, certificado do servidor e client.pfx em certs/
npm run dev
```

`npm run certs` roda `scripts/generate-certs.sh` via Git Bash e precisa do `openssl` no PATH (já vem com o Git for Windows).

Ao final, `certs/` terá:
- `ca.crt` — CA de teste (raiz de confiança)
- `server.key` / `server.crt` — identidade TLS do servidor
- `client.key` / `client.crt` — identidade do cliente em PEM
- `client.pfx` — **o certificado PFX que você vai usar para testar** (senha padrão `test1234`, configurável via `CLIENT_PFX_PASSWORD=minhasenha npm run certs`)

## Testando com curl

Caminho feliz (certificado + credenciais corretas):

```bash
curl -v --cacert certs/ca.crt \
  --cert certs/client.pfx:test1234 --cert-type P12 \
  -u test-client-id:test-client-secret \
  -d "grant_type=client_credentials" \
  https://localhost:8443/oauth/token
```

Sem certificado de cliente (deve retornar 401 `invalid_client`):

```bash
curl -v --cacert certs/ca.crt \
  -u test-client-id:test-client-secret \
  -d "grant_type=client_credentials" \
  https://localhost:8443/oauth/token
```

Credenciais erradas (deve retornar 401 `invalid_client`):

```bash
curl -v --cacert certs/ca.crt \
  --cert certs/client.pfx:test1234 --cert-type P12 \
  -u test-client-id:senha-errada \
  -d "grant_type=client_credentials" \
  https://localhost:8443/oauth/token
```

`grant_type` errado (deve retornar 400 `unsupported_grant_type`):

```bash
curl -v --cacert certs/ca.crt \
  --cert certs/client.pfx:test1234 --cert-type P12 \
  -u test-client-id:test-client-secret \
  -d "grant_type=authorization_code" \
  https://localhost:8443/oauth/token
```

## Testando no Postman

1. **Settings → Certificates → Add Certificate**: host `localhost:8443`, PFX file = `certs/client.pfx`, passphrase = `test1234`.
2. **Settings → SSL certificate verification**: desligue (é um servidor de teste com CA própria) ou configure o Postman para confiar em `certs/ca.crt`.
3. Na requisição `POST https://localhost:8443/oauth/token`:
   - **Authorization**: Basic Auth, usuário = `CLIENT_ID`, senha = `CLIENT_SECRET`.
   - **Body**: `x-www-form-urlencoded`, campo `grant_type` = `client_credentials`.

## Estrutura

```
src/
  config.ts                  # variáveis de ambiente tipadas
  tokenService.ts             # emissão/validação do access_token opaco
  verifyClientCertificate.ts  # middleware: exige certificado mTLS válido
  parseClientCredentials.ts   # extrai client_id/client_secret (Basic Auth ou body)
  oauthTokenHandler.ts        # handler do POST /oauth/token
  server.ts                   # monta o app Express
  index.ts                    # sobe o servidor HTTPS com as opções de mTLS
scripts/
  generate-certs.sh           # gera CA + certificado do servidor + client.pfx
```
