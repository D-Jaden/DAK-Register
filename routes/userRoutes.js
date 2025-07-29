//---------------------------------//
//----------LOGIN ROUTES----------//


//---------------VARIABLES--------------//
const express = require('express');
const router = express.Router();
const pool = require('/home/jaden-d-syiem/DAK Register /utils/db.js');

//-------------------------------PHONE NO VERIFICATION----------------------------//
router.post("/users/dak", async (req, res) => {
  const { phone_no } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE phone_no = $1', [phone_no]);
    
    if (result.rows.length > 0) {
      res.json({ success: true, message: 'Number verified' }); // Changed response
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;