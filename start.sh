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

echo "正在构建并启动肺炎检测演示服务..."
docker compose up --build -d

echo
echo "首次启动会从 Hugging Face 镜像下载模型，可能需要数分钟。"
echo "可用以下命令查看进度："
echo "  docker compose logs -f api"
echo
echo "前端界面: http://127.0.0.1:8080"
echo "模型 API : http://127.0.0.1:3000"
echo
echo "停止服务: ./stop.sh"
