const db = require('../config/db');

async function getClients(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM Clients
            ORDER BY Client_ID
        `);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('GET CLIENTS ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve clients.'
        });
    }
}

async function getClient(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM Clients
            WHERE Client_ID = ?
        `, [req.params.id]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Client not found.'
            });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('GET CLIENT ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve client.'
        });
    }
}

async function createClient(req, res) {
    try {
        const {
            Client_Name,
            Phone_Number,
            Email,
            Address
        } = req.body;

        if (!Client_Name) {
            return res.status(400).json({
                success: false,
                message: 'Client_Name is required.'
            });
        }

        const [[row]] = await db.query(`
            SELECT COALESCE(MAX(Client_ID), 0) + 1 AS nextId
            FROM Clients
        `);

        await db.query(`
            INSERT INTO Clients
            (Client_ID, Client_Name, Phone_Number, Email, Address)
            VALUES (?, ?, ?, ?, ?)
        `, [
            row.nextId,
            Client_Name,
            Phone_Number || null,
            Email || null,
            Address || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Client created successfully.',
            Client_ID: row.nextId
        });
    } catch (error) {
        console.error('CREATE CLIENT ERROR:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'A client with this email already exists.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create client.'
        });
    }
}

async function updateClient(req, res) {
    try {
        const {
            Client_Name,
            Phone_Number,
            Email,
            Address
        } = req.body;

        const [result] = await db.query(`
            UPDATE Clients
            SET
                Client_Name = ?,
                Phone_Number = ?,
                Email = ?,
                Address = ?
            WHERE Client_ID = ?
        `, [
            Client_Name,
            Phone_Number || null,
            Email || null,
            Address || null,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Client not found.'
            });
        }

        res.json({
            success: true,
            message: 'Client updated successfully.'
        });
    } catch (error) {
        console.error('UPDATE CLIENT ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update client.'
        });
    }
}

async function deleteClient(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Clients
            WHERE Client_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Client not found.'
            });
        }

        res.json({
            success: true,
            message: 'Client deleted successfully.'
        });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete this client because it is linked to a project.'
            });
        }

        console.error('DELETE CLIENT ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete client.'
        });
    }
}

module.exports = {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient
};