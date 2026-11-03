import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './db';

dotenv.config();

async function createAicteDemo() {
    try {
        const {
            AICTE_DEMO_NAME,
            AICTE_DEMO_EMAIL,
            AICTE_DEMO_PASSWORD
        } = process.env;

        if (!AICTE_DEMO_NAME || !AICTE_DEMO_EMAIL || !AICTE_DEMO_PASSWORD) {
            throw new Error('AICTE Demo environment variables are missing');
        }

        if (AICTE_DEMO_PASSWORD.length < 12) {
            throw new Error('Demo password must be at least 12 characters');
        }

        const existing = await pool.query(
            'SELECT id FROM admin_users WHERE email = $1',
            [AICTE_DEMO_EMAIL]
        );

        if (existing.rows.length > 0) {
            console.log('An account with this email already exists. Setup stopped.');
            return;
        }

        const passwordHash = await bcrypt.hash(AICTE_DEMO_PASSWORD, 12);

        await pool.query(
            `INSERT INTO admin_users
            (full_name, email, password_hash, role, institution_id, is_active)
            VALUES ($1, $2, $3, 'AICTE_DEMO', NULL, TRUE)`,
            [AICTE_DEMO_NAME, AICTE_DEMO_EMAIL, passwordHash]
        );

        console.log('AICTE Demo account created successfully.');

    } catch (error) {
        console.error('AICTE Demo setup failed:', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

createAicteDemo();