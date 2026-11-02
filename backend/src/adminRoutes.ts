import { Router } from 'express';
import { pool } from './db';
import {
    authenticateToken,
    authorizeRoles,
    AuthRequest
} from './middleware';

const router = Router();

// All routes require an authenticated AICTE Admin
router.use(authenticateToken);
router.use(authorizeRoles('AICTE_ADMIN'));

// GET all institutions
router.get('/institutions', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, institution_name, institution_code,
                    email, address, status, created_at
             FROM institutions
             ORDER BY created_at DESC`
        );

        return res.status(200).json({
            success: true,
            institutions: result.rows
        });

    } catch (error) {
        console.error('Error fetching institutions:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch institutions'
        });
    }
});

// APPROVE an institution
router.patch('/institutions/:id/approve', async (req: AuthRequest, res) => {
    try {
        const institutionId = Number(req.params.id);

        if (!Number.isInteger(institutionId) || institutionId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid institution ID'
            });
        }

        const result = await pool.query(
            `UPDATE institutions
             SET status = 'Approved'
             WHERE id = $1 AND status = 'Pending'
             RETURNING id, institution_name, status`,
            [institutionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pending institution not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Institution approved successfully',
            institution: result.rows[0]
        });

    } catch (error) {
        console.error('Institution approval error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to approve institution'
        });
    }
});

// REJECT an institution
router.patch('/institutions/:id/reject', async (req, res) => {
    try {
        const institutionId = Number(req.params.id);

        if (!Number.isInteger(institutionId) || institutionId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid institution ID'
            });
        }

        const result = await pool.query(
            `UPDATE institutions
             SET status = 'Rejected'
             WHERE id = $1 AND status = 'Pending'
             RETURNING id, institution_name, status`,
            [institutionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pending institution not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Institution rejected successfully',
            institution: result.rows[0]
        });

    } catch (error) {
        console.error('Institution rejection error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to reject institution'
        });
    }
});

// SUSPEND an approved institution
router.patch('/institutions/:id/suspend', async (req, res) => {
    try {
        const institutionId = Number(req.params.id);

        if (!Number.isInteger(institutionId) || institutionId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid institution ID'
            });
        }

        const result = await pool.query(
            `UPDATE institutions
             SET status = 'Suspended'
             WHERE id = $1 AND status = 'Approved'
             RETURNING id, institution_name, status`,
            [institutionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Approved institution not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Institution suspended successfully',
            institution: result.rows[0]
        });

    } catch (error) {
        console.error('Institution suspension error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to suspend institution'
        });
    }
});

export default router;