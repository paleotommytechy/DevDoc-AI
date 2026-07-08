# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2026-07-08

### Added
- **Interactive Architecture Visualizer**:
  - Engineered the rule-based deterministically compiled `MermaidGenerator` that outputs 7 precise layout structures: Folder Trees, Route Flow, Controller Flow, Database Entity Relations, Middleware pipelines, Request Lifecycles, and dependency graphs.
  - Implemented lazy compilation triggers on database retrieval: if diagrams are absent for a parsed project, they are immediately compiled and persistent.
  - Developed full-stack REST API routes:
    - `GET /api/projects/:id/architecture` - Fetch or lazily compile the diagram list.
    - `POST /api/projects/:id/architecture/regenerate` - Explicitly rebuild diagrams from current AST records.
- **Dynamic Frontend Dashboard Visualizer**:
  - Built a gorgeous multi-diagram navigation drawer inside the project workspace page.
  - Integrated the official `mermaid` layout parser to render scalable diagrams in React with advanced error boundary shields.
  - Developed high-performance action buttons:
    - **Copy Code**: Seamless `navigator.clipboard` copier with visual feedback loops.
    - **Download .mmd**: Real-time download of raw Mermaid flowchart documents.
    - **Download Markdown**: Rich markdown document export containing embedded Mermaid graphs.

## [1.3.0] - 2026-06-30


### Added
- **Endpoint Details & Blueprint Inspector**:
  - Implemented static AST-like analysis regex parsing to extract path/query parameters, custom middlewares, controller bindings, validations, and response status codes.
  - Developed `EndpointGenerator` for real-time deterministic mockup JSON schema generation for both requests and responses.
  - Added PostgreSQL migration `0005_endpoint_details.sql` for persistence of fine-grained route blueprints.
- **REST APIs**:
  - GET `/api/projects/:projectId/endpoints` - Fetch all owner-verified endpoint blueprints.
  - GET `/api/endpoints/:endpointId` - Fetch complete specification details for a single endpoint.
- **Interactive Inspector UI**:
  - Created a dedicated `EndpointDetails` inspector page styled cleanly according to the design framework.
  - Added tab selectors for Overview, Sample Request, and Sample Response.
  - Implemented high-fidelity JSON payload viewers with micro-animation clipboard copying and persistent feedback.

## [1.2.0] - 2026-06-28

### Added
- **Automated Documentation Generator Module**:
  - Implemented `DocumentationService` to compile project specifications and route statistics into formatted markdown templates.
  - Generates comprehensive `README.md` containing name, stack summary, framework metrics, and structure highlights.
  - Generates thorough `API.md` containing overview, statistics, and a full interactive endpoint routing implementation table.
- **REST Endpoints for Documentation Retrieval & Download**:
  - GET `/api/projects/:id/documentation` - Fetch or lazy-generate both README and API specs from existing metadata.
  - GET `/api/projects/:id/documentation/download/readme` - Download fully formatted README.md markdown file.
  - GET `/api/projects/:id/documentation/download/api` - Download comprehensive API.md specification.
- **Frontend Markdown Preview & Workspace Tools**:
  - Created a dedicated `DocumentationPreview` page supporting responsive tab-toggles between `README.md` and `API.md`.
  - Integrated `react-markdown` to render formatted markdown natively into beautiful, high-contrast Tailwind CSS components.
  - Added action toolbar triggers to download `README.md` and `API.md` files on the analysis and preview dashboards.

## [1.1.0] - 2026-06-27

### Added
- **Intelligent Project Scanner Module**:
  - Implemented `ScannerService` to decompress and analyze backend ZIP codebases in-memory.
  - Implemented regex-based route detection for Express applications.
  - Added dependency analysis to identify Framework (Express, NestJS, Fastify), Database (PostgreSQL, MongoDB, MySQL, SQLite, Supabase, Prisma), and Authentication mechanisms (JWT, Passport, Supabase Auth, Firebase Auth).
  - Added folder-crawling capabilities to count controllers, middlewares, and models.
- **REST APIs**:
  - Created upload endpoint `/api/projects/:id/upload` (accepts `.zip` codebase files).
- **Interactive UI Dashboard**:
  - Built `ProjectAnalysis` dashboard page featuring statistics, badge systems, and interactive route discovery registries.
  - Unlocked and animated codebase uploads with dynamic `Analyzing...` overlay screen.
- **Database Schema**:
  - Added automatic schema creation/updates for postgres scanner result columns.
