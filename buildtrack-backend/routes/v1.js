const express = require('express');
const controller = require('../controllers/v1');
const clientsController = require('../controllers/clientsController');
const contractorsController = require('../controllers/contractorsController');

const router = express.Router();
const projects = express.Router();
const expenses = express.Router();
const suppliers = express.Router();
const equipment = express.Router();
const clients = express.Router();
const contractors = express.Router();
const dashboard = express.Router();
const reports = express.Router();

projects.get('/', controller.listProjects);
projects.post('/', controller.createProject);
projects.get('/:id', controller.getProject);
projects.put('/:id', controller.updateProject);
projects.delete('/:id', controller.deleteProject);

expenses.get('/', controller.listExpenses);
expenses.post('/', controller.createExpense);
expenses.put('/:id', controller.updateExpense);
expenses.delete('/:id', controller.deleteExpense);

suppliers.get('/', controller.listSuppliers);
suppliers.post('/', controller.createSupplier);
suppliers.put('/:id', controller.updateSupplier);
suppliers.delete('/:id', controller.deleteSupplier);

equipment.get('/', controller.listEquipment);
equipment.post('/', controller.createEquipment);
equipment.put('/:id', controller.updateEquipment);
equipment.delete('/:id', controller.deleteEquipment);

clients.get('/', clientsController.getClients);
clients.post('/', controller.createClient);
clients.put('/:id', controller.updateClient);
clients.delete('/:id', controller.deleteClient);

contractors.get('/', contractorsController.getContractors);
contractors.post('/', controller.createContractor);
contractors.put('/:id', controller.updateContractor);
contractors.delete('/:id', controller.deleteContractor);

dashboard.get('/summary', controller.dashboardSummary);
reports.get('/budget', controller.budgetReport);

router.use('/projects', projects);
router.use('/expenses', expenses);
router.use('/suppliers', suppliers);
router.use('/equipment', equipment);
router.use('/equipments', equipment);
router.use('/clients', clients);
router.use('/contractors', contractors);
router.use('/dashboard', dashboard);
router.use('/reports', reports);

module.exports = router;
