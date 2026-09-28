const express = require('express');
const controller = require('../controllers/equipmentController');

const router = express.Router();

router.get('/', controller.getEquipment);
router.post('/', controller.createEquipment);
router.put('/:id', controller.updateEquipment);
router.delete('/:id', controller.deleteEquipment);
router.post('/allocate', controller.allocateEquipment);

module.exports = router;