const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route Imports
const projectRoutes = require('./routes/projects');
const expenseRoutes = require('./routes/expenses');
const supplierRoutes = require('./routes/suppliers');
const v1Routes = require('./routes/v1');
const db = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5173', 'http://127.0.0.1:5173'],
}));
app.use(express.json());

// API Routes
app.use('/api', v1Routes);
app.use('/api/projects', projectRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/v1', v1Routes);

// Health Check Route
app.get('/', (req, res) => {
    res.send('BuildTrack Management API is running...');
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
db.ensureCompatibilityColumns()
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch((error) => {
        console.error('Unable to initialize database compatibility columns:', error);
        process.exitCode = 1;
    });