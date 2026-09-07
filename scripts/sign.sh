#!/usr/bin/env bash
set -euo pipefail

# scripts/sign.sh — CHẠY Ở MÁY LOCAL, không phải trên server
#
# Sử dụng:
#   ./scripts/sign.sh cert.pem key.pem chain.pem [input_file] [output_file]
#
# Ví dụ:
#   ./scripts/sign.sh cert.pem key.pem chain.pem certs/webclip.mobileconfig certs/webclip.signed.mobileconfig

SIGNER_CERT="${1:-cert.pem}"
PRIVATE_KEY="${2:-key.pem}"
CHAIN_CERT="${3:-chain.pem}"
INPUT_FILE="${4:-certs/webclip.mobileconfig}"
OUTPUT_FILE="${5:-certs/webclip.signed.mobileconfig}"

if [[ ! -f "$SIGNER_CERT" || ! -f "$PRIVATE_KEY" || ! -f "$CHAIN_CERT" ]]; then
  echo "Lỗi: Không tìm thấy file chứng chỉ SSL (signer, key hoặc chain)."
  echo "Cách dùng: $0 <cert.pem> <key.pem> <chain.pem> [input.mobileconfig] [output.signed.mobileconfig]"
  exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "Lỗi: File profile đầu vào '$INPUT_FILE' không tồn tại."
  exit 1
fi

echo "Đang ký profile '$INPUT_FILE' -> '$OUTPUT_FILE'..."

openssl smime -sign \
  -in  "$INPUT_FILE" \
  -out "$OUTPUT_FILE" \
  -signer "$SIGNER_CERT" \
  -inkey "$PRIVATE_KEY" \
  -certfile "$CHAIN_CERT" \
  -outform DER -nodetach

echo "Đã ký thành công: $OUTPUT_FILE"
