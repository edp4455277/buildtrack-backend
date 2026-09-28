const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route Imports
const projectRoutes = require('./routes/projects');
const expenseRoutes = require('./routes/expenses');
const supplierRoutes = require('./routes/suppliers');
const equipmentRoutes = require('./routes/equipment');
const reportRoutes = require('./routes/reports');
const employeeRoutes = require('./routes/employees');
const clientRoutes = require('./routes/clients');
const contractorRoutes = require('./routes/contractors');
const v1Routes = require('./routes/v1');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5173', 'http://127.0.0.1:5173'],
}));
app.use(express.json());

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api', v1Routes);
app.use('/api/v1', v1Routes);

// Health Check Route
app.get('/', (req, res) => {
    res.send('BuildTrack Management API is running...');
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));