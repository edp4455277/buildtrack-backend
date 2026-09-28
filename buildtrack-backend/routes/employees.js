const express = require('express');
const controller = require('../controllers/employeesController');

const router = express.Router();

router.get('/', controller.getEmployees);
router.post('/', controller.createEmployee);
router.put('/:id', controller.updateEmployee);
router.delete('/:id', controller.deleteEmployee);

module.exports = router;