# 🤖 The Universal Agent RAG

An intelligent chat system based on RAG (Retrieval-Augmented Generation) architecture with a modern web interface and robust backend API.

![Architecture](./references/agent_portait.png)

## 🏗️ Project Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │    │                 │
│   Web Frontend  │    │  NGINX Reverse  │    │   Python API    │    │   PostgreSQL    │
│   (Next.js)     │────▶│     Proxy       │────▶│   (FastAPI)     │────▶│   Database      │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 8080    │    │   Port: 5432    │
│                 │    │                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow:
1. **Next.js Frontend** → Publicly accessible on port 3000
2. **NGINX Reverse Proxy** → API entry point on port 8000
3. **Python FastAPI Backend** → Accessible only via NGINX (Docker internal network)
4. **PostgreSQL Database** → Data and conversation storage

---

## 🚀 Quick Installation and Setup

### Prerequisites
- **Docker** and **Docker Compose**
- **Node.js** 18+ (for local development)
- **Python** 3.12+ (for local development)

### 🐳 Docker Deployment (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Math-Vov13/The-UNIVERSAL-Agent.git
   cd The-UNIVERSAL-Agent
   ```

2. **Configure environment variables:**
   ```bash
   cp app-backend/.env.example app-backend/.env
   ```
   
   Edit `app-backend/.env`:
   ```env
   GOOGLE_API_KEY=your_google_api_key
   N2YO_API_KEY=your_n2yo_api_key
   ```

3. **Launch all services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - 🌐 **Web Interface**: http://localhost:3000
   - 🔧 **API via NGINX**: http://localhost:8000
   - 🗄️ **Database**: localhost:5432

---

## 🛠️ Local Development

### Frontend (Next.js)

```bash
cd web-frontend

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

**Available Scripts:**
- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint validation

### Backend (Python/FastAPI)

```bash
cd app-backend

# With uv (recommended)
uv sync
uv run src/server.py

# Or with traditional pip
pip install -r requirements.txt
python src/server.py
```

---

## 📡 API Endpoints

### Backend FastAPI (via NGINX :8000)

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/v1/` | GET | Health check |
| `/api/v1/generation` | POST | AI response generation |
| `/api/v1/stream/` | POST | Streaming generation (SSE) |
| `/health` | GET | API status |

### Frontend API Routes

| Route | Description |
|-------|-------------|
| `/api-client/chat` | Proxy to backend API |
| `/api-client/createChat` | New conversation creation |
| `/api-client/` | Frontend health check |

---

## 🏃‍♂️ Internal Architecture

### 1. Frontend Architecture (Next.js)

```
web-frontend/
├── src/app/
│   ├── (client)/chat/          # Client-side chat pages
│   │   └── [conv_id]/          # Chat with conversation ID
│   ├── (server)/api-client/    # Next.js API routes
│   │   ├── chat/               # Backend proxy
│   │   └── createChat/         # Conversation management
│   ├── layout.tsx              # Main layout
│   └── page.tsx                # Home page
├── src/components/
│   ├── pages/                  # Page components
│   │   ├── ChatBar.tsx         # Input bar
│   │   ├── ChatMessage.tsx     # Chat messages
│   │   └── ChatWindow.tsx      # Chat window
│   └── ui/                     # Reusable UI components
└── src/lib/                    # Utilities
```

**Technologies Used:**
- **Next.js 15.5+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React 19** with modern hooks
- **Zod** for data validation

### 2. Backend Architecture (FastAPI)

```
app-backend/
├── src/
│   ├── server.py              # Main FastAPI server
│   └── rag/
│       └── main.py            # LLM configuration (Gemini)
├── pyproject.toml             # Python/uv configuration
└── Dockerfile                 # Docker image
```

**Features:**
- **FastAPI** with Pydantic validation
- **Google Gemini 2.5 Flash** via Langchain
- **Advanced logging** with request tracking
- **Middleware** for performance monitoring
- **Streaming support** for long responses

### 3. NGINX Configuration

```nginx
# Optimized configuration for:
├── Reverse proxy to FastAPI
├── Streaming support (SSE)
├── CORS management
├── GZIP compression
├── Adaptive timeouts
└── Load balancing (upstream)
```

**Features:**
- **Proxy buffering disabled** for streaming
- **Extended timeouts** (300s) for long generations
- **WebSocket support** and HTTP/1.1
- **Security headers** and debugging

---

## 🔧 Advanced Configuration

### Environment Variables

#### Backend (.env)
```env
# API Keys
GOOGLE_API_KEY=your_google_api_key
N2YO_API_KEY=your_satellite_api_key

