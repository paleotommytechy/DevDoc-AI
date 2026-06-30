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

---

## 📝 Sprint 4 Documentation Testing Scenarios

### 8. Documentation Generation & DB Caching
- **Objective**: Verify that markdown documentation templates are correctly populated from scanner metrics and saved in the database.
- **Setup**: Log in and upload a valid zip project codebase (e.g. standard Express project).
- **Execution**: Navigate to the Project Analysis page for the uploaded project. Click the "Preview Docs" button or perform a GET request on `/api/projects/:id/documentation`.
- **Expected Results**:
  - Code parses successfully and lazy-generates documentation if it does not already exist.
  - The documentation includes the project's details (Framework, Language, Database, Authentication, counts, and routes).
  - Inspecting the backend service indicates a database or local state cache is established. Subsequent requests for documentation retrieve this cached copy instantly instead of regenerating.

### 9. Documentation Tab Preview
- **Objective**: Verify that the user can seamlessly switch between README and API previews.
- **Setup**: Complete codebase analysis for a project and click "Preview Docs".
- **Implementation Check**: The app renders the Documentation Preview page.
- **Execution**: 
  - Click on the "README.md Preview" tab.
  - Click on the "API.md Specification" tab.
- **Expected Results**:
  - The active markdown file changes instantly.
  - **README.md** shows correct framework details, file metrics, and descriptions.
  - **API.md** renders a clean table of all discovered Express routes, detailing HTTP method verbs, path locations, and source files.

### 10. Markdown Download
- **Objective**: Verify that the user can download generated `README.md` and `API.md` files as standalone markdown assets.
- **Setup**: Open the Project Analysis or Documentation Preview dashboard for an analyzed project.
- **Execution**: 
  - Click the "Download README" button.
  - Click the "Download API Docs" button.
- **Expected Results**:
  - Download begins instantly with no browser errors.
  - Files are downloaded as `README.md` and `API.md` respectively.
  - Opening the files verifies they contain fully valid Markdown content matching the live preview.

---

## 📝 Sprint 5 Documentation Testing Scenarios

### 11. Detailed Endpoint Discovery and Parameter Extraction
- **Objective**: Verify that the scanner extracts path parameters, query parameters, validations, and custom middlewares.
- **Setup**: Zip a codebase with an Express route like:
  ```typescript
  router.get('/api/projects/:projectId/milestones/:id', authMiddleware, validationMiddleware, (req, res) => {});
  ```
- **Execution**: Upload the zip archive and navigate to the project's **Discovery Analysis** registry table.
- **Expected Results**:
  - The endpoint route is discovered: `/api/projects/:projectId/milestones/:id`.
  - Clicking on the path or **Inspect Blueprint** button redirects to the dedicated **Endpoint Details** inspector page.
  - **Path Parameters** list contains: `projectId`, `id`.
  - **Middleware Pipeline** lists: `authMiddleware`, `validationMiddleware`.

### 12. Local Mock Sample Request & Response Generation
- **Objective**: Verify that mock payloads are deterministically constructed matching detected variable names.
- **Setup**: Zip an Express route with post/put handler having a body validator schema (e.g., Joi/Zod) specifying field fields like `email`, `password`, `age`, `name`.
- **Execution**: Open the **Endpoint Details** page and navigate to **Sample Request** and **Sample Response** tabs.
- **Expected Results**:
  - **Sample Request** contains a beautifully formatted JSON mock with valid structure (e.g., realistic email string, secure password text, name).
  - **Sample Response** contains standard database return mocks.
  - Clicking **Copy JSON** adds the text to the system clipboard and triggers a green success notification alert saying *"JSON copied to clipboard!"*.
  - **Coming Soon: Test Endpoint** button is visible but safely disabled.

