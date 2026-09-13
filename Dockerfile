FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
    HF_HOME=/root/.cache/huggingface \
    BENTOML_HOME=/root/bentoml \
    BENTOML_CONFIG=/app/config/docker.yaml \
    HF_ENDPOINT=https://hf-mirror.com \
    CUDA_VISIBLE_DEVICES="" \
    NVIDIA_VISIBLE_DEVICES=void

WORKDIR /app

RUN set -eux; \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources; \
    fi; \
    if [ -f /etc/apt/sources.list ]; then \
      sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list; \
    fi; \
    apt-get update \
    && apt-get install -y --no-install-recommends curl libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/docker.txt /tmp/docker.txt
RUN pip install --no-cache-dir torch torchvision \
        --index-url https://download.pytorch.org/whl/cpu \
    || pip install --no-cache-dir torch torchvision \
    && pip install --no-cache-dir -r /tmp/docker.txt

COPY save_model.py service.py client.py ./
COPY config ./config
COPY samples ./samples
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && mkdir -p /app/samples

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=15s --start-period=300s --retries=10 \
    CMD curl -fsS http://127.0.0.1:3000/healthz || exit 1

ENTRYPOINT ["/entrypoint.sh"]
