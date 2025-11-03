FROM python:3.13-slim-bookworm
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml /app/pyproject.toml
COPY uv.lock /app/uv.lock
COPY .env /app/.env

# Ensure native build dependencies and a recent Rust toolchain for packages built via maturin.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends build-essential curl pkg-config \
	&& rm -rf /var/lib/apt/lists/* \
	&& curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal --default-toolchain stable

ENV PATH="/root/.cargo/bin:${PATH}"

RUN uv sync --locked

COPY ./src /app/src

EXPOSE 8080

CMD ["uv", "run", "src/server.py", "--host", "0.0.0.0", "--port", "8080"]