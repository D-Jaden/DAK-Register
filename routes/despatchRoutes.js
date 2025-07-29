// routes/despatchRoutes.js - Database Routes for Despatch Operations

const express = require('express');
const router = express.Router();
const pool = require('/home/jaden-d-syiem/DAK Register /utils/db.js'); 

// Save despatch data to database
router.post('/save', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { data } = req.body;
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid data provided'
            });
        }
        
        await client.query('BEGIN');
        
        // Clear existing data (remove this line if you want to append instead of replace)
        await client.query('DELETE FROM public.despatch');
        
        // Insert new data
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
                    hi_sent_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;
            
            const values = [
                row.serialNo || null,
                row.date || null,
                row.toWhom || null,
                row.toWhomHindi || null,
                row.place || null,
                row.placeHindi || null,
                row.subject || null,
                row.subjectHindi || null,
                row.sentBy || null,
                row.sentByHindi || null
            ];
            
            await client.query(query, values);
        }
        
        await client.query('COMMIT');
        
        console.log(`✅ Successfully saved ${data.length} rows to database`);
        
        res.json({
            success: true,
            message: `Successfully saved ${data.length} rows`,
            rowsSaved: data.length
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

// Load despatch data from database
router.get('/load', async (req, res) => {
    try {
        const query = `
            SELECT 
                serial_no,
                date,
                eng_to_whom_sent,
                hi_to_whom_sent,
                eng_place,
                hi_place,
                eng_subject,
                hi_subject,
                eng_sent_by,
                hi_sent_by
            FROM public.despatch 
            ORDER BY serial_no ASC
        `;
        
        const result = await pool.query(query);
        
        console.log(`✅ Loaded ${result.rows.length} rows from database`);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
        
    } catch (error) {
        console.error('❌ Database load error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error: ' + error.message
        });
    }
});

// Delete specific row by serial number
router.delete('/delete/:serialNo', async (req, res) => {
    try {
        const { serialNo } = req.params;
        
        const query = 'DELETE FROM public.despatch WHERE serial_no = $1';
        const result = await pool.query(query, [serialNo]);
        
        if (result.rowCount > 0) {
            console.log(`✅ Deleted row with serial number ${serialNo}`);
            res.json({
                success: true,
                message: `Deleted row with serial number ${serialNo}`
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Row not found'
            });
        }
        
    } catch (error) {
        console.error('❌ Database delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Database error: ' + error.message
        });
    }
});

module.exports = router;