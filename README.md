# DevDoc AI (Phase 0: Project Foundation)

DevDoc AI is an AI-powered SaaS application that enables developers to upload a backend codebase and automatically generate high-quality, comprehensive API documentation in seconds. 

This repository contains the monorepo workspace for DevDoc AI, initialized with a modern, production-ready full-stack architecture.

---

## 🚀 Project Overview

Manually writing and maintaining API documentation is time-consuming and error-prone. DevDoc AI solves this by:
1. Parsing codebases to extract endpoints, path parameters, query params, and body schemas.
2. Generating interactive, standards-compliant OpenAPI/Swagger documentation using state-of-the-art AI.
3. Hosting elegant, high-performance developer portals where teams can explore and test APIs.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4 (native, modern CSS modules)
- **State & Forms:** React Hook Form + TanStack React Query + Zod
- **Animations:** Motion
- **HTTP Client:** Axios
- **Iconography:** Lucide React

### Backend
- **Runtime:** Node.js + Express
- **Language:** TypeScript (strict mode enabled)
- **Security & Utilities:** Helmet, CORS, Morgan (logger)
- **Rate Limiting:** Express Rate Limit
- **Configuration:** Dotenv + Zod environment validation

---

## 📂 Repository Structure

```
devdoc-ai/
├── frontend/                 # Client-side single-page React app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page-level components
│   │   ├── layouts/          # Page layout wrappers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API fetch services
│   │   ├── lib/              # Library clients
│   │   ├── types/            # Shared TypeScript types
│   │   ├── utils/            # Frontend utility helpers
│   │   ├── assets/           # Statics & images
│   │   ├── App.tsx           # Primary application view
│   │   └── main.tsx          # Frontend entry point
│   ├── .env.example          # Sample environment file
│   ├── index.html            # Main HTML wrapper
│   ├── package.json          # Pinned frontend dependencies
│   ├── tsconfig.json         # Frontend TypeScript config
│   └── vite.config.ts        # Vite build & plugin configurations
│
├── backend/                  # Server-side API application
│   ├── src/
│   │   ├── config/           # Safe configuration managers
│   │   ├── controllers/      # Route controllers (MVC)
│   │   ├── routes/           # REST endpoints
│   │   ├── middlewares/      # Express middlewares (auth, errors, rate limits)
│   │   ├── services/         # Core business logic / AI services (Phase 1+)
│   │   ├── scanner/          # Project Scanner module (parsers & route detectors)
│   │   ├── utils/            # Shared loggers and utils
│   │   ├── types/            # Type definitions
│   │   ├── prompts/          # AI prompt templates (Phase 1+)
│   │   ├── parsers/          # AST Code parsers (Phase 1+)
│   │   ├── generators/       # Doc format generators (Phase 1+)
│   │   └── server.ts         # Independent backend server entrypoint
│   ├── .env.example          # Sample environment file
│   ├── package.json          # Pinned backend dependencies
│   └── tsconfig.json         # Backend TypeScript config
│
├── docs/                     # Documentation assets (Phase 1+)
├── scripts/                  # DevOps and database migration scripts (Phase 1+)
├── .github/                  # GitHub workflows & templates (Phase 1+)
├── .env.example              # Root level configuration example
├── server.ts                 # Full-stack developer/production entrypoint
├── package.json              # Monorepo workspaces coordinator
└── tsconfig.json             # Root TypeScript config
```

---

## ⚙️ Environment Variables

### Root / Full-stack Development
Create `.env` at the project root based on `.env.example`:
```env
# GEMINI_API_KEY: AI API Key (Required for Phase 1+)
GEMINI_API_KEY="your_api_key_here"

# APP_URL: Dynamic service URL
APP_URL="http://localhost:3000"
```

