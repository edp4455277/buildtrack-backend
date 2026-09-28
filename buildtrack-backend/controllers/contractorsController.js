const db = require('../config/db');
const { nextId, releaseIdLocks, value, success, failure } = require('./dbHelpers');

async function getContractors(req, res) {
    try {
        const [contractors] = await db.query('SELECT * FROM Contractors ORDER BY Contractor_ID');
        return success(res, contractors);
    } catch (error) {
        console.error('Error fetching contractors:', error);
        return failure(res, error);
    }
}

async function createContractor(req, res) {
    let connection;
    let transactionStarted = false;
    const locks = [];

    try {
        const body = req.body || {};
        const name = value(body, 'Contractor_Name', 'contractor_name', 'name');
        if (!name) return failure(res, { message: 'Contractor_Name is required' }, 400);

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        const generated = await nextId(connection, 'Contractors', 'Contractor_ID');
        locks.push(generated.lockName);
        await connection.query(`
            INSERT INTO Contractors (
                Contractor_ID, Contractor_Name, Phone_Number, Email, Address, License_Number
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [generated.id, name,
            value(body, 'Phone_Number', 'phone_number', 'phone') ?? null,
            value(body, 'Email', 'email') ?? null,
            value(body, 'Address', 'address') ?? null,
            value(body, 'License_Number', 'license_number') ?? null]);
        const [rows] = await connection.query('SELECT * FROM Contractors WHERE Contractor_ID = ?', [generated.id]);
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

async function updateContractor(req, res) {
    const fields = [
        ['Contractor_Name', ['Contractor_Name', 'contractor_name', 'name']],
        ['Phone_Number', ['Phone_Number', 'phone_number', 'phone']],
        ['Email', ['Email', 'email']],
        ['Address', ['Address', 'address']],
        ['License_Number', ['License_Number', 'license_number']],
    ];

    try {
        const body = req.body || {};
        const updates = [];
        const params = [];
        for (const [column, keys] of fields) {
            const fieldValue = value(body, ...keys);
            if (fieldValue !== undefined) {
                updates.push(`${column} = ?`);
                params.push(fieldValue);
            }
        }
        if (!updates.length) return failure(res, { message: 'At least one contractor field is required' }, 400);

        params.push(req.params.id);
        const [result] = await db.query(`UPDATE Contractors SET ${updates.join(', ')} WHERE Contractor_ID = ?`, params);
        if (!result.affectedRows) {
            const [existing] = await db.query('SELECT Contractor_ID FROM Contractors WHERE Contractor_ID = ?', [req.params.id]);
            if (!existing.length) return failure(res, { message: 'Contractor not found' }, 404);
        }
        const [rows] = await db.query('SELECT * FROM Contractors WHERE Contractor_ID = ?', [req.params.id]);
        return success(res, rows[0]);
    } catch (error) {
        return failure(res, error, error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    }
}

async function deleteContractor(req, res) {
    try {
        const [result] = await db.query('DELETE FROM Contractors WHERE Contractor_ID = ?', [req.params.id]);
        if (!result.affectedRows) return failure(res, { message: 'Contractor not found' }, 404);
        return success(res, { Contractor_ID: Number(req.params.id) });
    } catch (error) {
        return failure(res, error, error.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500);
    }
}

module.exports = { getContractors, createContractor, updateContractor, deleteContractor };