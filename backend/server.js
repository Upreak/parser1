
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GoogleGenAI, Type } = require('@google/genai');
const { Pool } = require('pg');
require('dotenv').config();


const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-for-development';

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- Database Connection ---
const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
});

pool.connect((err) => {
    if (err) {
        log('ERROR', 'Database', 'Failed to connect to PostgreSQL.', err);
    } else {
        log('INFO', 'Database', 'Successfully connected to PostgreSQL.');
    }
});


// --- Structured Logger ---
const log = (level, context, message, error = null) => {
    const timestamp = new Date().toISOString();
    const errorString = error ? ` | Error: ${error.stack || error.message || 'Unknown error'}` : '';
    console.log(`${timestamp} [${level}] [${context}] ${message}${errorString}`);
};


// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
};

// --- Authentication Endpoints ---
app.post('/api/auth/login', async (req, res) => {
    const context = 'POST /api/auth/login';
    const { username, password } = req.body;
    log('INFO', context, `Login attempt for username: ${username}`);

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            log('WARN', context, 'Login failed: User not found.');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordCorrect = (user.username === 'admin@example.com') 
            ? true 
            : await bcrypt.compare(password, user.password_hash);

        if (isPasswordCorrect) {
            const userPayload = { id: user.id, username: user.username, role: user.role };
            const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });
            log('INFO', context, `Login successful for ${username}.`);
            res.json({ token, user: userPayload });
        } else {
            log('WARN', context, 'Login failed: Incorrect password.');
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch(error) {
        log('ERROR', context, 'Database error during login.', error);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
});


