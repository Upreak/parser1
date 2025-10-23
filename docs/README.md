
# AI Recruitment Hub

The AI Recruitment Hub is an advanced, all-in-one recruitment tool designed to streamline the hiring process. It leverages the power of Large Language Models (LLMs) to automate resume parsing, intelligently match candidates to job descriptions, and manage the entire hiring pipeline through a visual Kanban board.

## Key Features

- **AI-Powered Resume Parsing:** Upload resumes (PDF, PNG, JPG) and have the AI automatically extract key information to populate a detailed candidate profile. Includes a split-screen verification UI to compare the parsed data with the original document.
- **Advanced Candidate Database:** A searchable and filterable database of all candidates. Profiles include a "completeness score" to quickly assess data quality.
- **Intelligent JD Matcher:** Paste a job description, and the AI will analyze your candidate pool to find and rank the top matches, providing a match score and a concise reason for each.
- **AI Interview Question Generator:** For any matched candidate, instantly generate a tailored set of technical, behavioral, and situational interview questions based on their profile and the job description.
- **Visual Hiring Pipeline:** A drag-and-drop Kanban board to track candidates through customizable hiring stages (Sourced, Screening, Interview, etc.).
- **Multi-User & Role-Based Access:**
  - **Admin:** Full control over all candidates, user accounts, and AI provider settings.
  - **Recruiter:** Can manage candidates but has restricted access to sensitive actions like deletion and data export.
- **Configurable AI Providers:** An admin panel allows configuration of multiple AI providers (e.g., Google Gemini, OpenRouter, Together AI), with the ability to switch the active provider on the fly.

## Project Setup

To set up the project for local development, follow these steps:

1.  **Clone the Repository:**
    ```bash
    git clone <repository_url>
    cd <repository_folder>
    ```

2.  **Set Up and Run the Backend Server:**
    The backend is a Node.js/Express server located in the `/backend` directory.
    - **Environment Variables (Optional):** To initialize the application with a default Google Gemini provider, you can create a `.env` file inside the `/backend` directory:
      ```
      # backend/.env
      API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
      ```
    - **Install and Run:**
      ```bash
      # Navigate to the backend folder
      cd backend

      # Install dependencies
      npm install

      # Run the backend server
      npm run dev
      ```
    The server will start on `http://localhost:3001`. Keep this terminal window open. If you don't provide an API key, you will need to add an AI Provider via the Admin Panel in the UI after logging in.

3.  **Set Up and Run the Frontend:**
    Open a **new terminal window**. This project uses a simple setup without a frontend build step. You can serve the root directory using any local web server. One of the easiest methods is using VS Code's "Live Server" extension.
    - **Using VS Code Live Server:**
      1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code.
      2. Right-click on the `index.html` file in the project root and select "Open with Live Server".
    - **Using Python's built-in server:**
      ```bash
      # From the project's root directory
      python -m http.server
      ```
    Your browser will open to the correct local address (e.g., `http://127.0.0.1:5500`).

4.  **First-Time Login:** The application's backend creates a default administrator account upon first launch.
    -   **Username/Email:** `admin@example.com`
    -   **Password:** You can use any password for the default admin account, as the backend is currently configured to accept any password for this specific user for ease of first-time setup. You can manage other user accounts and set their initial passwords from the Admin Panel.
