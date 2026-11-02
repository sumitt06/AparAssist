
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './db';

dotenv.config();

async function createDemoInstitution() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const institutionEmail = 'institution.demo@aparassist.com';
        const institutionCode = 'DEMO-APAR-001';
        const adminEmail = 'institution.demo@aparassist.com';
        const demoPassword = process.env.DEMO_INSTITUTION_PASSWORD;

        if (!demoPassword) {
            throw new Error('DEMO_INSTITUTION_PASSWORD is not set.');
        }

        // Do not overwrite an existing account.
        const existingAdmin = await client.query(
            'SELECT id FROM admin_users WHERE email = $1',
            [adminEmail]
        );

        if (existingAdmin.rows.length > 0) {
            throw new Error('Demo admin already exists. No changes made.');
        }

        const existingInstitution = await client.query(
            `SELECT id FROM institutions
             WHERE email = $1 OR institution_code = $2`,
            [institutionEmail, institutionCode]
        );

        if (existingInstitution.rows.length > 0) {
            throw new Error('Demo institution already exists. No changes made.');
        }

        const institutionResult = await client.query(
            `INSERT INTO institutions
             (institution_name, institution_code, email, address, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [
                'AparAssist Demo Institution (Prototype)',
                institutionCode,
                institutionEmail,
                'Prototype demo record - not an official AICTE institution',
                'Approved'
            ]
        );

        const institutionId = institutionResult.rows[0].id;
        const passwordHash = await bcrypt.hash(demoPassword, 12);

        await client.query(
            `INSERT INTO admin_users
             (full_name, email, password_hash, role, institution_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                'Demo Institution Admin',
                adminEmail,
                passwordHash,
                'INSTITUTION_ADMIN',
                institutionId
            ]
        );

        await client.query('COMMIT');

        console.log('Demo institution and admin created successfully.');
        console.log('Institution ID:', institutionId);
        console.log('Demo email:', adminEmail);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Demo account creation failed:', error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

createDemoInstitution();
