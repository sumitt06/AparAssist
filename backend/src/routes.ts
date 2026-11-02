import { authenticateToken, AuthRequest } from './middleware';
import { Router } from 'express';
import { pool } from './db';

const router = Router();

router.use(authenticateToken);

// GET all students
router.get('/students', async (req: AuthRequest, res) => {
    try {
        let result;

        if (req.user?.role === 'AICTE_ADMIN') {
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

        if (req.user?.role === 'AICTE_ADMIN') {
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
        } else if (req.user?.role === 'AICTE_ADMIN') {
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

        if (req.user?.role === 'AICTE_ADMIN') {
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

        if (req.user?.role === 'AICTE_ADMIN') {
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
