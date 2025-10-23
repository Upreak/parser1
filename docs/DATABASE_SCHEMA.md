
# PostgreSQL Database Schema

This document outlines the proposed PostgreSQL database schema for moving the AI Recruitment Hub from a `localStorage`-based prototype to a robust, scalable backend system.

## Schema Overview

The schema is normalized to ensure data integrity and minimize redundancy. It consists of several related tables to store users, AI providers, candidates, and their associated details like skills, experience, and education.

---

### Table: `users`

Stores user accounts and their roles.

```sql
CREATE TYPE user_role AS ENUM ('Admin', 'Recruiter');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Passwords should ALWAYS be hashed (e.g., with bcrypt)
    role user_role NOT NULL DEFAULT 'Recruiter',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster username lookups during login
CREATE INDEX idx_users_username ON users(username);
```

---

### Table: `ai_providers`

Stores configurations for different AI service providers.

```sql
CREATE TYPE provider_name AS ENUM ('Google Gemini', 'OpenRouter', 'Together AI');

CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name provider_name NOT NULL,
    api_key TEXT NOT NULL, -- Should be encrypted at rest
    base_url VARCHAR(255),
    parsing_model VARCHAR(100) NOT NULL,
    matching_model VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one provider can be active at a time
CREATE UNIQUE INDEX idx_ai_providers_one_active ON ai_providers(is_active) WHERE is_active = TRUE;
```

---

### Table: `candidates`

Stores the core information for each candidate.

```sql
CREATE TYPE pipeline_stage AS ENUM ('Sourced', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected');

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pipeline_stage pipeline_stage NOT NULL DEFAULT 'Sourced',
    
    -- Personal Details
    dob DATE,
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    
    -- Education Summary
    highest_education TEXT,
    second_highest_education TEXT,
    
    -- Professional Summary
    total_experience NUMERIC(4, 2), -- e.g., 5.5 years
    current_role TEXT,
    expected_role TEXT,
    job_type VARCHAR(50),
    ready_to_relocate VARCHAR(50),
    notice_period VARCHAR(50),
    current_ctc VARCHAR(100),
    expected_ctc VARCHAR(100),
    
    -- Preferences
    sector_type VARCHAR(50),
    looking_for_jobs_abroad BOOLEAN,
    
    -- Contact & Availability
    has_current_offers BOOLEAN,
    best_time_to_contact TEXT,
    preferred_mode_of_contact VARCHAR(50),

    -- Summary & Resume
    summary TEXT,
    original_resume JSONB, -- Stores { name: string, type: string, content: string (base64) }

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster searching and filtering
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_name ON candidates(name);
CREATE INDEX idx_candidates_pipeline_stage ON candidates(pipeline_stage);
```

---

### Supporting Tables (for Array Fields)

These tables handle the one-to-many or many-to-many relationships for candidate details.

#### `candidate_skills`
```sql
CREATE TABLE candidate_skills (
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (candidate_id, skill_name)
);
```

#### `candidate_languages`
```sql
CREATE TABLE candidate_languages (
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    language_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (candidate_id, language_name)
);
```

#### `candidate_locations`
```sql
CREATE TYPE location_type AS ENUM ('current', 'preferred');

CREATE TABLE candidate_locations (
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    type location_type NOT NULL,
    PRIMARY KEY (candidate_id, location_name, type)
);
```

#### `candidate_experience`
```sql
CREATE TABLE candidate_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    role TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    tools_used TEXT
);
```

#### `candidate_education`
```sql
CREATE TABLE candidate_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree TEXT NOT NULL,
    duration VARCHAR(100)
);
```
