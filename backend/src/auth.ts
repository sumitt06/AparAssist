import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in environment variables');
}

// Institution registration
router.post('/register', async (req, res) => {
    try {
        const {
            full_name,
            institution_name,
            institution_code,
            email,
            password,
            address
        } = req.body;

        if (
            !full_name ||
            !institution_name ||
            !institution_code ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        const existingUser = await pool.query(
            'SELECT id FROM admin_users WHERE email = $1',
            [email]
        );

        const existingInstitution = await pool.query(
            `SELECT id FROM institutions
             WHERE email = $1 OR institution_code = $2`,
            [email, institution_code]
        );

        if (existingUser.rows.length > 0 ||
            existingInstitution.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email or institution code already registered'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const institutionResult = await client.query(
                `INSERT INTO institutions
                (institution_name, institution_code, email, address)
                VALUES ($1, $2, $3, $4)
                RETURNING id`,
                [institution_name, institution_code, email, address || null]
            );

            const institutionId = institutionResult.rows[0].id;

            await client.query(
                `INSERT INTO admin_users
                (full_name, email, password_hash, role, institution_id)
                VALUES ($1, $2, $3, 'INSTITUTION_ADMIN', $4)`,
                [full_name, email, passwordHash, institutionId]
            );

            await client.query('COMMIT');

            return res.status(201).json({
                success: true,
                message: 'Registration submitted. Awaiting AICTE approval.'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Registration error:', error);

        return res.status(500).json({
            success: false,
            message: 'Institution registration failed'
        });
    }
});
// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const result = await pool.query(
            `SELECT
                a.id,
                a.full_name,
                a.email,
                a.password_hash,
                a.role,
                a.institution_id,
                a.is_active,
                i.status AS institution_status
             FROM admin_users a
             LEFT JOIN institutions i
                ON a.institution_id = i.id
             WHERE a.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive'
            });
        }

        if (
            user.role === 'INSTITUTION_ADMIN' &&
            user.institution_status !== 'Approved'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Your institution is awaiting AICTE approval'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                institution_id: user.institution_id
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                institution_id: user.institution_id
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

export default router;