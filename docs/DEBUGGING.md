
# Debugging and Troubleshooting Guide

This guide provides common solutions and debugging strategies for issues that may arise while developing or using the AI Recruitment Hub.

## 1. Browser Developer Tools

Your primary tool for debugging will be your browser's developer tools (usually accessible by pressing `F12` or `Ctrl+Shift+I` / `Cmd+Option+I`).

-   **Console Tab:** Look for any red error messages. These often provide clues about what went wrong, such as `undefined` variables, failed network requests, or React rendering errors. Use `console.log()` statements in the code to inspect the values of variables at different points.
-   **Network Tab:** This tab is crucial for debugging API calls. You can inspect:
    -   The exact **payload** being sent to the AI provider.
    -   The **headers** of the request (to verify API keys).
    -   The **response** from the server. Check the status code (e.g., `200 OK`, `400 Bad Request`, `401 Unauthorized`).
    -   The raw JSON response from the AI before it's parsed by the application.
-   **Application Tab (Chrome):** Inspect `localStorage` and `sessionStorage` here to see what data is being persisted. You can manually edit or clear the storage from this tab to reset the application's state.

---

## 2. Common Issues and Solutions

### Issue: "Failed to fetch" or "Connection to backend failed" on Startup

-   **Symptom:** The application loads to a spinner and then shows an error toast with one of these messages. This is the most common issue during development.
-   **Most Common Cause:** The backend server is not running or is not accessible from the frontend.
-   **Debugging Steps:**
    1.  **Check the Backend Terminal:** Go to your terminal window where you are supposed to be running the backend server (the one where you ran `cd backend` then `npm run dev`).
    2.  **Verify it's Running:** Look for a log message like `[INFO] [Server] AI Recruitment Hub backend is running on http://localhost:3001`.
    3.  **If Not Running:** Start the server with the command `npm run dev`.
    4.  **If it Crashed:** Review the terminal for any recent `[ERROR]` messages that appeared just before it stopped. The server has crash protection, but recent error logs are the best clue.
    5.  **Directly Test the API:** Open this URL in your browser: `http://localhost:3001/api/users`.
        -   **If it works:** You should see a JSON response with the default admin user `[{"id":...,"username":"admin@example.com","role":"Admin"}]`.
        -   **If it fails** (e.g., "This site can’t be reached"): Your server is definitely not running correctly or is being blocked by a firewall or another process using the same port.

### Issue: AI Resume Parsing Fails or is Inaccurate

-   **Symptom:** The form doesn't auto-populate, or an error toast "Failed to parse resume" appears.
-   **Debugging Steps:**
    1.  **Check the Backend Terminal:** Look for `[ERROR]` logs related to the `[AI Proxy /api/ai/parse]` context. The error message from the AI provider is often logged here (e.g., "Invalid API Key").
    2.  **Check the Network Tab:** Find the `/api/ai/parse` request. The response from your backend will contain a specific error message (e.g., "AI Provider Error: The provided API key is invalid...").
    3.  **Check the AI Provider:** The multi-modal parsing (PDF/image) is specific to Google Gemini. If you have another provider active, it will fail. Make sure the correct provider is active in the Admin Panel.

### Issue: JD Matcher Fails or Returns No Results

-   **Symptom:** The "Find Best Matches" process finishes with an error or an empty list.
-   **Debugging Steps:**
    1.  **Check the Backend Terminal:** Look for `[ERROR]` logs related to the `[AI Proxy /api/ai/match]` context.
    2.  **Check the Network Tab:** Inspect the `/api/ai/match` request. A `400 Bad Request` could mean the prompt was too long. The JSON response from your backend will have a detailed error message.
    3.  **Check Candidate Data:** The matcher can fail if no candidates exist in the database. Ensure you have added candidates first.

### Issue: UI is Not Updating or Behaving Strangely

-   **Symptom:** Clicking a button does nothing, a modal won't close, or data on the screen is stale.
-   **Debugging Steps:**
    1.  **Check for Console Errors:** A JavaScript error in the browser console can halt script execution and prevent UI updates.
    2.  **Verify State Management:** Use React DevTools (browser extension) to inspect the component's state (`useState`). Is the state being updated as you expect when you perform an action?
    3.  **Check Prop Drilling:** Ensure that the correct state and handler functions are being passed down from the parent component (`App.tsx`) to the child components. An incorrect or missing prop is a common cause of unresponsive UI.

### Issue: Application Crashes (White Screen)

-   **Symptom:** The application shows a blank white screen.
-   **Debugging Steps:**
    1.  **Check the Console:** This is almost always caused by a critical runtime error. The console will show a stack trace pointing to the component and line of code that caused the crash.
    2.  **Common Cause:** A frequent cause is trying to call a method on an `undefined` value (e.g., `candidate.skills.map(...)` when `candidate.skills` is `undefined`). The code has been hardened with defensive checks (e.g., `Array.isArray(candidate.skills)`), but this is the first place to look.
