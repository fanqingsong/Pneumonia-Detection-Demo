#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "未找到 docker，请先安装 Docker。" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未找到 docker compose，请使用 Docker Compose V2。" >&2
  exit 1
fi

echo "正在停止肺炎检测演示服务..."
docker compose down

echo
echo "服务已停止。"
echo "模型与 Hugging Face 缓存卷会保留，下次启动无需重新下载。"
echo "如需同时删除缓存卷，可执行：docker compose down -v"
