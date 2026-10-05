const express = require('express');

const router = express.Router();
const controller = require('../controllers/projectEmployeesController');

router.get('/', controller.getProjectEmployees);

router.get(
    '/project/:projectId',
    controller.getEmployeesForProject
);

router.post(
    '/project/:projectId',
    controller.assignEmployee
);

router.put(
    '/:id',
    controller.updateAssignment
);

router.delete(
    '/:id',
    controller.removeEmployee
);

module.exports = router;