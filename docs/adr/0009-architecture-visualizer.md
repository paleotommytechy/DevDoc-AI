# Architectural Decision Record (ADR)

## ADR 0009: Architecture Visualizer

### Status
Accepted

### Context
Developers require high-level structural models and architecture blueprints when inspecting uploaded Node.js/Express-style codebases to verify route configurations, middleware sequence interceptors, database integrations, and code relationships. Manually building architecture diagrams is tedious and goes out of sync easily.

The goal is to implement an automated, 100% deterministic, rule-based on-the-fly Mermaid blueprint compiler that builds 7 targeted structural diagrams from scanned codebase AST records, without external LLM or AI model queries (to preserve complete security, extreme speed, and consistent schema output compliance).

### Decision
We will establish a full-stack automated diagram generator with PostgreSQL caching and an interactive client-side rendering environment utilizing the official `mermaid` layout parser.

#### 1. Backend Diagram Models & Persistence
- A new database entity `architecture_diagrams` is registered with schema columns:
  - `id` (UUID, primary key)
  - `project_id` (UUID, foreign key targeting `projects.id`)
  - `diagram_type` (VARCHAR, indexing folder trees, routes, middleware, dependency flows, request lifecycle, etc.)
  - `mermaid_code` (TEXT, raw Mermaid.js syntax)
  - `generated_at` (TIMESTAMP)
- Auto-alignment checks run on backend bootstrap to safely compile migrations and synchronize tables in SQL and local in-memory mock fallback scopes.

#### 2. Deterministic Rule-Based Compiler (`MermaidGenerator`)
- Rather than speculative text generators, the generator implements strict algorithms mapping `ProjectEntity` and `DiscoveredEndpoint` models directly into structured Mermaid blocks.
- It produces 7 distinct diagram categories:
  - `folder_tree`: Flowchart tree representing standard directories (`src`, `controllers`, `models`, `routes`, etc.).
  - `route_controller`: Flowchart linking route paths (`GET /api/users`) to target binding handlers.
  - `controller_service`: Visual map showing standard business service interfaces.
  - `service_database`: Schema relations displaying primary ORM clients or database backends (e.g., PostgreSQL, Supabase).
  - `middleware_flow`: Chain flowchart representing interceptor executions (`auth`, `logger`, `rateLimit`).
  - `request_lifecycle`: Unified sequence flowchart routing Client Requests ➔ Middlewares ➔ Controller bindings ➔ DB operations ➔ Client Response.
  - `dependency_graph`: Node chart linking framework configurations and major dependencies.

#### 3. Client-Side Interactive Viewer
- React 19 leverages the official `mermaid` NPM library.
- A custom `Mermaid` viewport component safely wraps the asynchronous `mermaid.render` API using dynamic, conflict-free identifier tokens.
- An action panel unlocks advanced developer productivity tools:
  - **Copy Code**: Copies pure Mermaid code to the clipboard.
  - **Download .mmd**: Standard `.mmd` raw text file download.
  - **Download Markdown**: Comprehensive document packaging containing embedded Mermaid graphs.

### Consequences
- **Ultra-Fast Generation**: Processing completes within milliseconds, presenting a highly responsive loading and render feedback loop.
- **Data Privacy Compliance**: Codebase structures remain entirely local and never leave the owner's database.
- **Consistent Layouts**: Mermaid rendering ensures unified spacing, balanced typography, and responsive zoom/panning states native to browser CSS vectors.
- **Seamless Portability**: Output schemas can be cleanly copied into standard Markdown previews (e.g., GitHub, VS Code, Notion) instantly.
