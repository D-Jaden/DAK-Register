//---------------VARIABLES--------------//

const { Pool } = require('pg');
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

//-------------MIDDLEWARE--------------//

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

//-------------------------------PHONE NO VERIFICATION----------------------------//
app.post("/users/login", async (req, res) => {
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

//---------------USER-----------------//

require('dotenv').config();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database:process.env.DB_DATABASE,
  password:process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

//--------------TESTING-------------//
(async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to the database successfully!');
    client.release(); 
  } catch (err) {
    console.error('Error connecting to the database:', err.stack);
  }
})();

pool.query(`SELECT*FROM users`,(err,res)=>{
    if(!err){
        console.log(res.rows);
    }
    else{
        console.log(err.message);
    }
});
