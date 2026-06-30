# ADR 0007: Detailed Endpoint Extraction & Sample Request/Response Generator

## Status
Accepted

## Context
With the core scanner in place from Sprint 4, the system discovered basic route arrays. However, a modern documentation suite must allow engineers to inspect individual endpoints with exhaustive parameters, validator types, and realistic JSON requests and response examples. Relying on downstream LLMs for real-time sample generation is slow, non-deterministic, and expensive. 

We needed a system that:
1. **Deeper Regex AST-like Analysis**: Identifies route parameters (path and query), middleware pipelines, database schema bindings, and validator libraries (e.g., Zod, Joi, express-validator).
2. **Deterministic Mock Payload Generation**: Generates standard JSON mock requests/responses from detected field keys and route naming types (e.g., generating integers for `id`, emails for `email`) without calling external AI models.
3. **Dedicated Schema Isolation**: Stores detailed endpoint records in a dedicated child table (`endpoints`) referencing `projects`, supporting granular query retrieval.

## Decision
We implemented a dedicated **Endpoint Discovery & Sample Payload Generation module** in the backend:

- **Dedicated child database schemas**: Added the `endpoints` table via migration `0005_endpoint_details.sql`, with explicit support for query parameters, path parameters, status codes, validations, and sample JSON payloads.
- **Deterministic Generator**: Created `EndpointGenerator` to evaluate property keys and route paths to generate standard JSON mock schemas locally and instantaneously.
- **Deeper Heuristic Analysis**: Parsed common validator files and middlewares to detect specific validations (like Joi/Zod schemas) and route protection statuses.
- **Secure Endpoint Isolation**: Exposed specialized, owner-verified `GET` API paths for endpoints (`/api/projects/:projectId/endpoints` and `/api/endpoints/:endpointId`) secured via `authMiddleware`.
- **In-Memory Fallback Reliability**: Aligned `DbService`'s `alignSchema` to ensure dynamic schema resilience with full CRUD support fallbacks if Supabase database clusters are unreached.

## Consequences

### Why Static AST-like Parsing was Used
- **Instant Response Time**: Parsing is complete within milliseconds, allowing instantaneous documentation previews immediately post-upload.
- **Zero AI Latency**: Sample request and response blueprints are rendered directly in the frontend without requiring separate backend-to-LLM roundtrips.

### Why Child DB Schemas were Adopted
- **Scale and Pagination**: Keeps the parent `projects` table lightweight and performant. Highly verbose payload details and validation configurations are loaded lazily when requested by the frontend.
- **Independent Querying**: Enables downstream features like search, sorting, filtering, and targeted editing of individual API blueprints.
