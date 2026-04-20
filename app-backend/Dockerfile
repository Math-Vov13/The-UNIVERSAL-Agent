# Stage 1: Builder - Préparation des dépendances et modèles
FROM python:3.13-slim-bookworm AS builder

# Installer uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY pyproject.toml /app/pyproject.toml
COPY uv.lock /app/uv.lock

# Installer les dépendances système nécessaires et Rust
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl pkg-config \
    && rm -rf /var/lib/apt/lists/* \
    && curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal --default-toolchain stable

# Télécharger les modèles ONNX pour Chroma
# RUN mkdir -p /root/.cache/chroma/onnx_models/all-MiniLM-L6-v2 \
#     && curl https://chroma-onnx-models.s3.amazonaws.com/all-MiniLM-L6-v2/onnx.tar.gz -o /root/.cache/chroma/onnx_models/all-MiniLM-L6-v2/onnx.tar.gz \
#     && tar -xzf /root/.cache/chroma/onnx_models/all-MiniLM-L6-v2/onnx.tar.gz -C /root/.cache/chroma/onnx_models/all-MiniLM-L6-v2 --strip-components=1 \
#     && rm -f /root/.cache/chroma/onnx_models/all-MiniLM-L6-v2/onnx.tar.gz


ENV PATH="/root/.cargo/bin:${PATH}"

RUN uv sync --locked
RUN uv add pip
RUN uv run --with spacy spacy download en_core_web_md

# Stage 2: Final - Image optimisée pour l'exécution
FROM python:3.13-slim-bookworm AS final

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copier l'environnement virtuel du builder
COPY --from=builder /app/.venv /app/.venv

# COPY --from=builder /root/.cache/chroma /root/.cache/chroma

# Copier les fichiers de configuration et le code source
COPY pyproject.toml /app/pyproject.toml
COPY uv.lock /app/uv.lock
COPY .env /app/.env
COPY ./src /app/src

ENV PATH="/app/.venv/bin:${PATH}"

EXPOSE 8080

CMD ["uv", "run", "src/server.py", "--host", "0.0.0.0", "--port", "8080"]