const db = require('../config/db');

async function getPurchaseOrders(req, res) {
    try {
        const [orders] = await db.query(`
            SELECT
                po.Purchase_Order_ID,
                po.Project_ID,
                p.Project_Name,
                po.Supplier_ID,
                s.Supplier_Name,
                po.Order_Date,
                po.Expected_Delivery_Date,
                po.Status,
                po.Total_Amount
            FROM Purchase_Orders po
            LEFT JOIN Projects p
                ON p.Project_ID = po.Project_ID
            LEFT JOIN Suppliers s
                ON s.Supplier_ID = po.Supplier_ID
            ORDER BY po.Purchase_Order_ID
        `);

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve purchase orders.'
        });
    }
}

async function getPurchaseOrder(req, res) {
    try {
        const [orders] = await db.query(`
            SELECT
                po.*,
                p.Project_Name,
                s.Supplier_Name
            FROM Purchase_Orders po
            LEFT JOIN Projects p
                ON p.Project_ID = po.Project_ID
            LEFT JOIN Suppliers s
                ON s.Supplier_ID = po.Supplier_ID
            WHERE po.Purchase_Order_ID = ?
        `, [req.params.id]);

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found.'
            });
        }

        const [items] = await db.query(`
            SELECT
                poi.Purchase_Order_Item,
                poi.Purchase_Order_ID,
                poi.Material_ID,
                m.Material_Name,
                m.Unit,
                poi.Quantity,
                poi.Unit_Price,
                (poi.Quantity * poi.Unit_Price) AS Line_Total
            FROM Purchase_Order_Items poi
            INNER JOIN Materials m
                ON m.Material_ID = poi.Material_ID
            WHERE poi.Purchase_Order_ID = ?
            ORDER BY poi.Purchase_Order_Item
        `, [req.params.id]);

        res.json({
            success: true,
            data: {
                ...orders[0],
                items
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve purchase order.'
        });
    }
}

async function createPurchaseOrder(req, res) {
    const connection = await db.getConnection();

    try {
        const {
            Project_ID,
            Supplier_ID,
            Order_Date,
            Expected_Delivery_Date,
            Status,
            items = []
        } = req.body;

        if (!Project_ID || !Supplier_ID) {
            return res.status(400).json({
                success: false,
                message: 'Project_ID and Supplier_ID are required.'
            });
        }

        await connection.beginTransaction();

        const [[idRow]] = await connection.query(`
            SELECT COALESCE(MAX(Purchase_Order_ID), 0) + 1 AS nextId
            FROM Purchase_Orders
        `);

        const purchaseOrderId = idRow.nextId;

        let totalAmount = 0;

        for (const item of items) {
            totalAmount +=
                Number(item.Quantity || 0) *
                Number(item.Unit_Price || 0);
        }

        await connection.query(`
            INSERT INTO Purchase_Orders
            (
                Purchase_Order_ID,
                Project_ID,
                Supplier_ID,
                Order_Date,
                Expected_Delivery_Date,
                Status,
                Total_Amount
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            purchaseOrderId,
            Project_ID,
            Supplier_ID,
            Order_Date || null,
            Expected_Delivery_Date || null,
            Status || 'Draft',
            totalAmount
        ]);

        let itemId = await getNextItemId(connection);

        for (const item of items) {
            if (!item.Material_ID || !item.Quantity) {
                throw new Error('Each purchase order item requires Material_ID and Quantity.');
            }

            await connection.query(`
                INSERT INTO Purchase_Order_Items
                (
                    Purchase_Order_Item,
                    Purchase_Order_ID,
                    Material_ID,
                    Quantity,
                    Unit_Price
                )
                VALUES (?, ?, ?, ?, ?)
            `, [
                itemId++,
                purchaseOrderId,
                item.Material_ID,
                item.Quantity,
                item.Unit_Price || 0
            ]);
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Purchase order created successfully.',
            Purchase_Order_ID: purchaseOrderId
        });
    } catch (error) {
        await connection.rollback();

        console.error('CREATE PURCHASE ORDER ERROR:', error);

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create purchase order.'
        });
    } finally {
        connection.release();
    }
}

async function getNextItemId(connection) {
    const [[row]] = await connection.query(`
        SELECT COALESCE(MAX(Purchase_Order_Item), 0) + 1 AS nextId
        FROM Purchase_Order_Items
    `);

    return row.nextId;
}

async function updatePurchaseOrder(req, res) {
    try {
        const {
            Project_ID,
            Supplier_ID,
            Order_Date,
            Expected_Delivery_Date,
            Status,
            Total_Amount
        } = req.body;

        const [result] = await db.query(`
            UPDATE Purchase_Orders
            SET
                Project_ID = ?,
                Supplier_ID = ?,
                Order_Date = ?,
                Expected_Delivery_Date = ?,
                Status = ?,
                Total_Amount = ?
            WHERE Purchase_Order_ID = ?
        `, [
            Project_ID,
            Supplier_ID,
            Order_Date || null,
            Expected_Delivery_Date || null,
            Status,
            Total_Amount || 0,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found.'
            });
        }

        res.json({
            success: true,
            message: 'Purchase order updated successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to update purchase order.'
        });
    }
}

async function deletePurchaseOrder(req, res) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(`
            DELETE FROM Purchase_Order_Items
            WHERE Purchase_Order_ID = ?
        `, [req.params.id]);

        const [result] = await connection.query(`
            DELETE FROM Purchase_Orders
            WHERE Purchase_Order_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Purchase order not found.'
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Purchase order deleted successfully.'
        });
    } catch (error) {
        await connection.rollback();

        console.error(error);

        res.status(409).json({
            success: false,
            message: 'Cannot delete this purchase order because it has related records.'
        });
    } finally {
        connection.release();
    }
}

