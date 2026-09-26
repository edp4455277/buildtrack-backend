const express = require('express');
const controller = require('../controllers/equipmentController');

const router = express.Router();

router.get('/', controller.getEquipment);
router.post('/allocate', controller.allocateEquipment);

module.exports = router;