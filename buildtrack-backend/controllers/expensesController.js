const db = require('../config/db');
const { nextId, releaseIdLocks, value, success, failure } = require('./dbHelpers');

async function getExpenses(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT e.Expense_ID, e.Project_ID, p.Project_Name, e.Expense_Date,
                   e.Expense_Category, e.Description, e.Amount
            FROM Project_Expenses e
            LEFT JOIN Projects p ON p.Project_ID = e.Project_ID
            ORDER BY e.Expense_Date DESC, e.Expense_ID DESC
        `);
        return success(res, rows);
    } catch (error) {
        return failure(res, error);
    }
}

async function createExpense(req, res) {
    let connection;
    let transactionStarted = false;
    const locks = [];

    try {
        const body = req.body || {};
        const projectId = value(body, 'Project_ID', 'project_id');
        const category = value(body, 'Expense_Category', 'expense_category', 'category');
        const amount = Number(value(body, 'Amount', 'amount'));
        if (!projectId || !category || !Number.isFinite(amount) || amount < 0) {
            return failure(res, { message: 'Project_ID, Expense_Category, and a non-negative Amount are required' }, 400);
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        const generated = await nextId(connection, 'Project_Expenses', 'Expense_ID');
        locks.push(generated.lockName);
        await connection.query(`
            INSERT INTO Project_Expenses (
                Expense_ID, Project_ID, Expense_Date, Expense_Category, Description, Amount
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            generated.id,
            projectId,
            value(body, 'Expense_Date', 'expense_date') ?? new Date(),
            category,
            value(body, 'Description', 'description') ?? null,
            amount,
        ]);
        await connection.commit();
        transactionStarted = false;
        return success(res, { Expense_ID: generated.id }, 201);
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        return failure(res, error, error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    } finally {
        if (connection) {
            try { await releaseIdLocks(connection, locks); } finally { connection.release(); }
        }
    }
}

module.exports = { getExpenses, createExpense };