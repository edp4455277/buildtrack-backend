const express = require('express');
const router = express.Router();
const db = require('../config/db');

// all project expenses with project details
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT
                e.Expense_ID,
                e.Project_ID,
                p.Project_Name,
                e.Expense_Date,
                e.Category AS Expense_Category,
                e.Description,
                e.Amount
            FROM Expenses e
            LEFT JOIN Projects p
                ON e.Project_ID = p.Project_ID
            ORDER BY e.Expense_Date DESC, e.Expense_ID DESC
        `;

        const [expenses] = await db.query(query);

        res.json(expenses);

    } catch (err) {
        console.error('Error fetching expenses:', err);

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;