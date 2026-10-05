const express = require('express');

const router = express.Router();
const controller = require('../controllers/contractorsController');

router.get('/', controller.getContractors);
router.get('/:id', controller.getContractor);
router.post('/', controller.createContractor);
router.put('/:id', controller.updateContractor);
router.delete('/:id', controller.deleteContractor);

module.exports = router;