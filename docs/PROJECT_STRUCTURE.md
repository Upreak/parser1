
# Project Structure and Workflow

This document provides a detailed map of the project's file structure and explains the core workflows, serving as a guide for developers to understand how the application is organized and how data flows through it.

## 1. File & Folder Map

```
/
├── components/
│   ├── AdminPanel.tsx              # Main view for admin section with tabs
│   ├── AiProviderFormModal.tsx     # Modal for adding/editing AI providers
│   ├── AiProviderSettings.tsx      # UI for managing AI provider configurations
│   ├── AppSettings.tsx             # UI for app settings (e.g., pipeline stages)
│   ├── CandidatePipeline.tsx       # The drag-and-drop Kanban board for hiring stages
│   ├── CandidateSearch.tsx         # The main view for searching and filtering candidates
│   ├── Header.tsx                  # Top navigation bar of the application
│   ├── InterviewQuestionsModal.tsx # Modal for displaying AI-generated questions
│   ├── JdMatcher.tsx               # UI for matching candidates to a job description
│   ├── LoginPage.tsx               # The user login screen with OTP logic
│   ├── Modal.tsx                   # A generic, reusable confirmation modal
│   ├── ResumeUpload.tsx            # Form for adding/editing candidates, including file upload
│   ├── ToastContainer.tsx          # Displays success/error notifications (toasts)
│   └── UserManagement.tsx          # UI for admins to manage recruiter accounts
├── docs/
│   ├── ARCHITECTURE.md             # High-level overview of the technical architecture
│   ├── DATABASE_SCHEMA.md          # Production-ready PostgreSQL schema
│   ├── DEBUGGING.md                # Guide for troubleshooting common issues
│   ├── PROJECT_STRUCTURE.md        # (This file) Detailed map of the project
│   └── README.md                   # Main project overview and setup guide
├── services/
│   └── aiService.ts                # Primary service for all AI API interactions
├── utils/
│   ├── candidateUtils.ts           # Helper functions related to candidate data
│   └── fileUtils.ts                # Helper functions for file handling and CSV export
├── App.tsx                         # Main React component, manages global state
├── index.html                      # The single HTML page entry point
├── index.tsx                       # Mounts the React application to the DOM
├── metadata.json                   # Project name and description
└── types.ts                        # Centralized TypeScript type and interface definitions
```

---

## 2. Detailed File & Folder Descriptions

### `/` (Root)

-   **`App.tsx`**: The heart of the application. It's the main stateful component that manages candidates, users, AI providers, the current logged-in user, and the active UI tab. It passes state and handler functions down to all other components.
-   **`index.html`**: The single entry point for the web application. It includes the root div where React is mounted and sets up Tailwind CSS and the import map for dependencies.
-   **`index.tsx`**: The script that renders the `<App />` component into the `index.html`.
-   **`types.ts`**: Contains all shared TypeScript types and interfaces (`Candidate`, `User`, `AiProvider`, etc.), ensuring type safety and consistency across the entire project.
-   **`metadata.json`**: Basic metadata about the application.

### `components/`

This directory contains all the React UI components.

-   **`LoginPage.tsx`**: Handles the entire user authentication flow, including requesting and verifying the simulated OTP. It is rendered conditionally by `App.tsx` when no user is logged in.
-   **`Header.tsx`**: The application's top bar. Displays the company logo, user info (name/role), and the logout button.
-   **`ResumeUpload.tsx`**: The "Add/Edit Candidate" screen. It manages the complex logic for file uploading, displaying the split-screen verification UI, and handling the multi-section candidate form. It calls `aiService` to parse resumes.
-   **`CandidateSearch.tsx`**: The "Search Candidates" tab. It displays the grid of candidate cards, handles real-time searching and filtering, and manages the selection of candidates for bulk actions.
-   **`JdMatcher.tsx`**: The "JD Matcher" tab. It contains the form for the job description and displays the AI-ranked list of matched candidates. It also triggers the generation of interview questions.
-   **`CandidatePipeline.tsx`**: The "Pipeline" tab. It renders the dynamic, drag-and-drop Kanban board based on the customizable pipeline stages from the app settings.
-   **`AdminPanel.tsx`**: The main container for all administrative functions, using a tabbed interface to switch between user management, AI provider settings, and application settings.
-   **`UserManagement.tsx`**: A sub-component of the Admin Panel for creating and deleting recruiter accounts.
-   **`AiProviderSettings.tsx` & `AiProviderFormModal.tsx`**: A pair of components for managing AI provider configurations.
-   **`AppSettings.tsx`**: A sub-component of the Admin Panel for managing global app settings, like the hiring pipeline stages.

### `services/`

This directory abstracts all external API communications.

-   **`aiService.ts`**: The single source of truth for all interactions with AI models. It intelligently selects the correct API and credentials based on the active provider set in the Admin Panel. It contains the core logic and prompts for resume parsing, JD matching, and interview question generation.

### `utils/`

Contains pure helper functions that are reusable across the application.

-   **`candidateUtils.ts`**: Provides functions for processing candidate data, such as `calculateProfileCompleteness`.
-   **`fileUtils.ts`**: Contains helpers for file operations like converting files to base64 and generating CSV files for download.

---

## 3. Core Application Workflow

### Initialization & Authentication

1.  When `App.tsx` mounts, a `useEffect` hook runs.
2.  It attempts to load users, candidates, and settings from `localStorage`.
3.  If no users exist, it creates a default `admin` user.
4.  It checks `sessionStorage` for a `loggedInUserId`. If found, it sets the `currentUser` state, granting access to the app.
5.  If no user is logged in, `App.tsx` renders the `LoginPage.tsx` component exclusively.
6.  On the `LoginPage`, the user enters an email. The `onRequestOtp` function in `App.tsx` is called, which simulates OTP generation and shows it in a toast.
7.  The user enters the OTP, and the `onLogin` function in `App.tsx` verifies it, sets the `currentUser`, and stores the user's ID in `sessionStorage`. The main application is then rendered.

### Resume Parsing Workflow

1.  In `ResumeUpload.tsx`, the user selects a file (PDF, PNG, JPG).
2.  The `handleFileChange` function is triggered. It converts the file to a base64 string.
3.  It calls the `parseResumeFile` function from `services/aiService.ts`, passing the file's content and MIME type.
4.  `aiService.ts` reads the active AI provider from `localStorage`. It checks if the provider is Google Gemini, as multi-modal parsing is a Gemini-specific feature in this app.
5.  It constructs a detailed, multi-modal prompt containing instructions, the target JSON schema, and the file data.
6.  The request is sent to the Gemini API.
7.  Upon receiving the response, `aiService.ts` uses a robust JSON extractor to get the data and then sanitizes it (e.g., ensures `skills` is an array).
8.  The parsed data is returned to `ResumeUpload.tsx`.
9.  The component's state is updated, which automatically populates the form fields for the user to verify in the split-screen view.
10. The user clicks "Save," which calls the `onSaveCandidate` function passed down from `App.tsx`, updating the global candidate list.
