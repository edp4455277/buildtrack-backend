const express = require('express');

const router = express.Router();
const controller = require('../controllers/expensesController');

router.get('/', controller.getExpenses);
router.get('/project/:projectId', controller.getProjectExpenses);
router.get('/:id', controller.getExpense);

router.post('/', controller.createExpense);
router.put('/:id', controller.updateExpense);
router.delete('/:id', controller.deleteExpense);

module.exports = router;