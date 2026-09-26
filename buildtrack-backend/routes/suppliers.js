
const express = require('express');

const router = express.Router();

const db = require('../config/db');

//  /api/suppliers
router.get('/', async (req, res) => {
    try {
        const [suppliers] = await db.query(`
            SELECT
                Supplier_ID,
                Supplier_Name,
                Contact_Phone AS Phone_Number,
                Email,
                Address
            FROM Suppliers
            ORDER BY Supplier_ID;
        `);

        res.json(suppliers);

    } catch (err) {
        console.error('Error fetching suppliers:', err);

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;