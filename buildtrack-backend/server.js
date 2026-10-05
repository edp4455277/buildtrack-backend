const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ROUTE IMPORTS

// Authentication
const authRoutes = require('./routes/auth');

// Existing routes
const projectRoutes = require('./routes/projects');
const expenseRoutes = require('./routes/expenses');
const supplierRoutes = require('./routes/suppliers');
const equipmentRoutes = require('./routes/equipment');
const reportRoutes = require('./routes/reports');
const employeeRoutes = require('./routes/employees');
const clientRoutes = require('./routes/clients');
const contractorRoutes = require('./routes/contractors');

// New routes
const materialRoutes = require('./routes/materials');
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const deliveryRoutes = require('./routes/deliveries');
const equipmentAllocationRoutes = require('./routes/equipmentAllocations');
const projectEmployeeRoutes = require('./routes/projectEmployees');
const paymentRoutes = require('./routes/payments');

// Middleware
const requireAuth = require('./middleware/auth');
const {
    notFoundHandler,
    errorHandler
} = require('./middleware/errorHandler');

// CREATE EXPRESS APP

const app = express();

// CORS

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5175',
        'http://127.0.0.1:5175'
    ],
    methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ],
    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ],
    credentials: true
}));

// BODY PARSER
app.use(express.json());

// BASIC SERVER HEALTH


// Public root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'BuildTrack Management API is running.',
        version: '1.0.0'
    });
});


// Public health-check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        server: 'online',
        database: process.env.DB_NAME || 'buildtrackdb',
        message: 'BuildTrack API is healthy.'
    });
});

// AUTHENTICATION ROUTES
app.use('/api/auth', authRoutes);

// API ROUTES
app.use('/api/clients', requireAuth, clientRoutes);
app.use('/api/contractors', requireAuth, contractorRoutes);
app.use('/api/employees', requireAuth, employeeRoutes);
app.use('/api/projects', requireAuth, projectRoutes);
app.use('/api/project-employees', requireAuth, projectEmployeeRoutes);
app.use('/api/suppliers', requireAuth, supplierRoutes);
app.use('/api/materials', requireAuth, materialRoutes);
app.use('/api/purchase-orders', requireAuth, purchaseOrderRoutes);
app.use('/api/deliveries', requireAuth, deliveryRoutes);
app.use('/api/equipment', requireAuth, equipmentRoutes);
app.use('/api/equipment-allocations', requireAuth, equipmentAllocationRoutes);
app.use('/api/expenses', requireAuth, expenseRoutes);
app.use('/api/payments', requireAuth, paymentRoutes);
app.use('/api/reports', requireAuth, reportRoutes);

// V1 ROUTES
const v1Routes = require('./routes/v1');

app.use('/api', requireAuth, v1Routes);
app.use('/api/v1', requireAuth, v1Routes);

// 404 HANDLDLER

app.use(notFoundHandler);

// GLOBAL ERROR HANDLER
app.use(errorHandler);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('       BUILDTRACK MANAGEMENT API      ');
    console.log(`Server running on port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Database: ${process.env.DB_NAME || 'buildtrackdb'}`);
});

