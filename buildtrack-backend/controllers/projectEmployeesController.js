const db = require('../config/db');

async function getProjectEmployees(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                pe.Project_Employee_ID,
                pe.Project_ID,
                p.Project_Name,
                pe.Employee_ID,
                e.Employee_Name,
                e.Job_Title,
                pe.Assignment_Start_Date,
                pe.Assignment_End_Date,
                pe.Role,
                pe.Status
            FROM Project_Employees pe
            INNER JOIN Projects p
                ON p.Project_ID = pe.Project_ID
            INNER JOIN Employees e
                ON e.Employee_ID = pe.Employee_ID
            ORDER BY pe.Project_Employee_ID
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve project employees.'
        });
    }
}

async function getEmployeesForProject(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                pe.Project_Employee_ID,
                pe.Employee_ID,
                e.Employee_Name,
                e.Job_Title,
                e.Phone_Number,
                e.Email,
                pe.Assignment_Start_Date,
                pe.Assignment_End_Date,
                pe.Role,
                pe.Status
            FROM Project_Employees pe
            INNER JOIN Employees e
                ON e.Employee_ID = pe.Employee_ID
            WHERE pe.Project_ID = ?
            ORDER BY pe.Project_Employee_ID
        `, [req.params.projectId]);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve project employees.'
        });
    }
}

async function assignEmployee(req, res) {
    try {
        const {
            Employee_ID,
            Assignment_Start_Date,
            Assignment_End_Date,
            Role,
            Status
        } = req.body;

        if (!Employee_ID || !Assignment_Start_Date) {
            return res.status(400).json({
                success: false,
                message: 'Employee_ID and Assignment_Start_Date are required.'
            });
        }

        const [[idRow]] = await db.query(`
            SELECT COALESCE(MAX(Project_Employee_ID), 0) + 1 AS nextId
            FROM Project_Employees
        `);

        await db.query(`
            INSERT INTO Project_Employees
            (
                Project_Employee_ID,
                Project_ID,
                Employee_ID,
                Assignment_Start_Date,
                Assignment_End_Date,
                Role,
                Status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            idRow.nextId,
            req.params.projectId,
            Employee_ID,
            Assignment_Start_Date,
            Assignment_End_Date || null,
            Role || null,
            Status || 'Active'
        ]);

        res.status(201).json({
            success: true,
            message: 'Employee assigned to project successfully.',
            Project_Employee_ID: idRow.nextId
        });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'This employee is already assigned to this project.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to assign employee.'
        });
    }
}

async function updateAssignment(req, res) {
    try {
        const {
            Assignment_Start_Date,
            Assignment_End_Date,
            Role,
            Status
        } = req.body;

        const [result] = await db.query(`
            UPDATE Project_Employees
            SET
                Assignment_Start_Date = ?,
                Assignment_End_Date = ?,
                Role = ?,
                Status = ?
            WHERE Project_Employee_ID = ?
        `, [
            Assignment_Start_Date,
            Assignment_End_Date || null,
            Role || null,
            Status,
            req.params.id
        ]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Project employee assignment not found.'
            });
        }

        res.json({
            success: true,
            message: 'Project employee assignment updated successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to update assignment.'
        });
    }
}

async function removeEmployee(req, res) {
    try {
        const [result] = await db.query(`
            DELETE FROM Project_Employees
            WHERE Project_Employee_ID = ?
        `, [req.params.id]);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found.'
            });
        }

        res.json({
            success: true,
            message: 'Employee removed from project successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to remove employee from project.'
        });
    }
}

module.exports = {
    getProjectEmployees,
    getEmployeesForProject,
    assignEmployee,
    updateAssignment,
    removeEmployee
};