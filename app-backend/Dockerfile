FROM python:3.12-slim-bookworm
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml /app/pyproject.toml
COPY uv.lock /app/uv.lock
COPY .env /app/.env

RUN uv sync --locked

COPY ./src /app/src

EXPOSE 8080

CMD ["uv", "run", "src/server.py", "--host", "0.0.0.0", "--port", "8080"]