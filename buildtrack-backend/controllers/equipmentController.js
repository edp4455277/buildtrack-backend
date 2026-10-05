const db = require('../config/db');

async function getEquipment(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM Equipments
            ORDER BY Equipment_ID
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment.'
        });
    }
}

async function getEquipmentItem(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM Equipments
            WHERE Equipment_ID = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found.'
            });
        }

        const [allocations] = await db.query(`
            SELECT
                ea.*,
                p.Project_Name
            FROM Equipment_Allocations ea
            LEFT JOIN Projects p
                ON p.Project_ID = ea.Project_ID
            WHERE ea.Equipment_ID = ?
            ORDER BY ea.Allocation_ID DESC
        `, [req.params.id]);

        res.json({
            success: true,
            data: {
                ...rows[0],
                allocations
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment.'
        });
    }
}

async function createEquipment(req, res) {
    try {
        const {
            Equipment_Name,
            Equipment_Type,
            Registration_Number,
            Availability_Status
        } = req.body;

        if (!Equipment_Name) {
            return res.status(400).json({
                success: false,
                message: 'Equipment_Name is required.'
            });
        }

        const [[row]] = await db.query(`
            SELECT COALESCE(MAX(Equipment_ID), 0) + 1 AS nextId
            FROM Equipments
        `);

        await db.query(`
            INSERT INTO Equipments
            (
                Equipment_ID,
                Equipment_Name,
                Equipment_Type,
                Registration_Number,
                Availability_Status
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            row.nextId,
            Equipment_Name,
            Equipment_Type || null,
            Registration_Number || null,
            Availability_Status || 'Available'
        ]);

        res.status(201).json({
            success: true,
            message: 'Equipment created successfully.',
            Equipment_ID: row.nextId
        });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Registration number already exists.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create equipment.'
        });
    }
}

async function updateEquipment(req, res) {
    try {
        const {
            Equipment_Name,
            Equipment_Type,
            Registration_Number,
            Availability_Status
        } = req.body;

        const [result] = await db.query(`
            UPDATE Equipments
            SET
                Equipment_Name = ?,
                Equipment_Type = ?,
                Registration_Number = ?,
                Availability_Status = ?
            WHERE Equipment_ID = ?
        `, [
            Equipment_Name,
            Equipment_Type,
            Registration_Number,
            Availability_Status,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found.'
            });
        }

        res.json({
            success: true,
            message: 'Equipment updated successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to update equipment.'
        });
    }
}

async function deleteEquipment(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Equipments
            WHERE Equipment_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found.'
            });
        }

        res.json({
            success: true,
            message: 'Equipment deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(409).json({
            success: false,
            message: 'Cannot delete equipment because it has allocation records.'
        });
    }
}

module.exports = {
    getEquipment,
    getEquipmentItem,
    createEquipment,
    updateEquipment,
    deleteEquipment
};