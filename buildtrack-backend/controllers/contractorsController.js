const db = require('../config/db');

async function getContractors(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM Contractors
            ORDER BY Contractor_ID
        `);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve contractors.'
        });
    }
}

async function getContractor(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM Contractors
            WHERE Contractor_ID = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Contractor not found.'
            });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve contractor.'
        });
    }
}

async function createContractor(req, res) {
    try {
        const {
            Contractor_Name,
            Phone_Number,
            Email,
            Address,
            License_Number
        } = req.body;

        if (!Contractor_Name) {
            return res.status(400).json({
                success: false,
                message: 'Contractor_Name is required.'
            });
        }

        const [[row]] = await db.query(`
            SELECT COALESCE(MAX(Contractor_ID), 0) + 1 AS nextId
            FROM Contractors
        `);

        await db.query(`
            INSERT INTO Contractors
            (
                Contractor_ID,
                Contractor_Name,
                Phone_Number,
                Email,
                Address,
                License_Number
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            row.nextId,
            Contractor_Name,
            Phone_Number || null,
            Email || null,
            Address || null,
            License_Number || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Contractor created successfully.',
            Contractor_ID: row.nextId
        });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Email or license number already exists.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create contractor.'
        });
    }
}

async function updateContractor(req, res) {
    try {
        const {
            Contractor_Name,
            Phone_Number,
            Email,
            Address,
            License_Number
        } = req.body;

        const [result] = await db.query(`
            UPDATE Contractors
            SET
                Contractor_Name = ?,
                Phone_Number = ?,
                Email = ?,
                Address = ?,
                License_Number = ?
            WHERE Contractor_ID = ?
        `, [
            Contractor_Name,
            Phone_Number || null,
            Email || null,
            Address || null,
            License_Number || null,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Contractor not found.'
            });
        }

        res.json({
            success: true,
            message: 'Contractor updated successfully.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to update contractor.'
        });
    }
}

async function deleteContractor(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Contractors
            WHERE Contractor_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Contractor not found.'
            });
        }

        res.json({
            success: true,
            message: 'Contractor deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete contractor because it is linked to a project.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete contractor.'
        });
    }
}

module.exports = {
    getContractors,
    getContractor,
    createContractor,
    updateContractor,
    deleteContractor
};