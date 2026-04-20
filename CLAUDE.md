# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack RAG chat application with streaming support. Monorepo with two main packages:
- `web-frontend/` — Next.js 15 frontend (App Router, React 19)
- `app-backend/` — FastAPI + LangGraph Python backend

## Commands

### Frontend (`web-frontend/`)
```bash
pnpm dev          # Dev server with Turbopack
pnpm build        # Production build
pnpm lint         # ESLint
```

### Backend (`app-backend/`)
```bash
uv sync                     # Install dependencies (preferred)
uv run src/server.py        # Run dev server
```

### Full Stack (Docker)
```bash
docker-compose up --build   # Build and start all services
docker-compose logs -f app  # Follow backend logs
docker-compose down         # Stop all services
```

## Architecture

### Request Flow
```
Browser → Next.js (port 3000) → NGINX (port 8000) → FastAPI (port 8080, internal) → PostgreSQL
```

### Frontend Architecture

**App Router structure** (`src/app/`):
- `(client)/chat/page.tsx` — Landing / new-chat page (`stateBar="create"`)
- `(client)/chat/[conv_id]/page.tsx` — Active conversation page (`stateBar="chat"`)
- `(server)/api-client/chat/route.tsx` — Key proxy route: transforms LangGraph SSE events into a simplified client event stream (see SSE section below)
- `(server)/api-client/createChat/` and `history/` — Conversation management routes
- `(server)/proxy/fetch/route.tsx` — Server-side HTML fetcher used by link previews; requires a `token` param (≥18 chars) for minimal SSRF protection
- `(server)/proxy/redirect/route.tsx` — Validates and redirects to external URLs; requires a `redirTk` param
- `pricing/` — Three-tier pricing page (Free / Pro $19 / Operator $49)

**State management**: Zustand store (`useHistoryStore`) wrapped in a React Context (`HistoryProvider`) in `src/components/Providers/historyProvider.tsx`. Central hub for `sendMessage()`, `updateAssistantMessage()`, conversation list. The in-memory "DB" (`lib/db.ts`) uses a JS array with Zod validation — **no persistence**, resets on refresh.

**Two Zod schema files**:
- `src/lib/types/db.schema.ts` — shapes for in-memory DB (includes `path` on tool blocks, `uri` on files)
- `src/lib/types/client.schema.ts` — shapes for live Zustand state (includes `data: z.file()` for in-flight files, no `path` on tools)

Message content is a polymorphic array of `text | tool_object` — not a flat string. The `path` field tracks the LangGraph node path (e.g. `generation_task:tools:tool_name`).

### SSE Transformation Layer

This is the most non-obvious part of the system. There are **two distinct event shapes**:

**Backend → Proxy** (`DeltaType` enum in `src/schema/generation_streaming.py`):
- `request_start` / `generation_end` — lifecycle
- `chat_model_start` / `chat_model_stream` / `chat_model_end` — text streaming
- `tool_end` — tool result (keyed by `tool_id`, `tool_name`)
- `content_moderation` — safety signal
- `error` — closes stream

**Proxy → Client** (transformed in `api-client/chat/route.tsx`):
- `startup` — injected by proxy with static metadata (`subscription: "pro"`, placeholder auth token, tool limits)
- `delta` — text chunk
- `summary` / `limits` / `session` — injected at stream end with placeholder stats
- `error` — forwarded

**Multi-stage tool tracking**: The proxy increments a `stage` counter on each `chat_model_start` event. Tool call indices are scoped per stage, producing paths like `generation_task:tools:2/0` (stage 2, first tool). `upsertTool()` in `historyProvider.tsx` merges by `call_id` so `tool_start` + `tool_end` update the same block.

### Backend Architecture

**LangGraph state machine** (`src/rag/server.py`):
- Entry node: `generation_task` (Gemini 2.5 Flash, temp 0.6, 7k tokens) — tools: `web_search`, `get_satellite_position`, `get_tle`, `code_interpreter`, `generate_image`
- `reasoning_task` node (Gemini 2.5 Pro, temp 0.3, 2k tokens) is defined but **not wired into the graph** — dead code
- `InMemorySaver` checkpointer keyed by `thread_id` — **resets on restart**

