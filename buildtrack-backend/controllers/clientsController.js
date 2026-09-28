const db = require('../config/db');
const { nextId, releaseIdLocks, value, success, failure } = require('./dbHelpers');

async function getClients(req, res) {
    try {
        const [clients] = await db.query('SELECT * FROM Clients ORDER BY Client_ID');
        return success(res, clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return failure(res, error);
    }
}

async function createClient(req, res) {
    let connection;
    let transactionStarted = false;
    const locks = [];

    try {
        const body = req.body || {};
        const name = value(body, 'Client_Name', 'client_name', 'name');
        if (!name) return failure(res, { message: 'Client_Name is required' }, 400);

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        const generated = await nextId(connection, 'Clients', 'Client_ID');
        locks.push(generated.lockName);
        await connection.query(`
            INSERT INTO Clients (Client_ID, Client_Name, Phone_Number, Email, Address)
            VALUES (?, ?, ?, ?, ?)
        `, [generated.id, name,
            value(body, 'Phone_Number', 'phone_number', 'phone') ?? null,
            value(body, 'Email', 'email') ?? null,
            value(body, 'Address', 'address') ?? null]);
        const [rows] = await connection.query('SELECT * FROM Clients WHERE Client_ID = ?', [generated.id]);
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

async function updateClient(req, res) {
    const fields = [
        ['Client_Name', ['Client_Name', 'client_name', 'name']],
        ['Phone_Number', ['Phone_Number', 'phone_number', 'phone']],
        ['Email', ['Email', 'email']],
        ['Address', ['Address', 'address']],
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
        if (!updates.length) return failure(res, { message: 'At least one client field is required' }, 400);

        params.push(req.params.id);
        const [result] = await db.query(`UPDATE Clients SET ${updates.join(', ')} WHERE Client_ID = ?`, params);
        if (!result.affectedRows) {
            const [existing] = await db.query('SELECT Client_ID FROM Clients WHERE Client_ID = ?', [req.params.id]);
            if (!existing.length) return failure(res, { message: 'Client not found' }, 404);
        }
        const [rows] = await db.query('SELECT * FROM Clients WHERE Client_ID = ?', [req.params.id]);
        return success(res, rows[0]);
    } catch (error) {
        return failure(res, error, error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    }
}

async function deleteClient(req, res) {
    try {
        const [result] = await db.query('DELETE FROM Clients WHERE Client_ID = ?', [req.params.id]);
        if (!result.affectedRows) return failure(res, { message: 'Client not found' }, 404);
        return success(res, { Client_ID: Number(req.params.id) });
    } catch (error) {
        return failure(res, error, error.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500);
    }
}

module.exports = { getClients, createClient, updateClient, deleteClient };