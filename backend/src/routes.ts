
import { Router } from 'express';
import { pool } from './db';

const router = Router();

// GET all students
router.get('/students', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM students ORDER BY id DESC'
        );

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
// POST: Check APAAR IDs against existing database records
router.post('/students/check', async (req, res) => {
    try {
        const { apaar_ids } = req.body;

        if (!Array.isArray(apaar_ids)) {
            return res.status(400).json({
                success: false,
                message: 'APAAR IDs must be provided as an array'
            });
        }

        const result = await pool.query(
            'SELECT apaar_id FROM students WHERE apaar_id = ANY($1)',
            [apaar_ids]
        );

        res.status(200).json({
            success: true,
            existingIds: result.rows.map(row => row.apaar_id)
        });

    } catch (error) {
        console.error('Error checking APAAR IDs:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to check existing APAAR IDs'
        });
    }
});
// POST a new student
router.post('/students', async (req, res) => {
    try {
        const {
            student_name,
            apaar_id,
            programme,
            academic_year,
            category
        } = req.body;

        // Check required fields
        if (!student_name || !apaar_id || !programme ||
            !academic_year || !category) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate APAAR ID
        if (!/^\d{12}$/.test(apaar_id)) {
            return res.status(400).json({
                success: false,
                message: 'APAAR ID must contain exactly 12 digits'
            });
        }

        // Insert student into PostgreSQL
        const result = await pool.query(
            `INSERT INTO students
            (student_name, apaar_id, programme, academic_year, category)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [student_name, apaar_id, programme, academic_year, category]
        );

        res.status(201).json({
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

        res.status(500).json({
            success: false,
            message: 'Failed to add student'
        });
    }
});
export default router;
