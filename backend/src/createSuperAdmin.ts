import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './db';

dotenv.config();

async function createSuperAdmin() {
    try {
        const { SUPERADMIN_NAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;

        if (!SUPERADMIN_NAME || !SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
            throw new Error('Super Admin environment variables are missing');
        }

        if (SUPERADMIN_PASSWORD.length < 12) {
            throw new Error('Super Admin password must be at least 12 characters');
        }

        const existing = await pool.query(
            `SELECT id FROM admin_users WHERE role = 'AICTE_ADMIN'`
        );

        if (existing.rows.length > 0) {
            console.log('An AICTE Admin account already exists. Setup stopped.');
            return;
        }

        const emailCheck = await pool.query(
            'SELECT id FROM admin_users WHERE email = $1',
            [SUPERADMIN_EMAIL]
        );

        if (emailCheck.rows.length > 0) {
            throw new Error('This email is already registered');
        }

        const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);

        await pool.query(
            `INSERT INTO admin_users
            (full_name, email, password_hash, role, institution_id)
            VALUES ($1, $2, $3, 'AICTE_ADMIN', NULL)`,
            [SUPERADMIN_NAME, SUPERADMIN_EMAIL, passwordHash]
        );

        console.log('AICTE Super Admin created successfully.');

    } catch (error) {
        console.error('Super Admin setup failed:', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

createSuperAdmin();