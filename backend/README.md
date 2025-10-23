# AI Recruitment Hub - Backend Server

This directory contains the Node.js/Express backend for the AI Recruitment Hub application. It provides a RESTful API for managing users and candidates, using a PostgreSQL database for data persistence.

## Database Setup

This project uses `node-pg-migrate` to manage database schema changes.

1.  **Install PostgreSQL:**
    Ensure you have PostgreSQL installed and running on your system. You can download it from [postgresql.org](https://www.postgresql.org/download/).

2.  **Create a Database:**
    Create a new database for the application. You can do this using `psql` or a GUI tool like pgAdmin.
    ```sql
    CREATE DATABASE ai_recruitment_hub;
    ```

3.  **Configure Environment Variables:**
    The backend uses a `.env` file to store sensitive information like database credentials.
    -   Create a new file named `.env` inside the `/backend` directory.
    -   Copy the contents from `.env.example` into your new `.env` file.
    -   Fill in the values for your PostgreSQL database connection.

    ```
    # backend/.env
    # PostgreSQL Connection Details
    PGHOST=localhost
    PGUSER=your_postgres_username
    PGPASSWORD=your_postgres_password
    PGDATABASE=ai_recruitment_hub
    PGPORT=5432

    # Optional: For seeding a default Google Gemini provider on initial migration
    # API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
    ```
    If you provide an `API_KEY`, a default "Google Gemini" provider will be created for you automatically. Otherwise, you will need to add one via the Admin Panel after logging in.

4.  **Run Migrations:**
    Once your `.env` file is configured, run the migration script to create all the necessary tables in your database.
    ```bash
    npm run migrate:up
    ```
    This command will apply all pending migrations and bring your database schema to the latest version.

## Running the Server

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the server:**
    -   For development (with automatic reloading on file changes):
        ```bash
        npm run dev
        ```
    -   For production:
        ```bash
        npm run start
        ```

The server will start and listen for requests on `http://localhost:3001`.

## Managing Migrations

-   **Create a new migration:**
    ```bash
    npm run migrate:create <migration_name>
    ```
    This will create a new migration file in the `/migrations` directory.

-   **Apply all pending migrations:**
    ```bash
    npm run migrate:up
    ```

-   **Roll back the last migration:**
    ```bash
    npm run migrate:down
    ```