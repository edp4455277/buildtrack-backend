const express = require('express');

const router = express.Router();
const controller = require('../controllers/deliveriesController');

router.get('/', controller.getDeliveries);
router.get('/:id', controller.getDelivery);

router.post('/', controller.createDelivery);
router.delete('/:id', controller.deleteDelivery);

router.post('/:id/items', controller.addDeliveryItem);

module.exports = router;