# Testing Guide - Project Scanner

This document outlines manual and edge-case testing procedures to verify the correct behavior of the DevDoc AI Intelligent Project Scanner.

---

## 🧪 Manual Test Scenarios

### 1. Express Project (Standard ZIP)
- **Objective**: Verify that standard Express backend routes, controllers, and models are counted and listed.
- **Setup**: Create a zip archive containing:
  - `package.json` with `"dependencies": { "express": "^4.18.2" }`
  - A route file (e.g., `src/routes.ts`) containing:
    ```typescript
    router.get('/api/v1/users', (req, res) => {});
    app.post('/api/v1/users', (req, res) => {});
    ```
- **Execution**: Upload the ZIP file in the Project Upload section.
- **Expected Results**:
  - Automatically redirects to the Project Analysis page.
  - Framework is detected as **Express**.
  - **2 API Routes** are discovered.
  - Endpoints Table correctly displays:
    - `GET` | `/api/v1/users` | `src/routes.ts`
    - `POST` | `/api/v1/users` | `src/routes.ts`

---

### 2. TypeScript Project
- **Objective**: Verify correct programming language detection.
- **Setup**: Create a zip archive containing at least one `.ts` file (e.g., `server.ts`).
- **Execution**: Upload the ZIP file.
- **Expected Results**:
  - Language is detected as **TypeScript**.
  - Counts of controllers and models match `.ts` extensions.

---

### 3. JavaScript Project
- **Objective**: Verify correct programming language detection.
- **Setup**: Create a zip archive with only `.js` code files and no `.ts` files.
- **Execution**: Upload the ZIP file.
- **Expected Results**:
  - Language is detected as **JavaScript**.

---

### 4. Empty ZIP
- **Objective**: Handle edge cases of empty archives gracefully.
- **Setup**: Create an empty zip file with zero files inside.
- **Execution**: Upload the empty ZIP.
- **Expected Results**:
  - Scanner completes without crashing the server.
  - High-level counts are set to `0`.
  - Framework, Language, Database, and Authentication are set to **Unknown**.
  - Endpoints Table displays empty state message: *"No API routes were detected in this project."*

---

### 5. Invalid Project
- **Objective**: Verify that non-zip or corrupted files fail gracefully with clean UI.
- **Setup**: Create a dummy file named `invalid_project.zip` that contains arbitrary text (corrupted ZIP).
- **Execution**: Attempt to upload `invalid_project.zip`.
- **Expected Results**:
  - The upload mutation fails.
  - Clear error banner is displayed on the Project Details page: *"Failed to upload or analyze codebase."* (with status in DB marked as `Failed` / `Error`).

---

### 6. Project with No Routes
- **Objective**: Verify that a valid codebase without explicit express route handlers displays a clean empty state.
- **Setup**: Create a zip archive containing a `package.json` and some controllers/models but no route declarations.
- **Execution**: Upload the ZIP file.
- **Expected Results**:
  - Redirects to Project Analysis dashboard successfully.
  - Total Routes Discovered is `0`.
  - Empty State illustration is rendered: *"No API routes were detected in this project."*

---

### 7. Large Project
- **Objective**: Ensure files are extracted and parsed in-memory efficiently within standard limits without timeouts.
- **Setup**: Create a zip archive containing 100+ simulated route and controller files, with a file size under 50MB.
- **Execution**: Upload the ZIP.
- **Expected Results**:
  - Scanning completes quickly (typically <3 seconds) because operations are fully processed in-memory using buffer streams.
  - All routes are correctly populated and searchable using the table's search filter.
