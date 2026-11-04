import { authenticateToken, AuthRequest } from './middleware';
import { Router } from 'express';
import { pool } from './db';

const router = Router();

router.use(authenticateToken);

// GET all students
router.get('/students', async (req: AuthRequest, res) => {
    try {
        let result;

        if ((req.user?.role === 'AICTE_ADMIN' || req.user?.role === 'AICTE_DEMO')) {
            result = await pool.query(
                'SELECT * FROM students ORDER BY id DESC'
            );
        } else {
            result = await pool.query(
                'SELECT * FROM students WHERE institution_id = $1 ORDER BY id DESC',
                [req.user?.institution_id]
            );
        }

        res.status(200).json({
            success: true,
            count: result.rows.length,
            students: result.rows
        });

    } catch (error) {
        console.error('Error fetching students:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch student records'
        });
    }
});
// GET duplicate APAAR IDs within the authenticated institution
router.get('/students/duplicates', async (req: AuthRequest, res) => {
    if (req.user?.role !== 'INSTITUTION_ADMIN' || !req.user.institution_id) {
        return res.status(403).json({
            success: false,
            message: 'Institution access is required'
        });
    }

    try {
        const result = await pool.query(`
            SELECT
                s.apaar_id,
                COUNT(*)::int AS duplicate_count,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'student_id', s.id,
                        'student_name', s.student_name,
                        'programme', s.programme,
                        'academic_year', s.academic_year
                    ) ORDER BY s.id
                ) AS student_records
            FROM students s
            WHERE s.institution_id = $1
              AND s.apaar_id IS NOT NULL
              AND TRIM(s.apaar_id) <> ''
            GROUP BY s.apaar_id
            HAVING COUNT(*) > 1
            ORDER BY duplicate_count DESC, s.apaar_id
        `, [req.user.institution_id]);

        const duplicates = result.rows.map((row) => ({
            ...row,
            apaar_id: `${'•'.repeat(Math.max(row.apaar_id.length - 4, 0))}${row.apaar_id.slice(-4)}`
        }));

        return res.status(200).json({
            success: true,
            totalDuplicateGroups: duplicates.length,
            totalAffectedRecords: duplicates.reduce(
                (sum, row) => sum + row.duplicate_count,
                0
            ),
            duplicates
        });
    } catch (error) {
        console.error('Institution duplicate review error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch duplicate records'
        });
    }
});
// Intake data and all imported limits are scoped to the authenticated institution.
router.get('/intake-monitoring', async (req: AuthRequest, res) => {
    if (req.user?.role !== 'INSTITUTION_ADMIN' || !req.user.institution_id) {
        return res.status(403).json({ success: false, message: 'Institution access is required' });
    }

    const academicYear = typeof req.query.academic_year === 'string' ? req.query.academic_year : null;
    const category = typeof req.query.category === 'string' ? req.query.category : null;

    try {
        const [programmeStats, academicYears, categories] = await Promise.all([
            pool.query(`
                WITH enrolled AS (
                    SELECT programme, academic_year, category, COUNT(*)::int AS enrolled_count
                    FROM students
                    WHERE institution_id = $1
                      AND ($2::text IS NULL OR academic_year = $2)
                      AND ($3::text IS NULL OR category = $3)
                    GROUP BY programme, academic_year, category
                ), approved AS (
                    SELECT programme, academic_year, category, approved_intake
                    FROM approved_intakes
                    WHERE institution_id = $1
                      AND ($2::text IS NULL OR academic_year = $2)
                      AND ($3::text IS NULL OR category = $3)
                )
                SELECT
                    COALESCE(e.programme, a.programme) AS programme,
                    COALESCE(e.academic_year, a.academic_year) AS academic_year,
                    COALESCE(e.category, a.category) AS category,
                    a.approved_intake,
                    COALESCE(e.enrolled_count, 0)::int AS enrolled_count
                FROM enrolled e
                FULL OUTER JOIN approved a
                    ON LOWER(BTRIM(e.programme)) = LOWER(BTRIM(a.programme))
                   AND e.academic_year = a.academic_year
                   AND LOWER(BTRIM(e.category)) = LOWER(BTRIM(a.category))
                ORDER BY programme, academic_year, category
            `, [req.user.institution_id, academicYear, category]),
            pool.query(`
                SELECT academic_year FROM (
                    SELECT academic_year FROM students WHERE institution_id = $1
                    UNION
                    SELECT academic_year FROM approved_intakes WHERE institution_id = $1
                ) years ORDER BY academic_year
            `, [req.user.institution_id]),
            pool.query(`
                SELECT category FROM (
                    SELECT category FROM students WHERE institution_id = $1
                    UNION
                    SELECT category FROM approved_intakes WHERE institution_id = $1
                ) categories ORDER BY category
            `, [req.user.institution_id])
        ]);

        const rows = programmeStats.rows.map((row) => {
            const approvedSeats = row.approved_intake === null ? null : Number(row.approved_intake);
            const enrolledCount = Number(row.enrolled_count);
            return {
                ...row,
                approved_intake: approvedSeats,
                enrolled_count: enrolledCount,
                vacant_seats: approvedSeats === null ? null : Math.max(approvedSeats - enrolledCount, 0),
                utilization_percentage: approvedSeats === null || approvedSeats === 0
                    ? null
                    : Math.round((enrolledCount / approvedSeats) * 1000) / 10
            };
        });
        const totalApprovedSeats = rows.reduce((sum, row) => sum + (row.approved_intake ?? 0), 0);
        const totalEnrolledStudents = rows.reduce((sum, row) => sum + row.enrolled_count, 0);

        return res.status(200).json({
            success: true,
            summary: {
                totalApprovedSeats,
                totalEnrolledStudents,
                vacantSeats: rows.reduce((sum, row) => sum + (row.vacant_seats ?? 0), 0),
                utilizationPercentage: totalApprovedSeats === 0
                    ? null
                    : Math.round((totalEnrolledStudents / totalApprovedSeats) * 1000) / 10
            },
            academicYears: academicYears.rows.map((row) => row.academic_year),
            categories: categories.rows.map((row) => row.category),
            programmes: rows
        });
    } catch (error) {
        console.error('Intake monitoring error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load intake monitoring data' });
    }
});

