import studentRoutes from './routes';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', studentRoutes);

const PORT = process.env.PORT || 5000;

// Test API
app.get('/', (req, res) => {
    res.json({
        message: 'AparAssist Backend is running!',
        status: 'Success'
    });
});

// Test PostgreSQL connection
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');

        res.json({
            message: 'PostgreSQL connected successfully!',
            databaseTime: result.rows[0].now
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            message: 'Database connection failed'
        });
    }
});

app.listen(PORT, () => {
    console.log(`AparAssist server running on port ${PORT}`);
});
