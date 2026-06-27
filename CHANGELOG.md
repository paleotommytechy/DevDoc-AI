# Changelog

All notable changes to this project will be documented in this file.

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
