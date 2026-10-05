const db = require('../config/db');

async function getEmployees(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT *
            FROM Employees
            ORDER BY Employee_ID
        `);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve employees.'
        });
    }
}

async function getEmployee(req, res) {
    try {
        const [employeeRows] = await db.query(`
            SELECT *
            FROM Employees
            WHERE Employee_ID = ?
        `, [req.params.id]);

        if (!employeeRows.length) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found.'
            });
        }

        const [projects] = await db.query(`
            SELECT
                pe.Project_Employee_ID,
                pe.Project_ID,
                p.Project_Name,
                pe.Assignment_Start_Date,
                pe.Assignment_End_Date,
                pe.Role,
                pe.Status
            FROM Project_Employees pe
            INNER JOIN Projects p
                ON p.Project_ID = pe.Project_ID
            WHERE pe.Employee_ID = ?
            ORDER BY pe.Project_Employee_ID
        `, [req.params.id]);

        res.json({
            success: true,
            data: {
                ...employeeRows[0],
                projects
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve employee.'
        });
    }
}

async function createEmployee(req, res) {
    try {
        const {
            Employee_Name,
            Phone_Number,
            Email,
            Job_Title,
            Address,
            Hire_Date
        } = req.body;

        if (!Employee_Name) {
            return res.status(400).json({
                success: false,
                message: 'Employee_Name is required.'
            });
        }

        const [[row]] = await db.query(`
            SELECT COALESCE(MAX(Employee_ID), 0) + 1 AS nextId
            FROM Employees
        `);

        await db.query(`
            INSERT INTO Employees
            (
                Employee_ID,
                Employee_Name,
                Phone_Number,
                Email,
                Job_Title,
                Address,
                Hire_Date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            row.nextId,
            Employee_Name,
            Phone_Number || null,
            Email || null,
            Job_Title || null,
            Address || null,
            Hire_Date || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Employee created successfully.',
            Employee_ID: row.nextId
        });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'An employee with this email already exists.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create employee.'
        });
    }
}

async function updateEmployee(req, res) {
    try {
        const {
            Employee_Name,
            Phone_Number,
            Email,
            Job_Title,
            Address,
            Hire_Date
        } = req.body;

        const [result] = await db.query(`
            UPDATE Employees
            SET
                Employee_Name = ?,
                Phone_Number = ?,
                Email = ?,
                Job_Title = ?,
                Address = ?,
                Hire_Date = ?
            WHERE Employee_ID = ?
        `, [
            Employee_Name,
            Phone_Number || null,
            Email || null,
            Job_Title || null,
            Address || null,
            Hire_Date || null,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found.'
            });
        }

        res.json({
            success: true,
            message: 'Employee updated successfully.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to update employee.'
        });
    }
}

async function deleteEmployee(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Employees
            WHERE Employee_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found.'
            });
        }

        res.json({
            success: true,
            message: 'Employee deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(409).json({
            success: false,
            message: 'Cannot delete this employee because they are linked to other records.'
        });
    }
}

module.exports = {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee
};