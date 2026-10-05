const express = require('express');

const router = express.Router();
const controller = require('../controllers/purchaseOrdersController');

router.get('/', controller.getPurchaseOrders);
router.get('/:id', controller.getPurchaseOrder);

router.post('/', controller.createPurchaseOrder);
router.put('/:id', controller.updatePurchaseOrder);
router.delete('/:id', controller.deletePurchaseOrder);

router.post('/:id/items', controller.addPurchaseOrderItem);
router.delete('/:id/items/:itemId', controller.deletePurchaseOrderItem);

module.exports = router;