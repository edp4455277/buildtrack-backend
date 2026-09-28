const express = require('express');
const controller = require('../controllers/contractorsController');

const router = express.Router();

router.get('/', controller.getContractors);
router.post('/', controller.createContractor);
router.put('/:id', controller.updateContractor);
router.delete('/:id', controller.deleteContractor);

module.exports = router;