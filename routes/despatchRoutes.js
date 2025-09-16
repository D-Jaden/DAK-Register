//===============================
//DESPATCH ROUTES
//===============================

//================
//VARIABLES
//================

require('@dotenvx/dotenvx').config();
const session = require('express-session');
const express = require('express');
const router = express.Router();
const pool = require('../utils/db.js'); //change to (./utils/db.js) if error occurs)

const JWT = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        JWT.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: 'Invalid token' });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'No token provided' });
    }
}

//FORMATTING DATE FOR POSTGRES
function formatDateForPostgres(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
        throw new Error(`Invalid date format: ${dateStr}. Expected dd/mm/yyyy.`);
    }
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
}

// Save despatch data to database
router.post('/save', authenticateJWT, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { data } = req.body;
    
        const userId = req.user ? req.user.user_id : null;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: Please log in first'
            });
        }

        // Validate input
        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid data provided'
            });
        }
        
        console.log(`📝 User ${userId} attempting to save ${data.length} rows`);
        
        await client.query('BEGIN');
        
        //=======================
        // INSERT DATA
        //=======================
        
        let savedCount = 0;
        for (const row of data) {
            const query = `
                INSERT INTO public.despatch (
                    serial_no, 
                    date, 
                    eng_to_whom_sent, 
                    hi_to_whom_sent, 
                    eng_place, 
                    hi_place, 
                    eng_subject, 
                    hi_subject, 
                    eng_sent_by, 
                    hi_sent_by,
                    user_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;
            const pgDate = formatDateForPostgres(row.date);
            const values = [
                row.serialNo || null,
                pgDate,
                row.toWhom || null,
                row.toWhomHindi || null,
                row.place || null,
                row.placeHindi || null,
                row.subject || null,
                row.subjectHindi || null,
                row.sentBy || null,
                row.sentByHindi || null,
                userId // Fixed: was 'userid' before
            ];
            
            await client.query(query, values);
            savedCount++;
        }
        
        await client.query('COMMIT');
        console.log(`✅ User ${userId} successfully saved ${savedCount} rows`);
        
        res.json({
            success: true,
            message: `Successfully saved ${savedCount} rows`,
            rowsSaved: savedCount
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Database save error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error: ' + error.message
        });
    } finally {
        client.release();
    }
});

//======================================
// Load DESPATCH DATA FROM DATABASE
//======================================

router.get('/load', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await pool.query(
            'SELECT * FROM public.despatch WHERE user_id = $1 ORDER BY serial_no',
            [userId]
        );
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('❌ Database load error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error: ' + error.message
        });
    }
});

module.exports = router;
