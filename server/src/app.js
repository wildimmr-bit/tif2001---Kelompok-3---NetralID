const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/ingredients', require('./routes/ingredientRoutes'));

module.exports = app;