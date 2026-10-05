const express = require('express');

const router = express.Router();
const controller = require('../controllers/materialsController');

router.get('/', controller.getMaterials);

router.get('/low-stock', controller.getLowStockMaterials);

router.get('/:id', controller.getMaterial);

router.post('/', controller.createMaterial);

router.put('/:id', controller.updateMaterial);

router.delete('/:id', controller.deleteMaterial);

module.exports = router;

