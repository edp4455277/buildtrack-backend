const db = require('../config/db');

async function getMaterials(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                Material_ID,
                Material_Name,
                Unit,
                Unit_Price,
                Stock_Quantity,
                Reorder_Level,
                CASE
                    WHEN Stock_Quantity <= Reorder_Level THEN TRUE
                    ELSE FALSE
                END AS Needs_Reorder
            FROM Materials
            ORDER BY Material_ID
        `);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('GET MATERIALS ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve materials.'
        });
    }
}


async function getMaterial(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                Material_ID,
                Material_Name,
                Unit,
                Unit_Price,
                Stock_Quantity,
                Reorder_Level,
                CASE
                    WHEN Stock_Quantity <= Reorder_Level THEN TRUE
                    ELSE FALSE
                END AS Needs_Reorder
            FROM Materials
            WHERE Material_ID = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Material not found.'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('GET MATERIAL ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve material.'
        });
    }
}


async function createMaterial(req, res) {
    try {
        const {
            Material_Name,
            Unit,
            Unit_Price,
            Stock_Quantity,
            Reorder_Level
        } = req.body;

        if (!Material_Name) {
            return res.status(400).json({
                success: false,
                message: 'Material_Name is required.'
            });
        }

        const [result] = await db.query(`
            INSERT INTO Materials
            (
                Material_ID,
                Material_Name,
                Unit,
                Unit_Price,
                Stock_Quantity,
                Reorder_Level
            )
            SELECT
                COALESCE(MAX(Material_ID), 0) + 1,
                ?, ?, ?, ?, ?
            FROM Materials
        `, [
            Material_Name,
            Unit || null,
            Unit_Price ?? 0,
            Stock_Quantity ?? 0,
            Reorder_Level ?? 0
        ]);

        res.status(201).json({
            success: true,
            message: 'Material created successfully.'
        });

    } catch (error) {
        console.error('CREATE MATERIAL ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create material.',
            error: error.message
        });
    }
}


async function updateMaterial(req, res) {
    try {
        const {
            Material_Name,
            Unit,
            Unit_Price,
            Stock_Quantity,
            Reorder_Level
        } = req.body;

        const [result] = await db.query(`
            UPDATE Materials
            SET
                Material_Name = ?,
                Unit = ?,
                Unit_Price = ?,
                Stock_Quantity = ?,
                Reorder_Level = ?
            WHERE Material_ID = ?
        `, [
            Material_Name,
            Unit,
            Unit_Price,
            Stock_Quantity,
            Reorder_Level,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Material not found.'
            });
        }

        res.json({
            success: true,
            message: 'Material updated successfully.'
        });

    } catch (error) {
        console.error('UPDATE MATERIAL ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update material.'
        });
    }
}


async function deleteMaterial(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Materials
            WHERE Material_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Material not found.'
            });
        }

        res.json({
            success: true,
            message: 'Material deleted successfully.'
        });

    } catch (error) {
        console.error('DELETE MATERIAL ERROR:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete this material because it is being used by purchase orders or deliveries.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete material.'
        });
    }
}


async function getLowStockMaterials(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                Material_ID,
                Material_Name,
                Unit,
                Stock_Quantity,
                Reorder_Level
            FROM Materials
            WHERE Stock_Quantity <= Reorder_Level
            ORDER BY Stock_Quantity ASC
        `);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('LOW STOCK ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve low-stock materials.'
        });
    }
}


module.exports = {
    getMaterials,
    getMaterial,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getLowStockMaterials
};
