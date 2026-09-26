const express = require('express');
const controller = require('../controllers/reportsController');

const router = express.Router();

router.get('/expenditure', controller.getExpenditureReport);
router.get('/supplier-balances', controller.getSupplierBalances);

module.exports = router;