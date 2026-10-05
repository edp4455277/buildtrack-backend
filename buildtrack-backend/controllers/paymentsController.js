const db = require('../config/db');

async function getPayments(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                pay.Payment_ID,
                pay.Supplier_ID,
                s.Supplier_Name,
                pay.Purchase_Order_ID,
                pay.Payment_Date,
                pay.Amount,
                pay.Payment_Method,
                pay.Reference_Number
            FROM Payments pay
            LEFT JOIN Suppliers s
                ON s.Supplier_ID = pay.Supplier_ID
            ORDER BY pay.Payment_ID DESC
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payments.'
        });
    }
}

async function getPayment(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                pay.*,
                s.Supplier_Name
            FROM Payments pay
            LEFT JOIN Suppliers s
                ON s.Supplier_ID = pay.Supplier_ID
            WHERE pay.Payment_ID = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found.'
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
            message: 'Failed to retrieve payment.'
        });
    }
}

async function createPayment(req, res) {
    try {
        const {
            Supplier_ID,
            Purchase_Order_ID,
            Payment_Date,
            Amount,
            Payment_Method,
            Reference_Number
        } = req.body;

        if (!Supplier_ID || Amount === undefined || !Payment_Method) {
            return res.status(400).json({
                success: false,
                message: 'Supplier_ID, Amount and Payment_Method are required.'
            });
        }

        const [[row]] = await db.query(`
            SELECT COALESCE(MAX(Payment_ID), 0) + 1 AS nextId
            FROM Payments
        `);

        await db.query(`
            INSERT INTO Payments
            (
                Payment_ID,
                Supplier_ID,
                Purchase_Order_ID,
                Payment_Date,
                Amount,
                Payment_Method,
                Reference_Number
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            row.nextId,
            Supplier_ID,
            Purchase_Order_ID || null,
            Payment_Date || null,
            Amount,
            Payment_Method,
            Reference_Number || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Payment created successfully.',
            Payment_ID: row.nextId
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to create payment.'
        });
    }
}

async function updatePayment(req, res) {
    try {
        const {
            Supplier_ID,
            Purchase_Order_ID,
            Payment_Date,
            Amount,
            Payment_Method,
            Reference_Number
        } = req.body;

        const [result] = await db.query(`
            UPDATE Payments
            SET
                Supplier_ID = ?,
                Purchase_Order_ID = ?,
                Payment_Date = ?,
                Amount = ?,
                Payment_Method = ?,
                Reference_Number = ?
            WHERE Payment_ID = ?
        `, [
            Supplier_ID,
            Purchase_Order_ID || null,
            Payment_Date || null,
            Amount,
            Payment_Method,
            Reference_Number || null,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found.'
            });
        }

        res.json({
            success: true,
            message: 'Payment updated successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to update payment.'
        });
    }
}

async function deletePayment(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Payments
            WHERE Payment_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found.'
            });
        }

        res.json({
            success: true,
            message: 'Payment deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete payment.'
        });
    }
}

module.exports = {
    getPayments,
    getPayment,
    createPayment,
    updatePayment,
    deletePayment
};