router.post('/intake-monitoring/approved-intake', async (req: AuthRequest, res) => {
    if (req.user?.role !== 'INSTITUTION_ADMIN' || !req.user.institution_id) {
        return res.status(403).json({ success: false, message: 'Institution access is required' });
    }

    const rows: unknown = req.body?.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 5000) {
        return res.status(400).json({ success: false, message: 'Provide between 1 and 5,000 approved intake rows' });
    }

    const seen = new Set<string>();
    for (const [index, row] of rows.entries()) {
        if (
            !row || typeof row !== 'object' ||
            typeof row.programme !== 'string' || !row.programme.trim() ||
            typeof row.academic_year !== 'string' || !row.academic_year.trim() ||
            typeof row.category !== 'string' || !row.category.trim() ||
            !Number.isInteger(row.approved_intake) || row.approved_intake < 0
        ) {
            return res.status(400).json({
                success: false,
                message: `Row ${index + 1} must include programme, academic_year, category, and a non-negative whole-number approved_intake`
            });
        }

        const key = [row.programme, row.academic_year, row.category].map((value: string) => value.trim().toLocaleLowerCase()).join('|');
        if (seen.has(key)) {
            return res.status(400).json({ success: false, message: `Duplicate programme/year/category combination at row ${index + 1}` });
        }
        seen.add(key);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const row of rows) {
            await client.query(`
                INSERT INTO approved_intakes
                    (institution_id, programme, academic_year, category, approved_intake)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (institution_id, programme_key, academic_year, category_key)
                DO UPDATE SET approved_intake = EXCLUDED.approved_intake, updated_at = NOW()
            `, [
                req.user.institution_id,
                row.programme.trim(),
                row.academic_year.trim(),
                row.category.trim(),
                row.approved_intake
            ]);
        }
        await client.query('COMMIT');
        return res.status(200).json({ success: true, importedCount: rows.length });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Approved intake import error:', error);
        return res.status(500).json({ success: false, message: 'Failed to import approved intake rows' });
    } finally {
        client.release();
    }
});
router.post('/students/check', async (req: AuthRequest, res) => {
    try {
        const { apaar_ids } = req.body;

        if (!Array.isArray(apaar_ids)) {
            return res.status(400).json({
                success: false,
                message: 'APAAR IDs must be provided as an array'
            });
        }

        let result;

        if ((req.user?.role === 'AICTE_ADMIN' || req.user?.role === 'AICTE_DEMO')) {
            result = await pool.query(
                'SELECT apaar_id FROM students WHERE apaar_id = ANY($1)',
                [apaar_ids]
            );
        } else {
            result = await pool.query(
                `SELECT apaar_id FROM students
                 WHERE apaar_id = ANY($1) AND institution_id = $2`,
                [apaar_ids, req.user?.institution_id]
            );
        }

        return res.status(200).json({
            success: true,
            existingIds: result.rows.map(row => row.apaar_id)
        });

    } catch (error) {
        console.error('Error checking APAAR IDs:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to check existing APAAR IDs'
        });
    }
});
// POST a new student
router.post('/students', async (req: AuthRequest, res) => {
    try {
        const {
            student_name,
            apaar_id,
            programme,
            academic_year,
            category
        } = req.body;

        if (
            !student_name ||
            !apaar_id ||
            !programme ||
            !academic_year ||
            !category
        ) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!/^\d{12}$/.test(apaar_id)) {
            return res.status(400).json({
                success: false,
                message: 'APAAR ID must contain exactly 12 digits'
            });
        }

        let institutionId: number;

        if (req.user?.role === 'INSTITUTION_ADMIN') {
            if (!req.user.institution_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Institution not linked to this account'
                });
            }

            institutionId = req.user.institution_id;
        } else if ((req.user?.role === 'AICTE_ADMIN' || req.user?.role === 'AICTE_DEMO')) {
            if (!req.body.institution_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Institution ID is required'
                });
            }

            institutionId = Number(req.body.institution_id);

            if (!Number.isInteger(institutionId) || institutionId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid institution ID'
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const result = await pool.query(
            `INSERT INTO students
            (student_name, apaar_id, programme, academic_year, category, institution_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                student_name,
                apaar_id,
                programme,
                academic_year,
                category,
                institutionId
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Student added successfully',
            student: result.rows[0]
        });

    } catch (error: any) {
        console.error('Error adding student:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'APAAR ID already exists'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to add student'
        });
    }
});
// PUT: Update an existing student
router.put('/students/:id', async (req: AuthRequest, res) => {
    try {
        const studentId = Number(req.params.id);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID'
            });
        }

        const {
            student_name,
            apaar_id,
            programme,
            academic_year,
            category
        } = req.body;

        if (
            !student_name ||
            !apaar_id ||
            !programme ||
            !academic_year ||
            !category
        ) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!/^\d{12}$/.test(apaar_id)) {
            return res.status(400).json({
                success: false,
                message: 'APAAR ID must contain exactly 12 digits'
            });
        }

        let result;

        if ((req.user?.role === 'AICTE_ADMIN' || req.user?.role === 'AICTE_DEMO')) {
            result = await pool.query(
                `UPDATE students
                 SET student_name = $1,
                     apaar_id = $2,
                     programme = $3,
                     academic_year = $4,
                     category = $5
                 WHERE id = $6
                 RETURNING *`,
                [
                    student_name,
                    apaar_id,
                    programme,
                    academic_year,
                    category,
                    studentId
                ]
            );
        } else {
            result = await pool.query(
                `UPDATE students
                 SET student_name = $1,
                     apaar_id = $2,
                     programme = $3,
                     academic_year = $4,
                     category = $5
                 WHERE id = $6 AND institution_id = $7
                 RETURNING *`,
                [
                    student_name,
                    apaar_id,
                    programme,
                    academic_year,
                    category,
                    studentId,
                    req.user?.institution_id
                ]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or access denied'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            student: result.rows[0]
        });

    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'APAAR ID already exists'
            });
        }

        console.error('Error updating student:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update student'
        });
    }
});
// DELETE: Remove a student
router.delete('/students/:id', async (req: AuthRequest, res) => {
    try {
        const studentId = Number(req.params.id);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid student ID'
            });
        }

        let result;

        if ((req.user?.role === 'AICTE_ADMIN' || req.user?.role === 'AICTE_DEMO')) {
            result = await pool.query(
                'DELETE FROM students WHERE id = $1 RETURNING id',
                [studentId]
            );
        } else {
            result = await pool.query(
                `DELETE FROM students
                 WHERE id = $1 AND institution_id = $2
                 RETURNING id`,
                [studentId, req.user?.institution_id]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or access denied'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Student deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting student:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete student'
        });
    }
});
export default router;
