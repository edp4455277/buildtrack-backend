const db = require('../config/db');
const { nextId, releaseIdLocks, value, success, failure } = require('./dbHelpers');

async function getEquipment(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT Equipment_ID, Equipment_Name, Equipment_Type, Registration_Number,
                   Availability_Status
            FROM Equipments
            ORDER BY Equipment_ID
        `);
        return success(res, rows);
    } catch (error) {
        return failure(res, error);
    }
}

async function allocateEquipment(req, res) {
    let connection;
    let transactionStarted = false;
    const locks = [];

    try {
        const body = req.body || {};
        const equipmentId = value(body, 'Equipment_ID', 'equipment_id');
        const projectId = value(body, 'Project_ID', 'project_id');
        const startDate = value(body, 'Allocation_Start_Date', 'allocation_start_date', 'start_date');
        if (!equipmentId || !projectId || !startDate) {
            return failure(res, { message: 'Equipment_ID, Project_ID, and Allocation_Start_Date are required' }, 400);
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        const [equipment] = await connection.query(
            'SELECT Availability_Status FROM Equipments WHERE Equipment_ID = ? FOR UPDATE',
            [equipmentId]
        );
        if (!equipment.length) {
            const error = new Error('Equipment not found');
            error.statusCode = 404;
            throw error;
        }
        if (equipment[0].Availability_Status !== 'Available') {
            const error = new Error('Equipment is not available for allocation');
            error.statusCode = 409;
            throw error;
        }

        const generated = await nextId(connection, 'Equipment_Allocations', 'Allocation_ID');
        locks.push(generated.lockName);
        await connection.query(`
            INSERT INTO Equipment_Allocations (
                Allocation_ID, Equipment_ID, Project_ID, Allocation_Start_Date,
                Allocation_End_Date, Purpose, Status
            ) VALUES (?, ?, ?, ?, ?, ?, 'Active')
        `, [
            generated.id,
            equipmentId,
            projectId,
            startDate,
            value(body, 'Allocation_End_Date', 'allocation_end_date', 'end_date') ?? null,
            value(body, 'Purpose', 'purpose') ?? null,
        ]);
        await connection.query(
            "UPDATE Equipments SET Availability_Status = 'Allocated' WHERE Equipment_ID = ?",
            [equipmentId]
        );
        await connection.commit();
        transactionStarted = false;
        return success(res, { Allocation_ID: generated.id }, 201);
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        return failure(res, error, error.statusCode || 500);
    } finally {
        if (connection) {
            try { await releaseIdLocks(connection, locks); } finally { connection.release(); }
        }
    }
}

module.exports = { getEquipment, allocateEquipment };