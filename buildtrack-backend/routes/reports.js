const express = require('express');

const router = express.Router();
const controller = require('../controllers/reportsController');

router.get('/dashboard', controller.getDashboard);
router.get('/project-summary', controller.getProjectSummary);
router.get('/low-stock', controller.getLowStock);
router.get('/equipment-status', controller.getEquipmentStatus);
router.get('/supplier-activity', controller.getSupplierActivity);
router.get('/employee-projects', controller.getEmployeeProjects);

module.exports = router;