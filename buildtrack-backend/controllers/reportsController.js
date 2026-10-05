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
                p.Project_Status,
                p.Project_Budget,
                COALESCE(SUM(pe.Amount), 0) AS Total_Expenses,
                (
                    p.Project_Budget -
                    COALESCE(SUM(pe.Amount), 0)
                ) AS Remaining_Budget
            FROM Projects p
            LEFT JOIN Project_Expenses pe
                ON pe.Project_ID = p.Project_ID
            GROUP BY
                p.Project_ID,
                p.Project_Name,
                p.Project_Status,
                p.Project_Budget
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
                COUNT(DISTINCT po.Purchase_Order_ID) AS Purchase_Orders,
                COALESCE(SUM(po.Total_Amount), 0) AS Ordered_Value,
                COALESCE(SUM(pay.Amount), 0) AS Paid_Value
            FROM Suppliers s
            LEFT JOIN Purchase_Orders po
                ON po.Supplier_ID = s.Supplier_ID
            LEFT JOIN Payments pay
                ON pay.Supplier_ID = s.Supplier_ID
            GROUP BY
                s.Supplier_ID,
                s.Supplier_Name
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
                COUNT(pe.Project_Employee_ID) AS Project_Count
            FROM Employees e
            LEFT JOIN Project_Employees pe
                ON pe.Employee_ID = e.Employee_ID
            GROUP BY
                e.Employee_ID,
                e.Employee_Name,
                e.Job_Title
            ORDER BY Project_Count DESC
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