async function addPurchaseOrderItem(req, res) {
    try {
        const {
            Material_ID,
            Quantity,
            Unit_Price
        } = req.body;

        const [[order]] = await db.query(`
            SELECT Purchase_Order_ID
            FROM Purchase_Orders
            WHERE Purchase_Order_ID = ?
        `, [req.params.id]);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found.'
            });
        }

        const [[idRow]] = await db.query(`
            SELECT COALESCE(MAX(Purchase_Order_Item), 0) + 1 AS nextId
            FROM Purchase_Order_Items
        `);

        await db.query(`
            INSERT INTO Purchase_Order_Items
            (
                Purchase_Order_Item,
                Purchase_Order_ID,
                Material_ID,
                Quantity,
                Unit_Price
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            idRow.nextId,
            req.params.id,
            Material_ID,
            Quantity,
            Unit_Price || 0
        ]);

        await recalculatePurchaseOrder(req.params.id);

        res.status(201).json({
            success: true,
            message: 'Purchase order item added successfully.',
            Purchase_Order_Item: idRow.nextId
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to add purchase order item.'
        });
    }
}

async function deletePurchaseOrderItem(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Purchase_Order_Items
            WHERE Purchase_Order_Item = ?
        `, [req.params.itemId]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order item not found.'
            });
        }

        await recalculatePurchaseOrder(req.params.id);

        res.json({
            success: true,
            message: 'Purchase order item deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete purchase order item.'
        });
    }
}

async function recalculatePurchaseOrder(id) {
    await db.query(`
        UPDATE Purchase_Orders po
        SET Total_Amount = (
            SELECT COALESCE(SUM(Quantity * Unit_Price), 0)
            FROM Purchase_Order_Items
            WHERE Purchase_Order_ID = ?
        )
        WHERE po.Purchase_Order_ID = ?
    `, [id, id]);
}

module.exports = {
    getPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addPurchaseOrderItem,
    deletePurchaseOrderItem
};