**File handling**: Files arrive as base64 in `GenerationRequest.files[]`, appended as `image_url` content blocks (data URLs) directly to Gemini. S3 upload code in `src/models/s3/` is commented out.

### Infrastructure

NGINX streaming-critical settings (`nginx.conf`): `proxy_buffering off`, `proxy_max_temp_file_size 0`, `add_header X-Accel-Buffering no`, `proxy_http_version 1.1`, `chunked_transfer_encoding on`, `proxy_set_header Accept-Encoding ""` (compression intentionally disabled). Proxy timeouts are **600s**; client body limit is **30MB**.

PostgreSQL container runs but is **not integrated** — app uses in-memory state. Hardcoded docker-compose credentials: `myuser:mypassword@db:5432/mydatabase`.

## Environment Variables

**`app-backend/.env`**:
```env
GOOGLE_API_KEY=         # Gemini API — required
TAVILY_API_KEY=         # Web search — optional
N2YO_API_KEY=           # Satellite tracking — optional
MODELSLAB_API_KEY=      # Image generation — optional
AWS_ACCESS_KEY_ID=      # S3 — optional (feature commented out)
AWS_SECRET_ACCESS_KEY=
```

**`web-frontend/.env.local`**:
```env
BACKEND_BASE_URL=http://localhost:8080/api/v1   # Direct backend (local dev)
NEXT_PUBLIC_CLOUDFRONT=                          # CDN for ModelsLab images
NEXT_GEN_AI_CDN=                                 # Secondary image CDN
```
In Docker, `BACKEND_BASE_URL=http://nginx:8000`.

## Key Non-Obvious Details

- **Proxy header enforcement**: `api-client/chat/route.tsx` requires `Content-Length`, `Content-Type: application/json`, and `Accept: text/event-stream` (or `*/*`) — missing any returns 411/412.
- **System prompt**: loaded from `src/docs/GEMINI_SYSTEM_PROMPT.md` at runtime — edit takes effect without restart.
- **Path alias**: `@/*` → `web-frontend/src/*`.
- **Remote image domains**: configured in `next.config.ts` (GitHub, ModelsLab CDN, Pixabay, CloudFront) — add new domains there.
- **No auth**: CORS open (`*`) at NGINX level; no authentication middleware anywhere.
- **Python 3.13+** required (`pyproject.toml`).
- **Notable unused deps**: `jotai` (Zustand used instead), `ai` library v5 (not actively used in visible code).
- **`mermaid`** v11 is a dependency — used in `ChatMessage` for diagram rendering.
- **`streamdown`** is used (dynamic import, SSR disabled) in `MessageFormat.tsx` as the primary streaming markdown renderer alongside `remark-gfm` and `remark-math`.
- **Link previews**: `LinkPreview.tsx` calls `glimpse()` (kibo-ui server action) on hover to fetch OG metadata; clicking opens via `/proxy/redirect`. The proxy fetch route (`/proxy/fetch`) scrapes raw HTML server-side. Both proxy routes validate URLs strictly (HTTPS only, ≤2048 chars).
- **`ChatBar` `stateBar` prop**: `"create"` navigates to a new conversation via `createChat` API then `router.push`; `"chat"` streams into the existing conversation via `sendMessage()`; `"docs"` hardcodes a summarisation prompt.

## Incomplete / Stubbed Features

| Feature | Status |
|---|---|
| PostgreSQL persistence | Container up, not wired |
| S3 file uploads | Code in `src/models/s3/`, commented out |
| `reasoning_task` LangGraph node | Defined, not connected |
| Reasoning UI toggle in `ChatBar` | Local state only (`reasoningEnabled`), no API wiring |
| Subscription enforcement | Frontend sends static `"pro"` placeholder |
| Authentication | No middleware; CORS open |