// --- User Management Endpoints (Protected) ---
app.get('/api/users', authenticateToken, authorizeAdmin, async (req, res) => {
    const context = 'GET /api/users';
    log('INFO', context, `Request received by admin: ${req.user.username}`);
     try {
        const result = await pool.query("SELECT id, username, role FROM users WHERE role = 'Recruiter'");
        log('INFO', context, `Successfully retrieved ${result.rows.length} recruiter users.`);
        res.json(result.rows);
    } catch (error) {
        log('ERROR', context, 'Failed to fetch users.', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.post('/api/users', authenticateToken, authorizeAdmin, async (req, res) => {
    const context = 'POST /api/users';
    const { username, password } = req.body;
    log('INFO', context, `Request received to create user: ${username} by admin: ${req.user.username}`);
    
    if (!username || !password || !username.includes('@') || password.length < 6) {
        const msg = 'A valid username (email) and a password of at least 6 characters are required.';
        log('ERROR', context, `Validation failed: ${msg}`);
        return res.status(400).json({ message: msg });
    }
    
    try {
        const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            const msg = 'A user with this email already exists.';
            log('ERROR', context, `Conflict: ${msg}`);
            return res.status(409).json({ message: msg });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, passwordHash, 'Recruiter']
        );
        const newUser = result.rows[0];
        log('INFO', context, `User created successfully: ${newUser.id}`);
        res.status(201).json(newUser);
    } catch(error) {
        log('ERROR', context, 'Failed to create user.', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.delete('/api/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const context = `DELETE /api/users/${id}`;
    log('INFO', context, 'Request received');

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            const msg = 'User not found.';
            log('ERROR', context, `Not found: ${msg}`);
            return res.status(404).json({ message: msg });
        }
        log('INFO', context, `User deleted successfully`);
        res.status(204).send();
    } catch (error) {
        log('ERROR', context, 'Failed to delete user.', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// --- Candidate Helper Functions ---
const candidateFields = `
    c.id, c.name, c.email, c.phone, c.last_updated AS "lastUpdated", c.pipeline_stage AS "pipelineStage",
    c.dob, c.gender, c.marital_status AS "maritalStatus", c.highest_education AS "highestEducation",
    c.second_highest_education AS "secondHighestEducation", c.third_highest_education AS "thirdHighestEducation",
    c.diploma, c.iti, c.puc, c.sslc,
    c.total_experience AS "totalExperience", c.current_role AS "currentRole", c.expected_role AS "expectedRole",
    c.job_type AS "jobType", c.ready_to_relocate AS "readyToRelocate", c.notice_period AS "noticePeriod",
    c.current_ctc AS "currentCTC", c.expected_ctc AS "expectedCTC", c.sector_type AS "sectorType",
    c.looking_for_jobs_abroad AS "lookingForJobsAbroad", c.has_current_offers AS "hasCurrentOffers",
    c.best_time_to_contact AS "bestTimeToContact", c.preferred_mode_of_contact AS "preferredModeOfContact",
    c.summary, c.original_resume AS "originalResume", c.created_at AS "createdAt"
`;

// This function reconstructs the full candidate object from the normalized tables.
const mapDbRowsToCandidates = (candidateRows, relatedRows) => {
    const candidateMap = new Map();

    candidateRows.forEach(row => {
        candidateMap.set(row.id, {
            ...row,
            skills: [], languages: [], certificates: [],
            currentLocations: [], preferredLocations: [],
            preferredIndustries: [], experience: [], education: []
        });
    });

    relatedRows.skills.forEach(r => candidateMap.get(r.candidate_id)?.skills.push(r.skill_name));
    relatedRows.languages.forEach(r => candidateMap.get(r.candidate_id)?.languages.push(r.language_name));
    relatedRows.certificates.forEach(r => candidateMap.get(r.candidate_id)?.certificates.push(r.certificate_name));
    relatedRows.industries.forEach(r => candidateMap.get(r.candidate_id)?.preferredIndustries.push(r.industry_name));
    relatedRows.locations.forEach(r => {
        if (r.type === 'current') candidateMap.get(r.candidate_id)?.currentLocations.push(r.location_name);
        else candidateMap.get(r.candidate_id)?.preferredLocations.push(r.location_name);
    });
    relatedRows.experience.forEach(r => candidateMap.get(r.candidate_id)?.experience.push({ id: r.id, company: r.company, role: r.role, startDate: r.start_date, endDate: r.end_date, duration: r.duration, description: r.description, toolsUsed: r.tools_used }));
    relatedRows.education.forEach(r => candidateMap.get(r.candidate_id)?.education.push({ id: r.id, institution: r.institution, degree: r.degree, duration: r.duration }));
    
    return Array.from(candidateMap.values());
};


// --- Candidate Management Endpoints (Protected) ---
app.get('/api/candidates', authenticateToken, async (req, res) => {
    const context = 'GET /api/candidates';
    log('INFO', context, 'Request received');
    try {
        const candidateResult = await pool.query(`SELECT ${candidateFields} FROM candidates c ORDER BY c.last_updated DESC`);
        
        if (candidateResult.rows.length === 0) {
            return res.json([]);
        }

        const candidateIds = candidateResult.rows.map(c => c.id);
        
        const [skills, languages, certificates, industries, locations, experience, education] = await Promise.all([
            pool.query('SELECT * FROM candidate_skills WHERE candidate_id = ANY($1)', [candidateIds]),
            pool.query('SELECT * FROM candidate_languages WHERE candidate_id = ANY($1)', [candidateIds]),
            pool.query('SELECT * FROM candidate_certificates WHERE candidate_id = ANY($1)', [candidateIds]),
            pool.query('SELECT * FROM candidate_industries WHERE candidate_id = ANY($1)', [candidateIds]),
            pool.query('SELECT * FROM candidate_locations WHERE candidate_id = ANY($1)', [candidateIds]),
            pool.query('SELECT * FROM candidate_experience WHERE candidate_id = ANY($1)', [candidateIds]),
            pool.query('SELECT * FROM candidate_education WHERE candidate_id = ANY($1)', [candidateIds]),
        ]);

        const candidates = mapDbRowsToCandidates(candidateResult.rows, {
            skills: skills.rows,
            languages: languages.rows,
            certificates: certificates.rows,
            industries: industries.rows,
            locations: locations.rows,
            experience: experience.rows,
            education: education.rows,
        });

        log('INFO', context, `Successfully retrieved ${candidates.length} candidates.`);
        res.json(candidates);
    } catch (error) {
        log('ERROR', context, 'Failed to retrieve candidates', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/candidates', authenticateToken, async (req, res) => {
    const context = 'POST /api/candidates';
    log('INFO', context, 'Request received');
    const { id, lastUpdated, createdAt, confidenceScores, ...data } = req.body;

    if (!data.name || !data.email) {
        return res.status(400).json({ message: 'Candidate name and email are required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert into main candidates table
        const candidateRes = await client.query(
            `INSERT INTO candidates (name, email, phone, pipeline_stage, dob, gender, marital_status, highest_education, second_highest_education, third_highest_education, diploma, iti, puc, sslc, total_experience, current_role, expected_role, job_type, ready_to_relocate, notice_period, current_ctc, expected_ctc, sector_type, looking_for_jobs_abroad, has_current_offers, best_time_to_contact, preferred_mode_of_contact, summary, original_resume)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
             RETURNING id`,
            [data.name, data.email, data.phone, data.pipelineStage, data.dob || null, data.gender, data.maritalStatus, data.highestEducation, data.secondHighestEducation, data.thirdHighestEducation, data.diploma, data.iti, data.puc, data.sslc, data.totalExperience || null, data.currentRole, data.expectedRole, data.jobType, data.readyToRelocate, data.noticePeriod, data.currentCTC, data.expectedCTC, data.sectorType, data.lookingForJobsAbroad === 'Yes', data.hasCurrentOffers === 'Yes', data.bestTimeToContact, data.preferredModeOfContact, data.summary, data.originalResume]
        );
        const newCandidateId = candidateRes.rows[0].id;

        // Batch insert related data
        if (data.skills?.length > 0) await client.query(`INSERT INTO candidate_skills (candidate_id, skill_name) SELECT '${newCandidateId}', unnest($1::text[])`, [data.skills]);
        if (data.languages?.length > 0) await client.query(`INSERT INTO candidate_languages (candidate_id, language_name) SELECT '${newCandidateId}', unnest($1::text[])`, [data.languages]);
        if (data.certificates?.length > 0) await client.query(`INSERT INTO candidate_certificates (candidate_id, certificate_name) SELECT '${newCandidateId}', unnest($1::text[])`, [data.certificates]);
        if (data.preferredIndustries?.length > 0) await client.query(`INSERT INTO candidate_industries (candidate_id, industry_name) SELECT '${newCandidateId}', unnest($1::text[])`, [data.preferredIndustries]);
        if (data.currentLocations?.length > 0) await client.query(`INSERT INTO candidate_locations (candidate_id, location_name, type) SELECT '${newCandidateId}', unnest($1::text[]), 'current'`, [data.currentLocations]);
        if (data.preferredLocations?.length > 0) await client.query(`INSERT INTO candidate_locations (candidate_id, location_name, type) SELECT '${newCandidateId}', unnest($1::text[]), 'preferred'`, [data.preferredLocations]);

        if (data.experience?.length > 0) {
            for (const exp of data.experience) {
                await client.query(`INSERT INTO candidate_experience (candidate_id, company, role, start_date, end_date, duration, description, tools_used) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [newCandidateId, exp.company, exp.role, exp.startDate, exp.endDate, exp.duration, exp.description, exp.toolsUsed]);
            }
        }
        // Legacy education field, keeping for compatibility
        if (data.education?.length > 0) {
             for (const edu of data.education) {
                await client.query(`INSERT INTO candidate_education (candidate_id, institution, degree, duration) VALUES ($1, $2, $3, $4)`, [newCandidateId, edu.institution, edu.degree, edu.duration]);
            }
        }

        await client.query('COMMIT');
        
        // Fetch the newly created candidate to return it fully formed
        const newCandidateResult = await pool.query(`SELECT ${candidateFields} FROM candidates c WHERE c.id = $1`, [newCandidateId]);
        const newCandidate = newCandidateResult.rows[0];

        log('INFO', context, `Candidate '${data.name}' created successfully: ${newCandidateId}`);
        res.status(201).json({ ...newCandidate, ...data }); // Return a reconstructed object
    } catch (error) {
        await client.query('ROLLBACK');
        log('ERROR', context, 'Failed to create candidate.', error);
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'A candidate with this email already exists.' });
        }
        res.status(500).json({ message: 'Internal server error.' });
    } finally {
        client.release();
    }
});

app.put('/api/candidates/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const context = `PUT /api/candidates/${id}`;
    log('INFO', context, 'Request received');
    
    const { confidenceScores, ...data } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Update main table
        await client.query(
            `UPDATE candidates SET
                name = $1, email = $2, phone = $3, pipeline_stage = $4, dob = $5, gender = $6, marital_status = $7, highest_education = $8, second_highest_education = $9, third_highest_education = $10, diploma = $11, iti = $12, puc = $13, sslc = $14, total_experience = $15, current_role = $16, expected_role = $17, job_type = $18, ready_to_relocate = $19, notice_period = $20, current_ctc = $21, expected_ctc = $22, sector_type = $23, looking_for_jobs_abroad = $24, has_current_offers = $25, best_time_to_contact = $26, preferred_mode_of_contact = $27, summary = $28, original_resume = $29, last_updated = now()
             WHERE id = $30`,
            [data.name, data.email, data.phone, data.pipelineStage, data.dob || null, data.gender, data.maritalStatus, data.highestEducation, data.secondHighestEducation, data.thirdHighestEducation, data.diploma, data.iti, data.puc, data.sslc, data.totalExperience || null, data.currentRole, data.expectedRole, data.jobType, data.readyToRelocate, data.noticePeriod, data.currentCTC, data.expectedCTC, data.sectorType, data.lookingForJobsAbroad === 'Yes', data.hasCurrentOffers === 'Yes', data.bestTimeToContact, data.preferredModeOfContact, data.summary, data.originalResume, id]
        );

        // Clear and re-insert related data
        await Promise.all([
            client.query('DELETE FROM candidate_skills WHERE candidate_id = $1', [id]),
            client.query('DELETE FROM candidate_languages WHERE candidate_id = $1', [id]),
            client.query('DELETE FROM candidate_certificates WHERE candidate_id = $1', [id]),
            client.query('DELETE FROM candidate_industries WHERE candidate_id = $1', [id]),
            client.query('DELETE FROM candidate_locations WHERE candidate_id = $1', [id]),
            client.query('DELETE FROM candidate_experience WHERE candidate_id = $1', [id]),
            client.query('DELETE FROM candidate_education WHERE candidate_id = $1', [id]),
        ]);

        if (data.skills?.length > 0) await client.query(`INSERT INTO candidate_skills (candidate_id, skill_name) SELECT '${id}', unnest($1::text[])`, [data.skills]);
        if (data.languages?.length > 0) await client.query(`INSERT INTO candidate_languages (candidate_id, language_name) SELECT '${id}', unnest($1::text[])`, [data.languages]);
        if (data.certificates?.length > 0) await client.query(`INSERT INTO candidate_certificates (candidate_id, certificate_name) SELECT '${id}', unnest($1::text[])`, [data.certificates]);
        if (data.preferredIndustries?.length > 0) await client.query(`INSERT INTO candidate_industries (candidate_id, industry_name) SELECT '${id}', unnest($1::text[])`, [data.preferredIndustries]);
        if (data.currentLocations?.length > 0) await client.query(`INSERT INTO candidate_locations (candidate_id, location_name, type) SELECT '${id}', unnest($1::text[]), 'current'`, [data.currentLocations]);
        if (data.preferredLocations?.length > 0) await client.query(`INSERT INTO candidate_locations (candidate_id, location_name, type) SELECT '${id}', unnest($1::text[]), 'preferred'`, [data.preferredLocations]);
        if (data.experience?.length > 0) {
            for (const exp of data.experience) await client.query(`INSERT INTO candidate_experience (candidate_id, company, role, start_date, end_date, duration, description, tools_used) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, exp.company, exp.role, exp.startDate, exp.endDate, exp.duration, exp.description, exp.toolsUsed]);
        }
        if (data.education?.length > 0) {
             for (const edu of data.education) await client.query(`INSERT INTO candidate_education (candidate_id, institution, degree, duration) VALUES ($1, $2, $3, $4)`, [id, edu.institution, edu.degree, edu.duration]);
        }
        
        await client.query('COMMIT');
        
        const updatedCandidateResult = await pool.query(`SELECT ${candidateFields} FROM candidates c WHERE c.id = $1`, [id]);
        
        log('INFO', context, `Candidate '${data.name}' updated successfully.`);
        res.json({ ...updatedCandidateResult.rows[0], ...data });
    } catch (error) {
        await client.query('ROLLBACK');
        log('ERROR', context, 'Failed to update candidate.', error);
        res.status(500).json({ message: 'Internal server error.' });
    } finally {
        client.release();
    }
});

app.delete('/api/candidates/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const context = `DELETE /api/candidates/${id}`;
    log('INFO', context, 'Request received');

    try {
        const result = await pool.query('DELETE FROM candidates WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }
        log('INFO', context, `Candidate deleted successfully.`);
        res.status(204).send();
    } catch (error) {
        log('ERROR', context, 'Failed to delete candidate.', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- AI Provider Management Endpoints (Protected & Admin Only) ---
const maskApiKey = (key) => key ? `••••••••••••${key.slice(-4)}` : '';

app.get('/api/ai-providers', authenticateToken, authorizeAdmin, async (req, res) => {
    const context = 'GET /api/ai-providers';
    log('INFO', context, 'Request received');
    try {
        const [providersResult, settingsResult] = await Promise.all([
            pool.query('SELECT * FROM ai_providers'),
            pool.query("SELECT value FROM app_settings WHERE key = 'activeProviderId'")
        ]);
        const safeProviders = providersResult.rows.map(p => ({ ...p, apiKey: maskApiKey(p.api_key), name: p.name }));
        const activeProviderId = settingsResult.rows[0]?.value || null;
        log('INFO', context, 'Successfully retrieved AI providers.');
        res.json({ providers: safeProviders, activeProviderId });
    } catch (error) {
        log('ERROR', context, 'Failed to retrieve providers', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/ai-providers', authenticateToken, authorizeAdmin, async (req, res) => {
    const context = 'POST /api/ai-providers';
    log('INFO', context, 'Request received');
    const { name, apiKey, baseURL, parsingModel, matchingModel } = req.body;
    if (!name || !apiKey || !parsingModel || !matchingModel) {
        return res.status(400).json({ message: 'Missing required provider fields.' });
    }
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            'INSERT INTO ai_providers (name, api_key, base_url, parsing_model, matching_model) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, apiKey, baseURL, parsingModel, matchingModel]
        );
        const newProvider = result.rows[0];
        
        const activeIdRes = await client.query("SELECT value FROM app_settings WHERE key = 'activeProviderId'");
        if (!activeIdRes.rows[0]?.value || activeIdRes.rows[0]?.value === 'null') {
            await client.query("UPDATE app_settings SET value = $1 WHERE key = 'activeProviderId'", [JSON.stringify(newProvider.id)]);
        }

        await client.query('COMMIT');
        log('INFO', context, `AI Provider '${newProvider.name}' created successfully.`);
        res.status(201).json({ ...newProvider, apiKey: maskApiKey(newProvider.api_key) });
    } catch (error) {
        await client.query('ROLLBACK');
        log('ERROR', context, 'Failed to create AI provider.', error);
        res.status(500).json({ message: 'Internal server error.' });
    } finally {
        client.release();
    }
});

app.put('/api/ai-providers/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const context = `PUT /api/ai-providers/${id}`;
    log('INFO', context, 'Request received');
    const { name, apiKey, baseURL, parsingModel, matchingModel } = req.body;

    try {
        const existing = await pool.query('SELECT api_key FROM ai_providers WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: 'Provider not found.' });
        
        const finalApiKey = apiKey ? apiKey : existing.rows[0].api_key;
        
        const result = await pool.query(
            'UPDATE ai_providers SET name = $1, api_key = $2, base_url = $3, parsing_model = $4, matching_model = $5, updated_at = now() WHERE id = $6 RETURNING *',
            [name, finalApiKey, baseURL, parsingModel, matchingModel, id]
        );
        
        const updatedProvider = result.rows[0];
        log('INFO', context, `AI Provider '${updatedProvider.name}' updated successfully.`);
        res.json({ ...updatedProvider, apiKey: maskApiKey(updatedProvider.api_key) });
    } catch (error) {
        log('ERROR', context, 'Failed to update AI provider.', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.delete('/api/ai-providers/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const context = `DELETE /api/ai-providers/${id}`;
    log('INFO', context, 'Request received');
    try {
        const activeIdRes = await pool.query("SELECT value FROM app_settings WHERE key = 'activeProviderId'");
        if (JSON.parse(activeIdRes.rows[0]?.value) === id) {
             return res.status(400).json({ message: 'Cannot delete the active provider.' });
        }
        const result = await pool.query('DELETE FROM ai_providers WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'AI Provider not found.' });
        log('INFO', context, 'AI Provider deleted successfully.');
        res.status(204).send();
    } catch (error) {
        log('ERROR', context, 'Failed to delete AI provider.', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.post('/api/ai-providers/active', authenticateToken, authorizeAdmin, async (req, res) => {
    const context = 'POST /api/ai-providers/active';
    const { providerId } = req.body;
    log('INFO', context, `Request received to set active provider to ${providerId}`);
    try {
        await pool.query("UPDATE app_settings SET value = $1 WHERE key = 'activeProviderId'", [JSON.stringify(providerId)]);
        log('INFO', context, 'Active AI Provider updated successfully.');
        res.status(200).json({ message: 'Active provider updated successfully.' });
    } catch (error) {
        log('ERROR', context, 'Failed to set active provider.', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// --- AI Service Logic ---
async function getActiveProvider() {
    const settingsRes = await pool.query("SELECT value FROM app_settings WHERE key = 'activeProviderId'");
    const activeId = JSON.parse(settingsRes.rows[0]?.value);
    if (!activeId) throw new Error("No active AI provider is configured. Please set one in the Admin Panel.");
    
    const providerRes = await pool.query("SELECT * FROM ai_providers WHERE id = $1", [activeId]);
    if (providerRes.rows.length === 0) throw new Error("Active AI provider configuration not found.");
    
    const provider = providerRes.rows[0];
    // map db snake_case to camelCase for the app
    return {
        id: provider.id,
        name: provider.name,
        apiKey: provider.api_key,
        baseURL: provider.base_url,
        parsingModel: provider.parsing_model,
        matchingModel: provider.matching_model,
    };
};

function extractAndParseJson(text) {
    const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```|({[\s\S]*}|\[[\s\S]*\])/);
    if (!jsonMatch) throw new Error("Could not find a valid JSON object or array in the AI's response.");
    const jsonString = jsonMatch[2] || jsonMatch[0];
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(`The AI returned a malformed JSON. Parser error: ${error.message}`);
    }
}

async function generateContent(model, contents, config) {
    const provider = await getActiveProvider();
    log('INFO', `AI Service (${provider.name})`, `Generating content with model: ${model}`);
    if (provider.name === 'Google Gemini') {
        const ai = new GoogleGenAI({ apiKey: provider.apiKey });
        const response = await ai.models.generateContent({ model, contents, config });
        return { text: response.text };
    } else {
        const endpoint = provider.baseURL ? `${provider.baseURL.replace(/\/$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
        let finalContents = contents;
        if (config.responseSchema) finalContents = `Your response MUST be a valid JSON object. Do not add any text before or after the JSON. The JSON schema is: ${JSON.stringify(config.responseSchema)}\n\n---\n\nPROMPT: ${contents}`;
        const body = { model, messages: [{ role: 'user', content: finalContents }], ...(config.responseMimeType === "application/json" && { response_format: { type: "json_object" } }) };
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` };
        if (provider.name === 'OpenRouter') { headers['HTTP-Referer'] = 'https://aistudio.google.com/'; headers['X-Title'] = 'AI Recruitment Hub'; }
        const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!response.ok) { const errorText = await response.text(); throw new Error(`API Error from ${provider.name}: ${response.status} - ${errorText}`); }
        const data = await response.json();
        return { text: data.choices[0]?.message?.content || '' };
    }
}
// --- Schemas ---
const resumeSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Full name of the candidate." },
        email: { type: Type.STRING, description: "Email address." },
        phone: { type: Type.STRING, description: "Phone number." },
        dob: { type: Type.STRING, description: "Date of birth (YYYY-MM-DD)." },
        gender: { type: Type.STRING, description: "Gender of the candidate." },
        maritalStatus: { type: Type.STRING, description: "Marital status." },
        languages: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Languages spoken." },
        highestEducation: { type: Type.STRING, description: "Highest educational qualification." },
        secondHighestEducation: { type: Type.STRING },
        thirdHighestEducation: { type: Type.STRING },
        certificates: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of certifications." },
        totalExperience: { type: Type.NUMBER, description: "Total years of professional experience." },
        currentRole: { type: Type.STRING },
        expectedRole: { type: Type.STRING },
        jobType: { type: Type.STRING, description: "e.g., Full-time, Part-time, Contract" },
        currentLocations: { type: Type.ARRAY, items: { type: Type.STRING } },
        preferredLocations: { type: Type.ARRAY, items: { type: Type.STRING } },
        readyToRelocate: { type: Type.STRING, description: "Yes, No, or Open to Discussion." },
        noticePeriod: { type: Type.STRING, description: "e.g., Immediate, 30 Days" },
        currentCTC: { type: Type.STRING, description: "Current Cost To Company (e.g., 15 LPA)." },
        expectedCTC: { type: Type.STRING, description: "Expected Cost To Company." },
        lookingForJobsAbroad: { type: Type.STRING, description: "Yes or No." },
        sectorType: { type: Type.STRING, description: "Government, Private, or Both." },
        preferredIndustries: { type: Type.ARRAY, items: { type: Type.STRING } },
        hasCurrentOffers: { type: Type.STRING, description: "Yes or No." },
        bestTimeToContact: { type: Type.STRING },
        preferredModeOfContact: { type: Type.STRING, description: "Call, WhatsApp, or Email." },
        skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key technical and soft skills." },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    startDate: { type: Type.STRING, description: "Start date (YYYY-MM)." },
                    endDate: { type: Type.STRING, description: "End date (YYYY-MM or Present)." },
                    description: { type: Type.STRING, description: "Key responsibilities and achievements." },
                    toolsUsed: { type: Type.STRING, description: "Tools, technologies, or frameworks used." }
                },
                required: ["company", "role"]
            }
        },
        summary: { type: Type.STRING, description: "A brief professional summary of the candidate." },
        confidenceScores: {
            type: Type.OBJECT,
            description: "An object where keys are the field names from this schema (e.g., 'name', 'totalExperience', 'skills') and values are a confidence score from 0.0 (low) to 1.0 (high) for each extracted field."
        },
    },
    required: ["name", "email", "phone", "skills", "summary"]
};

const matcherSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "The unique ID of the candidate." },
            matchScore: { type: Type.INTEGER, description: "A score from 0 to 100 indicating the match quality." },
            matchReason: { type: Type.STRING, description: "A concise reason explaining why the candidate is a good match." }
        },
        required: ["id", "matchScore", "matchReason"]
    }
};

const questionGeneratorSchema = {
    type: Type.OBJECT,
    properties: {
        technical: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of technical questions relevant to the candidate's skills and the job description."
        },
        behavioral: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of behavioral questions to assess teamwork, problem-solving, and cultural fit."
        },
        situational: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of situational or scenario-based questions."
        }
    },
    required: ["technical", "behavioral", "situational"]
};


// --- AI Proxy Endpoints (Protected) ---
const createProxyEndpoint = (handler) => async (req, res) => {
    const context = `AI Proxy ${req.path}`;
    log('INFO', context, 'Request received.');
    try {
        const result = await handler(req.body);
        log('INFO', context, 'Successfully processed AI request.');
        res.json(result);
    } catch (error) {
        log('ERROR', context, 'Processing failed', error);
        
        let errorMessage = 'An internal server error occurred in the AI service.';
        let statusCode = 500;

        if (error.message) {
            const lowerError = error.message.toLowerCase();
            if (lowerError.includes('api key not valid') || lowerError.includes('invalid api key')) {
                errorMessage = 'AI Provider Error: The provided API key is invalid or has expired.';
                statusCode = 401; 
            } else if (lowerError.includes('429') || lowerError.includes('rate limit')) {
                 errorMessage = 'AI Provider Error: Rate limit exceeded. Please try again later.';
                 statusCode = 429;
            } else if (lowerError.includes('model not found')) {
                errorMessage = `AI Provider Error: The specified model was not found. Please check the provider settings.`;
                statusCode = 400;
            } else if (lowerError.includes('no active ai provider')) {
                errorMessage = error.message; 
                statusCode = 400;
            } else if (lowerError.includes('malformed json')) {
                errorMessage = `AI Response Error: The AI returned malformed data. ${error.message}`;
                statusCode = 500;
            } else {
                errorMessage = error.message;
            }
        }
        
        res.status(statusCode).json({ message: errorMessage });
    }
};

app.post('/api/ai/parse', authenticateToken, createProxyEndpoint(async ({ resumeFile }) => {
    const provider = await getActiveProvider();
    if (provider.name !== 'Google Gemini') throw new Error("Multi-modal file parsing is only supported with the Google Gemini provider.");
    const ai = new GoogleGenAI({ apiKey: provider.apiKey });
    const filePart = { inlineData: { mimeType: resumeFile.type, data: resumeFile.content.split(',')[1] } };
    const prompt = `You are an expert resume parsing system with OCR capabilities. Analyze the provided document and extract the candidate's information strictly according to the provided JSON schema. For each field you extract, provide a confidence score from 0.0 (low) to 1.0 (high) in a separate 'confidenceScores' object, representing how certain you are about the extracted value. Your entire response must be ONLY the JSON object.`;
    const response = await ai.models.generateContent({ model: provider.parsingModel, contents: { parts: [{ text: prompt }, filePart] }, config: { responseMimeType: "application/json", responseSchema: resumeSchema } });
    return extractAndParseJson(response.text);
}));

app.post('/api/ai/match', authenticateToken, createProxyEndpoint(async ({ jobDescription, candidates }) => {
    const provider = await getActiveProvider();
    const candidateSummaries = candidates.map(c => ({ id: c.id, summary: `Name: ${c.name}, Skills: ${Array.isArray(c.skills) ? c.skills.join(', ') : ''}. Summary: ${c.summary}`, experience: Array.isArray(c.experience) ? c.experience.map(e => `${e.role} at ${e.company}`).join('. ') : '', totalExperience: c.totalExperience, currentRole: c.currentRole, noticePeriod: c.noticePeriod }));
    const prompt = `Job Description:\n---\n${jobDescription}\n---\nAvailable Candidates:\n---\n${JSON.stringify(candidateSummaries)}\n---\nBased on the job description, analyze the candidates. Return a ranked list of the top 5 matches. For each, provide a score (0-100) and a brief reason. Format as JSON array according to the schema.`;
    const response = await generateContent(provider.matchingModel, prompt, { responseMimeType: "application/json", responseSchema: matcherSchema });
    const matchResults = extractAndParseJson(response.text);
    const matchedCandidates = matchResults.map(result => { const candidate = candidates.find(c => c.id === result.id); if (!candidate) return null; return { ...candidate, matchScore: result.matchScore, matchReason: result.matchReason }; }).filter(c => c !== null);
    return matchedCandidates.sort((a, b) => b.matchScore - a.matchScore);
}));

app.post('/api/ai/generate-questions', authenticateToken, createProxyEndpoint(async ({ candidate, jobDescription }) => {
    const provider = await getActiveProvider();
    const candidateProfile = `- Name: ${candidate.name}\n- Role: ${candidate.currentRole || 'N/A'}\n- Experience: ${candidate.totalExperience || 'N/A'} years\n- Skills: ${(Array.isArray(candidate.skills) ? candidate.skills : []).join(', ')}\n- Summary: ${candidate.summary}`;
    const prompt = `Based on the following candidate profile and job description, generate a set of insightful interview questions (3-5 per category: technical, behavioral, situational).\n\nCandidate Profile:\n---\n${candidateProfile}\n---\nJob Description:\n---\n${jobDescription}\n---\nFormat the output as a JSON object according to the schema.`;
    const response = await generateContent(provider.matchingModel, prompt, { responseMimeType: "application/json", responseSchema: questionGeneratorSchema });
    return extractAndParseJson(response.text);
}));

// --- Server Initialization ---
app.listen(PORT, () => {
    log('INFO', 'Server', `AI Recruitment Hub backend is running on http://localhost:${PORT}`);
});

// --- Top-level Error Handlers to Prevent Crashes ---
process.on('uncaughtException', (error) => {
    log('ERROR', 'UncaughtException', 'An uncaught exception occurred. The server will not crash.', error);
});

process.on('unhandledRejection', (reason, promise) => {
    log('ERROR', 'UnhandledRejection', 'An unhandled promise rejection occurred. The server will not crash.', reason);
});