# Application
APP_ENV=production
APP_DEBUG=false
PORT=8080
```

#### Frontend (automatic via Docker)
```env
BACKEND_BASE_URL=http://nginx:8000
```

### Docker Compose Services

```yaml
services:
  web:      # Next.js Frontend
  nginx:    # Reverse proxy
  app:      # FastAPI Backend  
  db:       # PostgreSQL
```

---

## 🎯 Features

### ✅ Implemented
- 💬 Real-time chat interface
- 🤖 Google Gemini 2.5 Flash integration
- 🔄 Conversation system with history
- 📱 Responsive and modern design
- 🐳 Complete Docker deployment
- 🔧 Documented RESTful API
- 📊 Logging and monitoring
- 🌐 Optimized NGINX reverse proxy

### 🚧 In Development
- 📡 Response streaming (SSE)
- 📁 File upload in chat
- 🗄️ Database conversation persistence
- 🔍 RAG system with embeddings
- 🔐 User authentication

---

## 🔍 Monitoring and Logs

### Application Logs
```bash
# Container logs
docker-compose logs -f [service_name]

# Specific logs
docker-compose logs -f app     # Backend logs
docker-compose logs -f nginx   # Proxy logs
docker-compose logs -f web     # Frontend logs
```

### Health Checks
- **Frontend**: http://localhost:3000
- **API Status**: http://localhost:8000/health
- **NGINX**: http://localhost:8000
- **Database**: Accessible on localhost:5432

---

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   docker-compose down
   # Modify ports in docker-compose.yml if necessary
   ```

2. **Missing environment variables:**
   ```bash
   # Check .env file
   cat app-backend/.env
   ```

3. **Build errors:**
   ```bash
   docker-compose build --no-cache
   docker-compose up
   ```

4. **NGINX 502 Bad Gateway:**
   - Check that the `app` service is started
   - View logs: `docker-compose logs nginx`

### Debug Mode

```bash
# Start with detailed logs
APP_DEBUG=true docker-compose up
```

---

## 📊 API Documentation

### Request/Response Examples

#### Chat Generation
```bash
# POST /api/v1/generation
curl -X POST http://localhost:8000/api/v1/generation \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how are you?"}'
```

**Response:**
```json
{
  "model": "gemini-2.5-flash",
  "generation_id": "gen-uuid-here",
  "timestamp": 1727347200,
  "response": "Hello! I'm doing well, thank you for asking..."
}
```

#### Health Check
```bash
# GET /health
curl http://localhost:8000/health
```

**Response:**
```json
{
  "Hello": "World"
}
```

---

## 🚀 Deployment

### Production Deployment

1. **Prepare environment:**
   ```bash
   export APP_ENV=production
   export APP_DEBUG=false
   ```

2. **Build and deploy:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Monitor services:**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### Scaling

```bash
# Scale backend instances
docker-compose up --scale app=3

# Scale with load balancer
docker-compose -f docker-compose.prod.yml up
```

---

## 🧪 Testing

### Backend Tests
```bash
cd app-backend
pytest tests/
```

### Frontend Tests
```bash
cd web-frontend
npm run test
```

### Integration Tests
```bash
# Test full stack
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use **TypeScript** for frontend code
- Follow **PEP 8** for Python code
- Add tests for new features
- Update documentation
- Use conventional commits

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** for conversational AI
- **Langchain** for LLM integration
- **Next.js** for the frontend framework
- **FastAPI** for the performant backend API
- **Docker** for containerization
- **NGINX** for reverse proxy capabilities

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Math-Vov13/The-UNIVERSAL-Agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Math-Vov13/The-UNIVERSAL-Agent/discussions)
- **Documentation**: This README and inline code comments

---

## 👤 Authors

- **MathV-13**

*Built with ❤️ for a modern and performant AI chat experience.*
