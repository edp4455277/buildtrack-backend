const express = require('express');
const router = express.Router();
const controller = require('../controllers/projectsController');

router.get('/', controller.getProjects);
router.get('/:id', controller.getProject);
router.post('/', controller.createProject);
router.put('/:id', controller.updateProject);

module.exports = router;