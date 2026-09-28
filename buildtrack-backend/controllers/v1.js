const projects = require('./projectsController');
const clients = require('./clientsController');
const contractors = require('./contractorsController');
const employees = require('./employeesController');
const suppliers = require('./suppliersController');
const equipment = require('./equipmentController');
const expenses = require('./expensesController');
const dashboard = require('./dashboardController');
const reports = require('./reportsController');

module.exports = {
    listProjects: projects.getProjects,
    getProject: projects.getProject,
    createProject: projects.createProject,
    updateProject: projects.updateProject,
    deleteProject: projects.deleteProject,
    listClients: clients.getClients,
    createClient: clients.createClient,
    updateClient: clients.updateClient,
    deleteClient: clients.deleteClient,
    listContractors: contractors.getContractors,
    createContractor: contractors.createContractor,
    updateContractor: contractors.updateContractor,
    deleteContractor: contractors.deleteContractor,
    listEmployees: employees.getEmployees,
    createEmployee: employees.createEmployee,
    updateEmployee: employees.updateEmployee,
    deleteEmployee: employees.deleteEmployee,
    listSuppliers: suppliers.getSuppliers,
    createSupplier: suppliers.createSupplier,
    updateSupplier: suppliers.updateSupplier,
    deleteSupplier: suppliers.deleteSupplier,
    createPurchaseOrder: suppliers.createPurchaseOrder,
    listEquipment: equipment.getEquipment,
    createEquipment: equipment.createEquipment,
    updateEquipment: equipment.updateEquipment,
    deleteEquipment: equipment.deleteEquipment,
    allocateEquipment: equipment.allocateEquipment,
    listExpenses: expenses.getExpenses,
    createExpense: expenses.createExpense,
    updateExpense: expenses.updateExpense,
    deleteExpense: expenses.deleteExpense,
    dashboardSummary: dashboard.getSummary,
    budgetReport: dashboard.getBudgetReport,
    expenditureReport: reports.getExpenditureReport,
    supplierBalancesReport: reports.getSupplierBalances,
};