const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.use('/projects', require('./projects'));
router.use('/expenses', require('./expenses'));
router.use('/suppliers', require('./suppliers'));
router.use('/equipment', require('./equipment'));
router.use('/equipments', require('./equipment'));
router.use('/clients', require('./clients'));
router.use('/contractors', require('./contractors'));
router.use('/employees', require('./employees'));
router.use('/reports', require('./reports'));
router.get('/dashboard/summary', dashboardController.getSummary);
router.get('/reports/budget', dashboardController.getBudgetReport);

module.exports = router;
