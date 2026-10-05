const db = require('../config/db');

async function getAllocations(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                ea.Allocation_ID,
                ea.Equipment_ID,
                e.Equipment_Name,
                ea.Project_ID,
                p.Project_Name,
                ea.Allocation_Start_Date,
                ea.Allocation_End_Date,
                ea.Purpose,
                ea.Status
            FROM Equipment_Allocations ea
            LEFT JOIN Equipments e
                ON e.Equipment_ID = ea.Equipment_ID
            LEFT JOIN Projects p
                ON p.Project_ID = ea.Project_ID
            ORDER BY ea.Allocation_ID DESC
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment allocations.'
        });
    }
}

async function createAllocation(req, res) {
    const connection = await db.getConnection();

    try {
        const {
            Equipment_ID,
            Project_ID,
            Allocation_Start_Date,
            Allocation_End_Date,
            Purpose,
            Status
        } = req.body;

        if (!Equipment_ID || !Project_ID || !Allocation_Start_Date) {
            return res.status(400).json({
                success: false,
                message: 'Equipment_ID, Project_ID and Allocation_Start_Date are required.'
            });
        }

        await connection.beginTransaction();

        const [equipment] = await connection.query(`
            SELECT Availability_Status
            FROM Equipments
            WHERE Equipment_ID = ?
            FOR UPDATE
        `, [Equipment_ID]);

        if (!equipment.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Equipment not found.'
            });
        }

        if (equipment[0].Availability_Status !== 'Available') {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'Equipment is not currently available.'
            });
        }

        const [result] = await connection.query(`
            INSERT INTO Equipment_Allocations
            (
                Equipment_ID,
                Project_ID,
                Allocation_Start_Date,
                Allocation_End_Date,
                Purpose,
                Status
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            Equipment_ID,
            Project_ID,
            Allocation_Start_Date,
            Allocation_End_Date || null,
            Purpose || null,
            Status || 'Active'
        ]);

        await connection.query(`
            UPDATE Equipments
            SET Availability_Status = 'Allocated'
            WHERE Equipment_ID = ?
        `, [Equipment_ID]);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Equipment allocated successfully.',
            Allocation_ID: result.insertId
        });
    } catch (error) {
        await connection.rollback();

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to allocate equipment.'
        });
    } finally {
        connection.release();
    }
}

async function updateAllocation(req, res) {
    try {
        const {
            Allocation_Start_Date,
            Allocation_End_Date,
            Purpose,
            Status
        } = req.body;

        const [rows] = await db.query(`
            SELECT Equipment_ID
            FROM Equipment_Allocations
            WHERE Allocation_ID = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Allocation not found.'
            });
        }

        await db.query(`
            UPDATE Equipment_Allocations
            SET
                Allocation_Start_Date = ?,
                Allocation_End_Date = ?,
                Purpose = ?,
                Status = ?
            WHERE Allocation_ID = ?
        `, [
            Allocation_Start_Date,
            Allocation_End_Date || null,
            Purpose || null,
            Status,
            req.params.id
        ]);

        if (Status === 'Completed' || Status === 'Cancelled') {
            await db.query(`
                UPDATE Equipments
                SET Availability_Status = 'Available'
                WHERE Equipment_ID = ?
            `, [rows[0].Equipment_ID]);
        }

        res.json({
            success: true,
            message: 'Equipment allocation updated successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to update allocation.'
        });
    }
}

async function deleteAllocation(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT Equipment_ID
            FROM Equipment_Allocations
            WHERE Allocation_ID = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Allocation not found.'
            });
        }

        await db.query(`
            DELETE FROM Equipment_Allocations
            WHERE Allocation_ID = ?
        `, [req.params.id]);

        await db.query(`
            UPDATE Equipments
            SET Availability_Status = 'Available'
            WHERE Equipment_ID = ?
        `, [rows[0].Equipment_ID]);

        res.json({
            success: true,
            message: 'Equipment allocation deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete allocation.'
        });
    }
}

module.exports = {
    getAllocations,
    createAllocation,
    updateAllocation,
    deleteAllocation
};