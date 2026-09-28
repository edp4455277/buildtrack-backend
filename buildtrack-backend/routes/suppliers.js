
const express = require('express');
const router = express.Router();
const controller = require('../controllers/suppliersController');

router.get('/', controller.getSuppliers);
router.post('/', controller.createSupplier);
router.put('/:id', controller.updateSupplier);
router.delete('/:id', controller.deleteSupplier);
router.post('/orders', controller.createPurchaseOrder);

module.exports = router;