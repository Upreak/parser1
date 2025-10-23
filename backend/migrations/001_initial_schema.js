/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // 1. Create ENUM types
    pgm.createType('user_role', ['Admin', 'Recruiter']);
    pgm.createType('provider_name', ['Google Gemini', 'OpenRouter', 'Together AI']);
    pgm.createType('location_type', ['current', 'preferred']);

    // 2. Create users table
    pgm.createTable('users', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        username: { type: 'varchar(100)', notNull: true, unique: true },
        password_hash: { type: 'varchar(255)', notNull: true },
        role: { type: 'user_role', notNull: true, default: 'Recruiter' },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
    });
    pgm.createIndex('users', 'username');

    // 3. Create ai_providers table
    pgm.createTable('ai_providers', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        name: { type: 'provider_name', notNull: true },
        api_key: { type: 'text', notNull: true },
        base_url: { type: 'varchar(255)' },
        parsing_model: { type: 'varchar(100)', notNull: true },
        matching_model: { type: 'varchar(100)', notNull: true },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
    });
     // Active provider will be managed by a separate settings table or logic, simplifying this table.

    // 4. Create candidates table
    pgm.createTable('candidates', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        name: { type: 'varchar(255)', notNull: true },
        email: { type: 'varchar(255)', notNull: true, unique: true },
        phone: { type: 'varchar(50)' },
        last_updated: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
        pipeline_stage: { type: 'varchar(100)', notNull: true, default: 'Sourced' },
        dob: { type: 'date' },
        gender: { type: 'varchar(50)' },
        marital_status: { type: 'varchar(50)' },
        highest_education: { type: 'text' },
        second_highest_education: { type: 'text' },
        third_highest_education: { type: 'text' },
        diploma: { type: 'text' },
        iti: { type: 'text' },
        puc: { type: 'text' },
        sslc: { type: 'text' },
        total_experience: { type: 'numeric(4, 2)' },
        current_role: { type: 'text' },
        expected_role: { type: 'text' },
        job_type: { type: 'varchar(50)' },
        ready_to_relocate: { type: 'varchar(50)' },
        notice_period: { type: 'varchar(50)' },
        current_ctc: { type: 'varchar(100)' },
        expected_ctc: { type: 'varchar(100)' },
        sector_type: { type: 'varchar(50)' },
        looking_for_jobs_abroad: { type: 'boolean' },
        has_current_offers: { type: 'boolean' },
        best_time_to_contact: { type: 'text' },
        preferred_mode_of_contact: { type: 'varchar(50)' },
        summary: { type: 'text' },
        original_resume: { type: 'jsonb' },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
    });
    pgm.createIndex('candidates', 'email');
    pgm.createIndex('candidates', 'name');
    pgm.createIndex('candidates', 'pipeline_stage');

    // 5. Create supporting tables for one-to-many relationships
    pgm.createTable('candidate_skills', {
        candidate_id: { type: 'uuid', notNull: true, references: 'candidates(id)', onDelete: 'CASCADE' },
        skill_name: { type: 'varchar(100)', notNull: true },
        primary: ['candidate_id', 'skill_name']
    });

    pgm.createTable('candidate_languages', {
        candidate_id: { type: 'uuid', notNull: true, references: 'candidates(id)', onDelete: 'CASCADE' },
        language_name: { type: 'varchar(100)', notNull: true },
        primary: ['candidate_id', 'language_name']
    });

    pgm.createTable('candidate_locations', {
        candidate_id: { type: 'uuid', notNull: true, references: 'candidates(id)', onDelete: 'CASCADE' },
        location_name: { type: 'varchar(255)', notNull: true },
        type: { type: 'location_type', notNull: true },
        primary: ['candidate_id', 'location_name', 'type']
    });

    pgm.createTable('candidate_certificates', {
        candidate_id: { type: 'uuid', notNull: true, references: 'candidates(id)', onDelete: 'CASCADE' },
        certificate_name: { type: 'text', notNull: true }
    });
     pgm.addConstraint('candidate_certificates', 'candidate_certificates_pkey', {
        primaryKey: ['candidate_id', 'certificate_name']
    });

    pgm.createTable('candidate_industries', {
        candidate_id: { type: 'uuid', notNull: true, references: 'candidates(id)', onDelete: 'CASCADE' },
        industry_name: { type: 'text', notNull: true }
    });
     pgm.addConstraint('candidate_industries', 'candidate_industries_pkey', {
        primaryKey: ['candidate_id', 'industry_name']
    });

    pgm.createTable('candidate_experience', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        candidate_id: { type: 'uuid', notNull: true, references: 'candidates(id)', onDelete: 'CASCADE' },
        company: { type: 'varchar(255)', notNull: true },
        role: { type: 'text', notNull: true },
        start_date: { type: 'varchar(50)' }, // Using varchar to accommodate fuzzy dates like 'Present'
        end_date: { type: 'varchar(50)' },
        duration: { type: 'varchar(100)' },
        description: { type: 'text' },
        tools_used: { type: 'text' }
    });
    pgm.createIndex('candidate_experience', 'candidate_id');

    pgm.createTable('candidate_education', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        candidate_id: { type: 'uuid', notNull: true, references: 'candidates(id)', onDelete: 'CASCADE' },
        institution: { type: 'varchar(255)', notNull: true },
        degree: { type: 'text', notNull: true },
        duration: { type: 'varchar(100)' }
    });
    pgm.createIndex('candidate_education', 'candidate_id');
    
     // 6. Create a simple key-value table for app settings
    pgm.createTable('app_settings', {
        key: { type: 'varchar(100)', primaryKey: true },
        value: { type: 'jsonb', notNull: true }
    });

};

exports.down = pgm => {
    // Drop tables in reverse order of creation due to foreign key constraints
    pgm.dropTable('app_settings');
    pgm.dropTable('candidate_education');
    pgm.dropTable('candidate_experience');
    pgm.dropTable('candidate_industries');
    pgm.dropTable('candidate_certificates');
    pgm.dropTable('candidate_locations');
    pgm.dropTable('candidate_languages');
    pgm.dropTable('candidate_skills');
    pgm.dropTable('candidates');
    pgm.dropTable('ai_providers');
    pgm.dropTable('users');
    
    // Drop ENUM types
    pgm.dropType('location_type');
    pgm.dropType('provider_name');
    pgm.dropType('user_role');
};
