const db = require('../config/db');

async function getDeliveries(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                d.Delivery_ID,
                d.Purchase_Order_ID,
                d.Delivery_Date,
                d.Delivery_Reference,
                d.Received_By,
                e.Employee_Name AS Received_By_Name,
                d.Status,
                d.Notes
            FROM Deliveries d
            LEFT JOIN Employees e
                ON e.Employee_ID = d.Received_By
            ORDER BY d.Delivery_ID
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve deliveries.'
        });
    }
}

async function getDelivery(req, res) {
    try {
        const [deliveries] = await db.query(`
            SELECT
                d.*,
                e.Employee_Name AS Received_By_Name
            FROM Deliveries d
            LEFT JOIN Employees e
                ON e.Employee_ID = d.Received_By
            WHERE d.Delivery_ID = ?
        `, [req.params.id]);

        if (!deliveries.length) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found.'
            });
        }

        const [items] = await db.query(`
            SELECT
                di.Delivery_Item_ID,
                di.Delivery_ID,
                di.Material_ID,
                m.Material_Name,
                m.Unit,
                di.Quantity_Delivered
            FROM Delivery_Items di
            INNER JOIN Materials m
                ON m.Material_ID = di.Material_ID
            WHERE di.Delivery_ID = ?
            ORDER BY di.Delivery_Item_ID
        `, [req.params.id]);

        res.json({
            success: true,
            data: {
                ...deliveries[0],
                items
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve delivery.'
        });
    }
}

async function createDelivery(req, res) {
    const connection = await db.getConnection();

    try {
        const {
            Purchase_Order_ID,
            Delivery_Date,
            Delivery_Reference,
            Received_By,
            Status,
            Notes,
            items = []
        } = req.body;

        if (!Purchase_Order_ID) {
            return res.status(400).json({
                success: false,
                message: 'Purchase_Order_ID is required.'
            });
        }

        await connection.beginTransaction();

        const [[idRow]] = await connection.query(`
            SELECT COALESCE(MAX(Delivery_ID), 0) + 1 AS nextId
            FROM Deliveries
        `);

        const deliveryId = idRow.nextId;

        await connection.query(`
            INSERT INTO Deliveries
            (
                Delivery_ID,
                Purchase_Order_ID,
                Delivery_Date,
                Delivery_Reference,
                Received_By,
                Status,
                Notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            deliveryId,
            Purchase_Order_ID,
            Delivery_Date || null,
            Delivery_Reference || null,
            Received_By || null,
            Status || 'Received',
            Notes || null
        ]);

        let itemId = await getNextDeliveryItemId(connection);

        for (const item of items) {
            await connection.query(`
                INSERT INTO Delivery_Items
                (
                    Delivery_Item_ID,
                    Delivery_ID,
                    Material_ID,
                    Quantity_Delivered
                )
                VALUES (?, ?, ?, ?)
            `, [
                itemId++,
                deliveryId,
                item.Material_ID,
                item.Quantity_Delivered
            ]);

            await connection.query(`
                UPDATE Materials
                SET Stock_Quantity = Stock_Quantity + ?
                WHERE Material_ID = ?
            `, [
                item.Quantity_Delivered,
                item.Material_ID
            ]);
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Delivery created successfully.',
            Delivery_ID: deliveryId
        });
    } catch (error) {
        await connection.rollback();

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create delivery.'
        });
    } finally {
        connection.release();
    }
}

async function getNextDeliveryItemId(connection) {
    const [[row]] = await connection.query(`
        SELECT COALESCE(MAX(Delivery_Item_ID), 0) + 1 AS nextId
        FROM Delivery_Items
    `);

    return row.nextId;
}

async function addDeliveryItem(req, res) {
    try {
        const {
            Material_ID,
            Quantity_Delivered
        } = req.body;

        const [[delivery]] = await db.query(`
            SELECT Delivery_ID
            FROM Deliveries
            WHERE Delivery_ID = ?
        `, [req.params.id]);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found.'
            });
        }

        const [[idRow]] = await db.query(`
            SELECT COALESCE(MAX(Delivery_Item_ID), 0) + 1 AS nextId
            FROM Delivery_Items
        `);

        await db.query(`
            INSERT INTO Delivery_Items
            (
                Delivery_Item_ID,
                Delivery_ID,
                Material_ID,
                Quantity_Delivered
            )
            VALUES (?, ?, ?, ?)
        `, [
            idRow.nextId,
            req.params.id,
            Material_ID,
            Quantity_Delivered
        ]);

        await db.query(`
            UPDATE Materials
            SET Stock_Quantity = Stock_Quantity + ?
            WHERE Material_ID = ?
        `, [
            Quantity_Delivered,
            Material_ID
        ]);

        res.status(201).json({
            success: true,
            message: 'Delivery item added successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to add delivery item.'
        });
    }
}

async function deleteDelivery(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Deliveries
            WHERE Delivery_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found.'
            });
        }

        res.json({
            success: true,
            message: 'Delivery deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(409).json({
            success: false,
            message: 'Cannot delete this delivery because it contains delivery items.'
        });
    }
}

module.exports = {
    getDeliveries,
    getDelivery,
    createDelivery,
    addDeliveryItem,
    deleteDelivery
};