const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();
connectDB();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chercheurs', require('./routes/chercheurs'));
app.use('/api/projets', require('./routes/projets'));
app.use('/api/publications', require('./routes/publications'));
app.use('/api/stats', require('./routes/stats'));

app.listen(process.env.PORT, () =>
    console.log(`Serveur lancé sur le port ${process.env.PORT}`)
);