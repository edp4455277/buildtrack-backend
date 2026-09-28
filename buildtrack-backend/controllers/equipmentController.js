const db = require('../config/db');
const { nextId, releaseIdLocks, value, success, failure } = require('./dbHelpers');

function equipmentStatus(status) {
    return { 'In Use': 'Allocated' }[status] || status;
}

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

async function createEquipment(req, res) {
    let connection;
    let transactionStarted = false;
    const locks = [];

    try {
        const body = req.body || {};
        const name = value(body, 'Equipment_Name', 'equipment_name', 'name');
        const status = equipmentStatus(value(body, 'Availability_Status', 'availability_status', 'status') || 'Available');
        if (!name) return failure(res, { message: 'Equipment_Name is required' }, 400);
        if (!['Available', 'Allocated', 'Maintenance'].includes(status)) {
            return failure(res, { message: 'Availability_Status must be Available, Allocated, or Maintenance' }, 400);
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        const generated = await nextId(connection, 'Equipments', 'Equipment_ID');
        locks.push(generated.lockName);
        await connection.query(`
            INSERT INTO Equipments (
                Equipment_ID, Equipment_Name, Equipment_Type, Registration_Number, Availability_Status
            ) VALUES (?, ?, ?, ?, ?)
        `, [generated.id, name,
            value(body, 'Equipment_Type', 'equipment_type', 'type') ?? null,
            value(body, 'Registration_Number', 'registration_number') ?? null,
            status]);
        const [rows] = await connection.query('SELECT * FROM Equipments WHERE Equipment_ID = ?', [generated.id]);
        await connection.commit();
        transactionStarted = false;
        return success(res, rows[0], 201);
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        return failure(res, error, error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    } finally {
        if (connection) {
            try { await releaseIdLocks(connection, locks); } finally { connection.release(); }
        }
    }
}

async function updateEquipment(req, res) {
    const fields = [
        ['Equipment_Name', ['Equipment_Name', 'equipment_name', 'name']],
        ['Equipment_Type', ['Equipment_Type', 'equipment_type', 'type']],
        ['Registration_Number', ['Registration_Number', 'registration_number']],
        ['Availability_Status', ['Availability_Status', 'availability_status', 'status']],
    ];

    try {
        const body = req.body || {};
        const updates = [];
        const params = [];
        for (const [column, keys] of fields) {
            const fieldValue = value(body, ...keys);
            if (fieldValue !== undefined) {
                const normalized = column === 'Availability_Status' ? equipmentStatus(fieldValue) : fieldValue;
                if (column === 'Availability_Status' && !['Available', 'Allocated', 'Maintenance'].includes(normalized)) {
                    return failure(res, { message: 'Invalid Availability_Status' }, 400);
                }
                updates.push(`${column} = ?`);
                params.push(normalized);
            }
        }
        if (!updates.length) return failure(res, { message: 'At least one equipment field is required' }, 400);

        params.push(req.params.id);
        const [result] = await db.query(`UPDATE Equipments SET ${updates.join(', ')} WHERE Equipment_ID = ?`, params);
        if (!result.affectedRows) {
            const [existing] = await db.query('SELECT Equipment_ID FROM Equipments WHERE Equipment_ID = ?', [req.params.id]);
            if (!existing.length) return failure(res, { message: 'Equipment not found' }, 404);
        }
        const [rows] = await db.query('SELECT * FROM Equipments WHERE Equipment_ID = ?', [req.params.id]);
        return success(res, rows[0]);
    } catch (error) {
        return failure(res, error, error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    }
}

async function deleteEquipment(req, res) {
    try {
        const [result] = await db.query('DELETE FROM Equipments WHERE Equipment_ID = ?', [req.params.id]);
        if (!result.affectedRows) return failure(res, { message: 'Equipment not found' }, 404);
        return success(res, { Equipment_ID: Number(req.params.id) });
    } catch (error) {
        return failure(res, error, error.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500);
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

module.exports = { getEquipment, createEquipment, updateEquipment, deleteEquipment, allocateEquipment };