const db = require('../config/db');

async function getDashboard(req, res) {
    try {
        const [[projects]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Projects
        `);

        const [[activeProjects]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Projects
            WHERE Project_Status = 'Active'
        `);

        const [[completedProjects]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Projects
            WHERE Project_Status = 'Completed'
        `);

        const [[employees]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Employees
        `);

        const [[clients]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Clients
        `);

        const [[suppliers]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Suppliers
        `);

        const [[equipment]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Equipments
        `);

        const [[expenses]] = await db.query(`
            SELECT COALESCE(SUM(Amount), 0) AS total
            FROM Project_Expenses
        `);

        const [[payments]] = await db.query(`
            SELECT COALESCE(SUM(Amount), 0) AS total
            FROM Payments
        `);

        const [[budget]] = await db.query(`
            SELECT COALESCE(SUM(Project_Budget), 0) AS total
            FROM Projects
        `);

        const [[lowStock]] = await db.query(`
            SELECT COUNT(*) AS total
            FROM Materials
            WHERE Stock_Quantity <= Reorder_Level
        `);

        res.json({
            success: true,
            data: {
                total_projects: projects.total,
                active_projects: activeProjects.total,
                completed_projects: completedProjects.total,
                total_employees: employees.total,
                total_clients: clients.total,
                total_suppliers: suppliers.total,
                total_equipment: equipment.total,
                total_expenses: expenses.total,
                total_payments: payments.total,
                total_project_budget: budget.total,
                low_stock_materials: lowStock.total
            }
        });
    } catch (error) {
        console.error('DASHBOARD ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard information.'
        });
    }
}

async function getProjectSummary(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                p.Project_ID,
                p.Project_Name,
                c.Client_Name,
                con.Contractor_Name,
                e.Employee_Name AS Project_Manager_Name,
                p.Project_Status,
                p.Project_Budget,
                COALESCE(expenses.Total_Expenses, 0) AS Total_Expenses,
                p.Project_Budget - COALESCE(expenses.Total_Expenses, 0) AS Remaining_Budget
            FROM Projects p
            LEFT JOIN Clients c ON c.Client_ID = p.Client_ID
            LEFT JOIN Contractors con ON con.Contractor_ID = p.Contractor_ID
            LEFT JOIN Employees e ON e.Employee_ID = p.Project_Manager_ID
            LEFT JOIN (
                SELECT Project_ID, SUM(Amount) AS Total_Expenses
                FROM Project_Expenses
                GROUP BY Project_ID
            ) expenses ON expenses.Project_ID = p.Project_ID
            ORDER BY p.Project_ID
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve project summary.'
        });
    }
}

async function getLowStock(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                Material_ID,
                Material_Name,
                Unit,
                Unit_Price,
                Stock_Quantity,
                Reorder_Level,
                (Reorder_Level - Stock_Quantity) AS Quantity_Needed
            FROM Materials
            WHERE Stock_Quantity <= Reorder_Level
            ORDER BY Stock_Quantity ASC
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve low-stock report.'
        });
    }
}

async function getEquipmentStatus(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                Availability_Status,
                COUNT(*) AS Total
            FROM Equipments
            GROUP BY Availability_Status
            ORDER BY Availability_Status
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve equipment report.'
        });
    }
}

async function getSupplierActivity(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                s.Supplier_ID,
                s.Supplier_Name,
                COALESCE(orders.Purchase_Orders, 0) AS Purchase_Orders,
                COALESCE(orders.Ordered_Value, 0) AS Ordered_Value,
                COALESCE(deliveries.Deliveries, 0) AS Deliveries,
                COALESCE(payments.Paid_Value, 0) AS Paid_Value
            FROM Suppliers s
            LEFT JOIN (
                SELECT Supplier_ID, COUNT(*) AS Purchase_Orders, SUM(Total_Amount) AS Ordered_Value
                FROM Purchase_Orders
                GROUP BY Supplier_ID
            ) orders ON orders.Supplier_ID = s.Supplier_ID
            LEFT JOIN (
                SELECT po.Supplier_ID, COUNT(DISTINCT d.Delivery_ID) AS Deliveries
                FROM Purchase_Orders po
                LEFT JOIN Deliveries d ON d.Purchase_Order_ID = po.Purchase_Order_ID
                GROUP BY po.Supplier_ID
            ) deliveries ON deliveries.Supplier_ID = s.Supplier_ID
            LEFT JOIN (
                SELECT Supplier_ID, SUM(Amount) AS Paid_Value
                FROM Payments
                GROUP BY Supplier_ID
            ) payments ON payments.Supplier_ID = s.Supplier_ID
            ORDER BY s.Supplier_ID
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve supplier activity.'
        });
    }
}

async function getEmployeeProjects(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                e.Employee_ID,
                e.Employee_Name,
                e.Job_Title,
                pe.Project_Employee_ID,
                p.Project_ID,
                p.Project_Name,
                pe.Role,
                pe.Status AS Assignment_Status,
                pe.Assignment_Start_Date,
                pe.Assignment_End_Date
            FROM Employees e
            LEFT JOIN Project_Employees pe
                ON pe.Employee_ID = e.Employee_ID
            LEFT JOIN Projects p ON p.Project_ID = pe.Project_ID
            ORDER BY e.Employee_Name, p.Project_Name
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve employee project report.'
        });
    }
}

module.exports = {
    getDashboard,
    getProjectSummary,
    getLowStock,
    getEquipmentStatus,
    getSupplierActivity,
    getEmployeeProjects
};