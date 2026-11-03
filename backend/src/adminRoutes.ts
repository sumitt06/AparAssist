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
router.use(authorizeRoles('AICTE_ADMIN', 'AICTE_DEMO'));

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
// REACTIVATE a suspended institution
router.patch('/institutions/:id/reactivate', async (req: AuthRequest, res) => {
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
             WHERE id = $1 AND status = 'Suspended'
             RETURNING id, institution_name, status`,
            [institutionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Suspended institution not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Institution reactivated successfully',
            institution: result.rows[0]
        });

    } catch (error) {
        console.error('Institution reactivation error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to reactivate institution'
        });
    }
});
// GET APAAR Duplicate Monitoring
router.get('/duplicate-monitoring', async (req: AuthRequest, res) => {
    try {
        const result = await pool.query(`
            SELECT
                s.apaar_id,
                COUNT(*)::int AS duplicate_count,
                COUNT(DISTINCT s.institution_id)::int AS institution_count,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'student_id', s.id,
                        'student_name', s.student_name,
                        'programme', s.programme,
                        'academic_year', s.academic_year,
                        'institution_id', i.id,
                        'institution_name', i.institution_name,
                        'institution_code', i.institution_code
                    )
                    ORDER BY s.id
                ) AS student_records
            FROM students s
            LEFT JOIN institutions i
                ON s.institution_id = i.id
            WHERE s.apaar_id IS NOT NULL
              AND TRIM(s.apaar_id) <> ''
            GROUP BY s.apaar_id
            HAVING COUNT(*) > 1
            ORDER BY duplicate_count DESC
        `);

        return res.status(200).json({
            success: true,
            totalDuplicateGroups: result.rows.length,
            totalAffectedRecords: result.rows.reduce(
                (sum, row) => sum + row.duplicate_count,
                0
            ),
            duplicates: result.rows
        });

    } catch (error) {
        console.error('Duplicate monitoring error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch duplicate records'
        });
    }
});
router.get('/invalid-apaar-monitoring', async (req: AuthRequest, res) => {
    try {
        const result = await pool.query(`
            SELECT
                s.id AS student_id,
                s.student_name,
                s.apaar_id,
                s.programme,
                s.academic_year,
                s.institution_id,
                i.institution_name,
                i.institution_code,
                CASE
                    WHEN s.apaar_id IS NULL OR TRIM(s.apaar_id) = ''
                    THEN 'Missing'
                    ELSE 'Invalid'
                END AS issue_type
            FROM students s
            LEFT JOIN institutions i
                ON s.institution_id = i.id
            WHERE s.apaar_id IS NULL
               OR TRIM(s.apaar_id) = ''
               OR TRIM(s.apaar_id) !~ '^[0-9]{12}$'
            ORDER BY s.id DESC
        `);

        const missingCount = result.rows.filter(
            row => row.issue_type === 'Missing'
        ).length;

        const invalidCount = result.rows.filter(
            row => row.issue_type === 'Invalid'
        ).length;

        return res.status(200).json({
            success: true,
            totalIssues: result.rows.length,
            missingCount,
            invalidCount,
            records: result.rows
        });

    } catch (error) {
        console.error('Invalid APAAR monitoring error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch invalid APAAR records'
        });
    }
});
// GET AICTE Student Monitoring Statistics
router.get('/student-monitoring', async (req: AuthRequest, res) => {
    try {
        const [
            institutionStats,
            programmeStats,
            academicYearStats,
            categoryStats
        ] = await Promise.all([

            // Institution-wise student enrolment
            pool.query(`
                SELECT
                    i.id AS institution_id,
                    i.institution_name,
                    i.institution_code,
                    i.status AS institution_status,
                    COUNT(s.id)::int AS total_students
                FROM institutions i
                LEFT JOIN students s
                    ON i.id = s.institution_id
                GROUP BY i.id, i.institution_name,
                         i.institution_code, i.status
                ORDER BY total_students DESC
            `),

            // Programme-wise enrolment by institution
            pool.query(`
                SELECT
                    i.institution_name,
                    s.programme,
                    COUNT(s.id)::int AS total_students
                FROM students s
                LEFT JOIN institutions i
                    ON s.institution_id = i.id
                GROUP BY i.institution_name, s.programme
                ORDER BY total_students DESC
            `),

            // Academic-year-wise enrolment
            pool.query(`
                SELECT academic_year,
                       COUNT(*)::int AS total_students
                FROM students
                GROUP BY academic_year
                ORDER BY academic_year
            `),

            // Category-wise enrolment
            pool.query(`
                SELECT category,
                       COUNT(*)::int AS total_students
                FROM students
                GROUP BY category
                ORDER BY total_students DESC
            `)
        ]);

        return res.status(200).json({
            success: true,
            monitoring: {
                institutionStats: institutionStats.rows,
                programmeStats: programmeStats.rows,
                academicYearStats: academicYearStats.rows,
                categoryStats: categoryStats.rows
            }
        });

    } catch (error) {
        console.error('Student monitoring error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch student monitoring data'
        });
    }
});
// GET AICTE Dashboard Overview Statistics
router.get('/dashboard/overview', async (req: AuthRequest, res) => {
    try {
        const [
            institutionStats,
            studentStats,
            programmeStats,
            academicYearStats,
            categoryStats
        ] = await Promise.all([

            // Institution counts by status
            pool.query(`
                SELECT status, COUNT(*)::int AS total
                FROM institutions
                GROUP BY status
            `),

            // Total student records
            pool.query(`
                SELECT COUNT(*)::int AS total
                FROM students
            `),

            // Programme-wise enrolment
            pool.query(`
                SELECT programme, COUNT(*)::int AS total
                FROM students
                GROUP BY programme
                ORDER BY total DESC
            `),

            // Academic-year-wise enrolment
            pool.query(`
                SELECT academic_year, COUNT(*)::int AS total
                FROM students
                GROUP BY academic_year
                ORDER BY academic_year
            `),

            // Category-wise enrolment
            pool.query(`
                SELECT category, COUNT(*)::int AS total
                FROM students
                GROUP BY category
                ORDER BY total DESC
            `)
        ]);

        const institutions = {
            total: institutionStats.rows.reduce(
                (sum, row) => sum + row.total, 0
            ),
            approved: 0,
            pending: 0,
            rejected: 0,
            suspended: 0
        };

        institutionStats.rows.forEach((row) => {
            const status = row.status.toLowerCase();

            if (status in institutions && status !== 'total') {
                institutions[status as keyof typeof institutions] = row.total;
            }
        });

        return res.status(200).json({
            success: true,
            overview: {
                institutions,
                totalStudents: studentStats.rows[0].total,
                programmeStats: programmeStats.rows,
                academicYearStats: academicYearStats.rows,
                categoryStats: categoryStats.rows
            }
        });

    } catch (error) {
        console.error('Dashboard overview error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
});

export default router;