### Backend
Create `/backend/.env` based on `/backend/.env.example`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devdoc_ai
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend
Create `/frontend/.env` based on `/frontend/.env.example`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_ANALYTICS=false
```

---

## 🏁 Getting Started

### Installation
From the root directory, simply run npm install. The workspace configuration automatically installs all dependencies across both `frontend` and `backend` seamlessly.
```bash
npm install
```

### Run Full-Stack Development Server
Runs both backend APIs and the frontend Vite server concurrently under port `3000`:
```bash
npm run dev
```
- Frontend UI: `http://localhost:3000`
- API Health Check: `http://localhost:3000/api/health`

### Run Independent Layers
To run either layer independently for isolated development:

**Backend Only:**
```bash
cd backend
npm run dev
```

**Frontend Only:**
```bash
cd frontend
npm run dev
```

---

## 🔍 Intelligent Project Scanner

DevDoc AI includes an Intelligent Project Scanner that parses uploaded Node.js/Express-style backend codebase archives in-memory to automatically discover backend layouts, models, routers, and routes.

### Supported Frameworks
- **Express** (High-fidelity detection via dependency analysis and route invocation matching)
- **NestJS** (Core package dependency scanning)
- **Fastify** (Package dependency matching)

### Supported Languages
- **TypeScript** (.ts file counts and config check)
- **JavaScript** (.js, .jsx, .tsx file check)

### Scanner Workflow
1. **ZIP Upload**: The client uploads a ZIP codebase to `/api/projects/:id/upload` containing the backend source.
2. **In-Memory Decompression**: The backend uses `adm-zip` to extract archive entries in-memory without polluting the server filesystem.
3. **AST Tokenizer & Heuristic Analysis**:
   - Counts file extensions to identify primary programming language.
   - Searches `package.json` to extract project name, framework, auth middleware, and database clients.
   - Crawls controller directories and files matching `*Controller.*`.
   - Crawls model directories and schemas.
   - Crawls middleware directories.
4. **Regex-Based Route Discovery**: Scans and parses Express-style route usages (e.g. `router.get('/path')`, `app.post('/users')`) to extract HTTP Methods, Enpoints, and file line definitions.
5. **Database Storage**: Compiles the scanned metadata and saves it directly to the PostgreSQL project database.

### Known Limitations
- Heavy obfuscation or highly complex nested routers might skip detection if they do not match standard Express route patterns.
- Currently supports Express as the primary deep route scanning engine. NestJS and Fastify are supported for framework, dependency, database, and authenticator counting.

---

## 📝 Automated Documentation Generator

DevDoc AI compiles scanned project AST metadata into beautifully structured markdown files deterministically on-device without external model dependencies, ensuring 100% data security, ultra-fast generation speeds, and reliable compliance.

### Generated Documents
- **README.md**: Standardized project overview specifying Project Name, detected Framework, Language, Database, Authentication, Total Discovered Routes, and metric counts for Controllers, Models, and Middlewares.
- **API.md**: High-contrast API specification manual detailing Project Overview, API Statistics, and a complete markdown registry of all discovered endpoints (HTTP Method, Route Endpoint, Source Implementation File).

### REST API Reference
- **GET** `/api/projects/:id/documentation` - Fetch or lazy-generate both README and API specs from existing metadata records.
- **GET** `/api/projects/:id/documentation/download/readme` - Download the fully formatted `README.md` file directly.
- **GET** `/api/projects/:id/documentation/download/api` - Download the compiled `API.md` file directly.

---

## 🗺️ Completed Milestones & Roadmap
- **Phase 1: Code Parsing & AST Extraction** - Completed! Support parsing Express JS/TS structures to extract routes in-memory.
- **Phase 2: Automated Markdown Documentation** - Completed! Instant, template-based generation of README.md and API.md files.
- **Phase 3: Interactive Developer Portal** - Completed! Native React markdown preview with download triggers.
- **Phase 4: Endpoint Details & Sample Request/Response Generator** - Completed! Granular static analysis of API route parameters, query fields, response codes, active middlewares, and local deterministic mockup payload generation.
