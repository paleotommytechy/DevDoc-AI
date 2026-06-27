# ADR 0006: Intelligent Project Scanner Architecture

## Status
Accepted

## Context
DevDoc AI parses uploaded backend codebases to automatically produce standard API documentation. Historically, parsing and code summaries were coupled or planned to run entirely via heavy AI LLM processing. Coupling these steps presents several technical and operational challenges:
1. **Cost & Rate Limits**: Relying on Large Language Models to scan every single directory file, discover route patterns, count files, and build structural summaries is extremely expensive, slow, and prone to API rate limits.
2. **Deterministic Information**: Framework types, languages, and endpoint names can be identified with 100% precision and speed using local structural AST heuristical regex parsers, whereas LLMs are non-deterministic and can miss or hallucinate endpoints.
3. **Foundation for AI**: Downstream LLM operations (such as generating specific code descriptions, READMEs, or OpenAPI specs) require structured context inputs to avoid token pollution.

## Decision
We decided to build a **standalone, modular, local in-memory Project Scanner module** that acts as the absolute foundation of the DevDoc AI intelligence engine.

- **Separation of Scanning from AI**: The scanner runs locally on the application server without hitting any external LLMs. Future AI models will consume this scanner's output rather than scanning the project files from scratch.
- **In-Memory Decompression & Parsing**: Using `adm-zip` to extract file buffers in-memory. This prevents server filesystem bloat and removes complex workspace cleanup logic.
- **Deterministic Metadata Storage**: All parsed metadata (framework, routes, models, middleware, auth type, database, endpoints array) is normalized and saved directly inside the PostgreSQL project record.

## Consequences

### Why Scanning is Separated from AI
- **Performance**: High-speed, immediate user feedback (typically <1 second for most standard projects).
- **Security**: Customer code structure is fully analyzed and validated before any data is sent over AI API connections.
- **Pre-filtering**: Reduces prompt token sizes by filtering out useless code assets (like `node_modules`, test scripts, and build artifacts) before they ever reach an LLM.

### Why Metadata is Stored
- **Caching**: The dashboard can display immediate analysis results on project loads without re-extracting zip binaries.
- **Analytics & Charts**: Structured fields (e.g. `route_count`, `model_count`) can be easily used for database analytics and user reports.

### Why Scanners are Modular
- **Extension Strategy**: The scanner is designed with a service-controller routing boundary. Parsers and heuristic detectors are decoupled from file upload streams, allowing other components (e.g. CLI upload agents, OAuth Workspace extractions) to invoke `ScannerService.scanProject()` directly.
- **Multilingual Roadmap**: Adding support for Python (Django/FastAPI) or Go (Gin/Fiber) only requires adding a dedicated detector/regex module inside the `ScannerService` without changing any controller or database code.
