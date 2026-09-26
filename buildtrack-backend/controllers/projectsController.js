const db = require('../config/db');
const { nextId, releaseIdLocks, value, success, failure } = require('./dbHelpers');

async function getProjects(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT p.Project_ID, p.Client_ID, p.Contractor_ID, p.Project_Manager_ID,
                   p.Project_Name, p.Project_Description, p.Start_Date,
                   p.Expected_End_Date, p.Actual_End_Date, p.Project_Status,
                   p.Project_Budget, c.Client_Name, con.Contractor_Name,
                   e.Employee_Name AS Project_Manager_Name
            FROM Projects p
            LEFT JOIN Clients c ON c.Client_ID = p.Client_ID
            LEFT JOIN Contractors con ON con.Contractor_ID = p.Contractor_ID
            LEFT JOIN Employees e ON e.Employee_ID = p.Project_Manager_ID
            ORDER BY p.Project_ID
        `);
        return success(res, rows);
    } catch (error) {
        return failure(res, error);
    }
}

async function getProject(req, res) {
    try {
        const [projects] = await db.query(`
            SELECT p.Project_ID, p.Client_ID, p.Contractor_ID, p.Project_Manager_ID,
                   p.Project_Name, p.Project_Description, p.Start_Date,
                   p.Expected_End_Date, p.Actual_End_Date, p.Project_Status,
                   p.Project_Budget, c.Client_Name, con.Contractor_Name,
                   e.Employee_Name AS Project_Manager_Name
            FROM Projects p
            LEFT JOIN Clients c ON c.Client_ID = p.Client_ID
            LEFT JOIN Contractors con ON con.Contractor_ID = p.Contractor_ID
            LEFT JOIN Employees e ON e.Employee_ID = p.Project_Manager_ID
            WHERE p.Project_ID = ?
        `, [req.params.id]);

        if (!projects.length) {
            return failure(res, { message: 'Project not found' }, 404);
        }

        const [employees] = await db.query(`
            SELECT pe.Project_Employee_ID, pe.Employee_ID, e.Employee_Name,
                   pe.Assignment_Start_Date, pe.Assignment_End_Date, pe.Role, pe.Status
            FROM Project_Employees pe
            INNER JOIN Employees e ON e.Employee_ID = pe.Employee_ID
            WHERE pe.Project_ID = ?
            ORDER BY pe.Project_Employee_ID
        `, [req.params.id]);

        return success(res, { ...projects[0], employees });
    } catch (error) {
        return failure(res, error);
    }
}

async function createProject(req, res) {
    let connection;
    let transactionStarted = false;
    const locks = [];

    try {
        const body = req.body || {};
        const projectName = value(body, 'Project_Name', 'project_name', 'name');
        if (!projectName) {
            return failure(res, { message: 'Project_Name is required' }, 400);
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        const generated = await nextId(connection, 'Projects', 'Project_ID');
        locks.push(generated.lockName);

        await connection.query(`
            INSERT INTO Projects (
                Project_ID, Client_ID, Contractor_ID, Project_Manager_ID,
                Project_Name, Project_Description, Start_Date, Expected_End_Date,
                Actual_End_Date, Project_Status, Project_Budget
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            generated.id,
            value(body, 'Client_ID', 'client_id') ?? null,
            value(body, 'Contractor_ID', 'contractor_id') ?? null,
            value(body, 'Project_Manager_ID', 'project_manager_id') ?? null,
            projectName,
            value(body, 'Project_Description', 'project_description', 'description') ?? null,
            value(body, 'Start_Date', 'start_date') ?? null,
            value(body, 'Expected_End_Date', 'expected_end_date') ?? null,
            value(body, 'Actual_End_Date', 'actual_end_date') ?? null,
            value(body, 'Project_Status', 'project_status', 'status') || 'Planned',
            value(body, 'Project_Budget', 'project_budget', 'budget') ?? null,
        ]);

        await connection.commit();
        transactionStarted = false;
        return success(res, { Project_ID: generated.id }, 201);
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        return failure(res, error, error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    } finally {
        if (connection) {
            try { await releaseIdLocks(connection, locks); } finally { connection.release(); }
        }
    }
}

async function updateProject(req, res) {
    const fields = [
        ['Client_ID', ['Client_ID', 'client_id']],
        ['Contractor_ID', ['Contractor_ID', 'contractor_id']],
        ['Project_Manager_ID', ['Project_Manager_ID', 'project_manager_id']],
        ['Project_Name', ['Project_Name', 'project_name', 'name']],
        ['Project_Description', ['Project_Description', 'project_description', 'description']],
        ['Start_Date', ['Start_Date', 'start_date']],
        ['Expected_End_Date', ['Expected_End_Date', 'expected_end_date']],
        ['Actual_End_Date', ['Actual_End_Date', 'actual_end_date']],
        ['Project_Status', ['Project_Status', 'project_status', 'status']],
        ['Project_Budget', ['Project_Budget', 'project_budget', 'budget']],
    ];

    try {
        const body = req.body || {};
        const updates = [];
        const params = [];

        for (const [column, keys] of fields) {
            const fieldValue = value(body, ...keys);
            if (fieldValue !== undefined) {
                updates.push(`${column} = ?`);
                params.push(fieldValue);
            }
        }

        if (!updates.length) {
            return failure(res, { message: 'At least one project field is required' }, 400);
        }

        params.push(req.params.id);
        const [result] = await db.query(
            `UPDATE Projects SET ${updates.join(', ')} WHERE Project_ID = ?`,
            params
        );
        if (!result.affectedRows) {
            const [rows] = await db.query('SELECT Project_ID FROM Projects WHERE Project_ID = ?', [req.params.id]);
            if (!rows.length) return failure(res, { message: 'Project not found' }, 404);
        }

        const [rows] = await db.query(
            'SELECT * FROM Projects WHERE Project_ID = ?',
            [req.params.id]
        );
        return success(res, rows[0]);
    } catch (error) {
        return failure(res, error, error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    }
}

module.exports = { getProjects, getProject, createProject, updateProject };