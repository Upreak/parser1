/* eslint-disable camelcase */
const bcrypt = require('bcrypt');
require('dotenv').config();

const SALT_ROUNDS = 10;

exports.shorthands = undefined;

exports.up = async pgm => {
    // 1. Seed default admin user
    // The password here doesn't matter, as the login logic has a special bypass for this user.
    // We hash a placeholder for schema consistency.
    const adminPasswordHash = await bcrypt.hash('any-password-works', SALT_ROUNDS);
    pgm.sql(`
        INSERT INTO users (username, password_hash, role)
        VALUES ('admin@example.com', '${adminPasswordHash}', 'Admin');
    `);

    // 2. Set the initial active provider ID to null in settings
     pgm.sql(`
        INSERT INTO app_settings (key, value)
        VALUES ('activeProviderId', 'null');
    `);

    // 3. Seed default Google Gemini provider if API_KEY is present
    if (process.env.API_KEY) {
        // Use parameterized query to handle potential special characters in the API key
        await pgm.db.query(
            `INSERT INTO ai_providers (name, api_key, parsing_model, matching_model)
             VALUES ('Google Gemini', $1, 'gemini-2.5-flash', 'gemini-2.5-pro')
             RETURNING id;`,
            [process.env.API_KEY]
        ).then(async (result) => {
            if (result.rows.length > 0) {
                const newProviderId = result.rows[0].id;
                // Set this new provider as the active one
                await pgm.db.query(
                    `UPDATE app_settings SET value = $1 WHERE key = 'activeProviderId';`,
                    [JSON.stringify(newProviderId)]
                );
            }
        });
    }
};

exports.down = pgm => {
    pgm.sql(`DELETE FROM users WHERE username = 'admin@example.com';`);
    pgm.sql(`DELETE FROM ai_providers WHERE name = 'Google Gemini';`);
    pgm.sql(`DELETE FROM app_settings WHERE key = 'activeProviderId';`);
};
