
# Application Architecture

This document provides a high-level overview of the technical architecture for the AI Recruitment Hub.

## Overall Architecture

The application follows a modern **client-server architecture**.

-   **Frontend:** A React-based Single Page Application (SPA) that provides the user interface and handles all user interactions.
-   **Backend:** A Node.js/Express server that exposes a RESTful API. It is responsible for business logic, data persistence, and secure communication with external AI services.

## Frontend Technology Stack

-   **Framework:** React 19
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **Icons:** Lucide React

## Backend Technology Stack

-   **Framework:** Node.js with Express
-   **Authentication:** JSON Web Tokens (JWT)
-   **Security:** `bcrypt` for password hashing
-   **Database (In-Memory):** The current implementation uses an in-memory data store for simplicity during development. A production-ready `DATABASE_SCHEMA.md` for PostgreSQL is provided for migration.

---

## Core Concepts

### 1. Component-Based Structure (Frontend)

The frontend is built as a SPA using a modular, component-based architecture.

-   **`App.tsx` (Root Component):** Manages global client-side state, such as the active UI tab, the current user's session, and application-wide settings. It orchestrates the rendering of different views and handles top-level data fetching from the backend.
-   **Tab Components (`ResumeUpload.tsx`, `CandidateSearch.tsx`, etc.):** Each major feature is encapsulated within its own component.
-   **Shared Components (`Modal.tsx`, `ToastContainer.tsx`):** Reusable UI elements.

### 2. State and Session Management (Frontend)

-   **Authentication State:** Upon successful login, a JWT is received from the backend and stored in `localStorage`. The authenticated user's profile is stored in `sessionStorage`. This token is included in the header of all subsequent API requests to authorize the user.
-   **Data State:** All primary data (candidates, users, AI providers) is fetched from the backend upon application load and stored in the React state within `App.tsx`. The frontend state is considered a temporary cache of the backend's source of truth.
-   **State Propagation:** State and state-updating functions are passed down from `App.tsx` to child components as props.

### 3. Services Layer

-   **Frontend (`services/aiService.ts`):** This acts as a thin client for the backend's AI capabilities. It constructs requests to the backend's secure proxy endpoints (`/api/ai/*`). It reads the JWT from `localStorage` to authenticate its requests. **It does not handle any API keys or complex logic.**
-   **Backend (AI Proxy Endpoints):** The backend provides endpoints like `/api/ai/parse`, `/api/ai/match`, etc. These endpoints receive requests from the frontend, retrieve the secure, stored API keys for the active AI provider, and then make the actual calls to the external AI service (e.g., Google Gemini). This design ensures that **no sensitive API keys are ever exposed to the client browser**.

### 4. Data Flow for Resume Parsing

1.  **`ResumeUpload.tsx`:** The user uploads a file. The component calls `parseResumeFile` in `services/aiService.ts`.
2.  **`services/aiService.ts`:**
    -   Reads the JWT from `localStorage`.
    -   Sends a `POST` request to the backend's `/api/ai/parse` endpoint, including the auth token and the resume file data.
3.  **Backend Server (`server.js`):**
    -   The `authenticateToken` middleware verifies the JWT.
    -   The `/api/ai/parse` handler receives the request.
    -   It retrieves the active AI provider's configuration and secure API key from its internal state.
    -   It makes a direct, server-to-server call to the external AI provider (e.g., Google Gemini).
    -   It receives the JSON response from the AI, sanitizes it, and returns the clean data to the frontend.
4.  **`ResumeUpload.tsx`:** Receives the parsed data, populates the form, and the user verifies and saves the new candidate, which triggers another authenticated API call to `POST /api/candidates`.
