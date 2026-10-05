const db = require('../config/db');

async function getExpenses(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                pe.Expense_ID,
                pe.Project_ID,
                p.Project_Name,
                pe.Expense_Date,
                pe.Expense_Category,
                pe.Description,
                pe.Amount
            FROM Project_Expenses pe
            LEFT JOIN Projects p
                ON p.Project_ID = pe.Project_ID
            ORDER BY pe.Expense_ID DESC
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve expenses.'
        });
    }
}

async function getExpense(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                pe.*,
                p.Project_Name
            FROM Project_Expenses pe
            LEFT JOIN Projects p
                ON p.Project_ID = pe.Project_ID
            WHERE pe.Expense_ID = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found.'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve expense.'
        });
    }
}

async function createExpense(req, res) {
    try {
        const {
            Project_ID,
            Expense_Date,
            Expense_Category,
            Description,
            Amount
        } = req.body;

        if (!Project_ID || !Expense_Category || Amount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Project_ID, Expense_Category and Amount are required.'
            });
        }

        const [result] = await db.query(`
            INSERT INTO Project_Expenses
            (
                Project_ID,
                Expense_Date,
                Expense_Category,
                Description,
                Amount
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            Project_ID,
            Expense_Date || null,
            Expense_Category,
            Description || null,
            Amount
        ]);

        res.status(201).json({
            success: true,
            message: 'Expense created successfully.',
            Expense_ID: result.insertId
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to create expense.'
        });
    }
}

async function updateExpense(req, res) {
    try {
        const {
            Project_ID,
            Expense_Date,
            Expense_Category,
            Description,
            Amount
        } = req.body;

        const [result] = await db.query(`
            UPDATE Project_Expenses
            SET
                Project_ID = ?,
                Expense_Date = ?,
                Expense_Category = ?,
                Description = ?,
                Amount = ?
            WHERE Expense_ID = ?
        `, [
            Project_ID,
            Expense_Date || null,
            Expense_Category,
            Description || null,
            Amount,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found.'
            });
        }

        res.json({
            success: true,
            message: 'Expense updated successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to update expense.'
        });
    }
}

async function deleteExpense(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Project_Expenses
            WHERE Expense_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found.'
            });
        }

        res.json({
            success: true,
            message: 'Expense deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete expense.'
        });
    }
}

async function getProjectExpenses(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM Project_Expenses
            WHERE Project_ID = ?
            ORDER BY Expense_Date DESC, Expense_ID DESC
        `, [req.params.projectId]);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve project expenses.'
        });
    }
}

module.exports = {
    getExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    getProjectExpenses
};