#!/usr/bin/env bash
set -euo pipefail

echo "[api] starting BentoML service on 0.0.0.0:3000"
exec bentoml serve service:svc --host 0.0.0.0 --port 3000
