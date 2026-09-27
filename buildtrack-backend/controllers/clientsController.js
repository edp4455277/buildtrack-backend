const db = require('../config/db');

async function getClients(req, res) {
    try {
        const [clients] = await db.query(`
            SELECT Client_ID, Client_Name, Phone_Number, Email, Address
            FROM Clients
            ORDER BY Client_ID
        `);

        return res.status(200).json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return res.status(500).json({ error: 'Unable to fetch clients' });
    }
}

module.exports = { getClients };