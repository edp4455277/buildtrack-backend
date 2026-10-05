const express = require('express');

const router = express.Router();
const controller = require('../controllers/equipmentAllocationsController');

router.get('/', controller.getAllocations);
router.post('/', controller.createAllocation);
router.put('/:id', controller.updateAllocation);
router.delete('/:id', controller.deleteAllocation);

module.exports = router;