const db = require('../config/db');

async function getSuppliers(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                s.*,
                COALESCE(SUM(p.Amount), 0) AS Total_Paid
            FROM Suppliers s
            LEFT JOIN Payments p
                ON p.Supplier_ID = s.Supplier_ID
            GROUP BY s.Supplier_ID
            ORDER BY s.Supplier_ID
        `);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve suppliers.'
        });
    }
}

async function getSupplier(req, res) {
    try {
        const [supplierRows] = await db.query(`
            SELECT *
            FROM Suppliers
            WHERE Supplier_ID = ?
        `, [req.params.id]);

        if (!supplierRows.length) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        const [orders] = await db.query(`
            SELECT
                po.Purchase_Order_ID,
                po.Project_ID,
                p.Project_Name,
                po.Order_Date,
                po.Expected_Delivery_Date,
                po.Status,
                po.Total_Amount
            FROM Purchase_Orders po
            LEFT JOIN Projects p
                ON p.Project_ID = po.Project_ID
            WHERE po.Supplier_ID = ?
            ORDER BY po.Purchase_Order_ID
        `, [req.params.id]);

        const [payments] = await db.query(`
            SELECT *
            FROM Payments
            WHERE Supplier_ID = ?
            ORDER BY Payment_Date DESC
        `, [req.params.id]);

        res.json({
            success: true,
            data: {
                ...supplierRows[0],
                purchase_orders: orders,
                payments
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve supplier.'
        });
    }
}

async function createSupplier(req, res) {
    try {
        const {
            Supplier_Name,
            Phone_Number,
            Email,
            Address
        } = req.body;

        if (!Supplier_Name) {
            return res.status(400).json({
                success: false,
                message: 'Supplier_Name is required.'
            });
        }

        const [[row]] = await db.query(`
            SELECT COALESCE(MAX(Supplier_ID), 0) + 1 AS nextId
            FROM Suppliers
        `);

        await db.query(`
            INSERT INTO Suppliers
            (Supplier_ID, Supplier_Name, Phone_Number, Email, Address)
            VALUES (?, ?, ?, ?, ?)
        `, [
            row.nextId,
            Supplier_Name,
            Phone_Number || null,
            Email || null,
            Address || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Supplier created successfully.',
            Supplier_ID: row.nextId
        });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Supplier email already exists.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create supplier.'
        });
    }
}

async function updateSupplier(req, res) {
    try {
        const {
            Supplier_Name,
            Phone_Number,
            Email,
            Address
        } = req.body;

        const [result] = await db.query(`
            UPDATE Suppliers
            SET
                Supplier_Name = ?,
                Phone_Number = ?,
                Email = ?,
                Address = ?
            WHERE Supplier_ID = ?
        `, [
            Supplier_Name,
            Phone_Number || null,
            Email || null,
            Address || null,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        res.json({
            success: true,
            message: 'Supplier updated successfully.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to update supplier.'
        });
    }
}

async function deleteSupplier(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Suppliers
            WHERE Supplier_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        res.json({
            success: true,
            message: 'Supplier deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(409).json({
            success: false,
            message: 'Cannot delete supplier because it is linked to purchase orders or payments.'
        });
    }
}

module.exports = {
    getSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier
};