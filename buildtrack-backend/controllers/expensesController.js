const db = require('../config/db');
const { nextId, releaseIdLocks, value, success, failure } = require('./dbHelpers');

function expenseCategory(category) {
    return { Labor: 'Labour', Misc: 'Other' }[category] || category;
}

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
            expenseCategory(category),
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

async function updateExpense(req, res) {
    const fields = [
        ['Project_ID', ['Project_ID', 'project_id']],
        ['Expense_Date', ['Expense_Date', 'expense_date']],
        ['Expense_Category', ['Expense_Category', 'expense_category', 'category']],
        ['Description', ['Description', 'description']],
        ['Amount', ['Amount', 'amount']],
    ];

    try {
        const body = req.body || {};
        const updates = [];
        const params = [];
        for (const [column, keys] of fields) {
            const fieldValue = value(body, ...keys);
            if (fieldValue !== undefined) {
                updates.push(`${column} = ?`);
                params.push(column === 'Expense_Category' ? expenseCategory(fieldValue) : fieldValue);
            }
        }
        if (!updates.length) return failure(res, { message: 'At least one expense field is required' }, 400);

        params.push(req.params.id);
        const [result] = await db.query(
            `UPDATE Project_Expenses SET ${updates.join(', ')} WHERE Expense_ID = ?`,
            params
        );
        if (!result.affectedRows) {
            const [existing] = await db.query('SELECT Expense_ID FROM Project_Expenses WHERE Expense_ID = ?', [req.params.id]);
            if (!existing.length) return failure(res, { message: 'Expense not found' }, 404);
        }
        const [rows] = await db.query(`
            SELECT e.Expense_ID, e.Project_ID, p.Project_Name, e.Expense_Date,
                   e.Expense_Category, e.Description, e.Amount
            FROM Project_Expenses e
            LEFT JOIN Projects p ON p.Project_ID = e.Project_ID
            WHERE e.Expense_ID = ?
        `, [req.params.id]);
        return success(res, rows[0]);
    } catch (error) {
        return failure(res, error, error.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500);
    }
}

async function deleteExpense(req, res) {
    try {
        const [result] = await db.query('DELETE FROM Project_Expenses WHERE Expense_ID = ?', [req.params.id]);
        if (!result.affectedRows) return failure(res, { message: 'Expense not found' }, 404);
        return success(res, { Expense_ID: Number(req.params.id) });
    } catch (error) {
        return failure(res, error, error.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500);
    }
}

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };