const express = require('express');
const router = express.Router();
const controller = require('../controllers/expensesController');

router.get('/', controller.getExpenses);
router.post('/', controller.createExpense);

module.exports = router;