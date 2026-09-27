const db = require('../config/db');

async function getContractors(req, res) {
    try {
        const [contractors] = await db.query(`
            SELECT Contractor_ID, Contractor_Name, Phone_Number, Email, Address, License_Number
            FROM Contractors
            ORDER BY Contractor_ID
        `);

        return res.status(200).json(contractors);
    } catch (error) {
        console.error('Error fetching contractors:', error);
        return res.status(500).json({ error: 'Unable to fetch contractors' });
    }
}

module.exports = { getContractors };