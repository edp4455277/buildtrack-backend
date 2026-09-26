const db = require('../config/db');
const { nextId, releaseIdLocks, value, success, failure } = require('./dbHelpers');

async function getSuppliers(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT Supplier_ID, Supplier_Name, Phone_Number, Email, Address
            FROM Suppliers
            ORDER BY Supplier_ID
        `);
        return success(res, rows);
    } catch (error) {
        return failure(res, error);
    }
}

async function createSupplier(req, res) {
    let connection;
    let transactionStarted = false;
    const locks = [];

    try {
        const body = req.body || {};
        const supplierName = value(body, 'Supplier_Name', 'supplier_name', 'name');
        if (!supplierName) {
            return failure(res, { message: 'Supplier_Name is required' }, 400);
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        const generated = await nextId(connection, 'Suppliers', 'Supplier_ID');
        locks.push(generated.lockName);
        await connection.query(`
            INSERT INTO Suppliers (Supplier_ID, Supplier_Name, Phone_Number, Email, Address)
            VALUES (?, ?, ?, ?, ?)
        `, [
            generated.id,
            supplierName,
            value(body, 'Phone_Number', 'phone_number', 'Contact_Phone', 'contact_phone') ?? null,
            value(body, 'Email', 'email') ?? null,
            value(body, 'Address', 'address') ?? null,
        ]);
        await connection.commit();
        transactionStarted = false;
        return success(res, { Supplier_ID: generated.id }, 201);
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        return failure(res, error, error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    } finally {
        if (connection) {
            try { await releaseIdLocks(connection, locks); } finally { connection.release(); }
        }
    }
}

async function createPurchaseOrder(req, res) {
    let connection;
    let transactionStarted = false;
    const locks = [];

    try {
        const body = req.body || {};
        const projectId = value(body, 'Project_ID', 'project_id');
        const supplierId = value(body, 'Supplier_ID', 'supplier_id');
        const items = body.items;
        if (!projectId || !supplierId || !Array.isArray(items) || items.length === 0) {
            return failure(res, { message: 'Project_ID, Supplier_ID, and at least one item are required' }, 400);
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const orderId = await nextId(connection, 'Purchase_Orders', 'Purchase_Order_ID');
        locks.push(orderId.lockName);
        const itemId = await nextId(connection, 'Purchase_Order_Items', 'Purchase_Order_Item');
        locks.push(itemId.lockName);

        const preparedItems = [];
        let totalAmount = 0;
        for (let index = 0; index < items.length; index += 1) {
            const item = items[index] || {};
            const materialId = value(item, 'Material_ID', 'material_id');
            const quantity = Number(value(item, 'Quantity', 'quantity'));
            let unitPriceValue = value(item, 'Unit_Price', 'unit_price');
            if (!materialId || !Number.isFinite(quantity) || quantity <= 0) {
                throw Object.assign(new Error(`Item ${index + 1} requires a Material_ID and positive Quantity`), { statusCode: 400 });
            }
            if (unitPriceValue === undefined) {
                const [materials] = await connection.query(
                    'SELECT Unit_Price FROM Materials WHERE Material_ID = ?',
                    [materialId]
                );
                if (!materials.length) {
                    throw Object.assign(new Error(`Material ${materialId} not found`), { statusCode: 400 });
                }
                unitPriceValue = materials[0].Unit_Price;
            }
            const unitPrice = Number(unitPriceValue);
            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                throw Object.assign(new Error(`Item ${index + 1} has an invalid Unit_Price`), { statusCode: 400 });
            }
            totalAmount += quantity * unitPrice;
            preparedItems.push({ materialId, quantity, unitPrice, itemId: itemId.id + index });
        }

        const status = value(body, 'Status', 'status') || 'Draft';
        await connection.query(`
            INSERT INTO Purchase_Orders (
                Purchase_Order_ID, Project_ID, Supplier_ID, Order_Date,
                Expected_Delivery_Date, Status, Total_Amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            orderId.id,
            projectId,
            supplierId,
            value(body, 'Order_Date', 'order_date') ?? new Date(),
            value(body, 'Expected_Delivery_Date', 'expected_delivery_date') ?? null,
            status,
            totalAmount,
        ]);

        for (const item of preparedItems) {
            await connection.query(`
                INSERT INTO Purchase_Order_Items (
                    Purchase_Order_Item, Purchase_Order_ID, Material_ID, Quantity, Unit_Price
                ) VALUES (?, ?, ?, ?, ?)
            `, [item.itemId, orderId.id, item.materialId, item.quantity, item.unitPrice]);
        }

        await connection.commit();
        transactionStarted = false;
        return success(res, {
            Purchase_Order_ID: orderId.id,
            Project_ID: projectId,
            Supplier_ID: supplierId,
            Order_Date: value(body, 'Order_Date', 'order_date') ?? new Date(),
            Expected_Delivery_Date: value(body, 'Expected_Delivery_Date', 'expected_delivery_date') ?? null,
            Status: status,
            Total_Amount: totalAmount,
            items: preparedItems.map(({ itemId: id, ...item }) => ({ Purchase_Order_Item: id, ...item })),
        }, 201);
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        const statusCode = error.statusCode || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);
        return failure(res, error, statusCode);
    } finally {
        if (connection) {
            try { await releaseIdLocks(connection, locks); } finally { connection.release(); }
        }
    }
}

module.exports = { getSuppliers, createSupplier, createPurchaseOrder };