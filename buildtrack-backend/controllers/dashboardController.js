const db = require('../config/db');
const { success, failure } = require('./dbHelpers');

async function getSummary(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                COALESCE(SUM(Project_Budget), 0) AS totalAllocatedBudget,
                (SELECT COALESCE(SUM(Amount), 0) FROM Project_Expenses) AS totalExpenditure,
                COALESCE(SUM(Project_Status = 'Active'), 0) AS activeProjectsCount
            FROM Projects
        `);
        return success(res, rows[0]);
    } catch (error) {
        return failure(res, error);
    }
}

async function getBudgetReport(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT Project_ID AS project_id, Project_Name AS project_name,
                   Project_Budget AS allocated_budget,
                   TotalExpenditure AS total_expenditure,
                   RemainingExpenditure AS variance
            FROM vw_project_expenditure
            ORDER BY Project_ID
        `);
        return success(res, rows);
    } catch (error) {
        return failure(res, error);
    }
}

module.exports = { getSummary, getBudgetReport };