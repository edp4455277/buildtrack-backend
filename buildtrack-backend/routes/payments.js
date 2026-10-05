const express = require('express');

const router = express.Router();
const controller = require('../controllers/paymentsController');

router.get('/', controller.getPayments);
router.get('/:id', controller.getPayment);
router.post('/', controller.createPayment);
router.put('/:id', controller.updatePayment);
router.delete('/:id', controller.deletePayment);

module.exports = router;