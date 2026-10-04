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
const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/auth');
const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5173', 'http://127.0.0.1:5173'],
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', requireAuth, projectRoutes);
app.use('/api/expenses', requireAuth, expenseRoutes);
app.use('/api/suppliers', requireAuth, supplierRoutes);
app.use('/api/equipment', requireAuth, equipmentRoutes);
app.use('/api/reports', requireAuth, reportRoutes);
app.use('/api/employees', requireAuth, employeeRoutes);
app.use('/api/clients', requireAuth, clientRoutes);
app.use('/api/contractors', requireAuth, contractorRoutes);
app.use('/api', requireAuth, v1Routes);
app.use('/api/v1', requireAuth, v1Routes);

// Health Check Route
app.get('/', (req, res) => {
    res.send('BuildTrack Management API is running...');
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
