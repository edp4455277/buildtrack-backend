const db = require('../config/db');
const { success, failure } = require('./dbHelpers');

async function getExpenditureReport(req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM vw_project_expenditure');
        return success(res, rows);
    } catch (error) {
        return failure(res, error);
    }
}

async function getSupplierBalances(req, res) {
    try {
        const [rows] = await db.query('SELECT * FROM vw_supplier_balance');
        return success(res, rows);
    } catch (error) {
        return failure(res, error);
    }
}

module.exports = { getExpenditureReport, getSupplierBalances };