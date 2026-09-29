#!/usr/bin/env bash
set -euo pipefail

# Prevents Git Bash/MSYS from mangling "/C=BR/O=.../CN=..." -subj values into Windows paths.
export MSYS_NO_PATHCONV=1

CERTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/certs"
mkdir -p "$CERTS_DIR"
cd "$CERTS_DIR"

CLIENT_PFX_PASSWORD="${CLIENT_PFX_PASSWORD:-test1234}"

echo "Generating CA..."
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 825 \
  -subj "/C=BR/O=Roberty Test/CN=mtls-test-api-ca" \
  -out ca.crt

echo "Generating server certificate..."
openssl genrsa -out server.key 2048
openssl req -new -key server.key \
  -subj "/C=BR/O=Roberty Test/CN=localhost" \
  -out server.csr
printf "subjectAltName=DNS:localhost,IP:127.0.0.1" > server.ext
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -days 825 -sha256 -out server.crt \
  -extfile server.ext
rm -f server.ext

echo "Generating client certificate..."
openssl genrsa -out client.key 2048
openssl req -new -key client.key \
  -subj "/C=BR/O=Roberty Test/CN=test-client" \
  -out client.csr
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -days 825 -sha256 -out client.crt

echo "Exporting client certificate as PFX (password: $CLIENT_PFX_PASSWORD)..."
openssl pkcs12 -export -out client.pfx \
  -inkey client.key -in client.crt -certfile ca.crt \
  -passout pass:"$CLIENT_PFX_PASSWORD"

rm -f server.csr client.csr ca.srl

echo ""
echo "Done. Files created in $CERTS_DIR:"
echo "  ca.crt           - CA certificate (server trusts client certs signed by this)"
echo "  server.key/.crt  - server TLS identity"
echo "  client.key/.crt  - client identity in PEM format"
echo "  client.pfx       - client identity bundle in PFX/PKCS12 (password: $CLIENT_PFX_PASSWORD)"
