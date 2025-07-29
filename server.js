//---------------VARIABLES--------------//
const express = require('express');
const path = require('path');
const cors = require ('cors');

//--const userRoutes = require('./routes/userRoutes');--//

const despatchRoutes = require('./routes/despatchRoutes');

const app = express();
const port = process.env.PORT || 3000;


//-------------MIDDLEWARE--------------//

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

/*app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});*/
app.use('/api/despatch', despatchRoutes);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dak_despatch.html'));
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});












