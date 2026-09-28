const db = require('../config/db');
const { nextId, releaseIdLocks, value, success, failure } = require('./dbHelpers');

async function getEmployees(req, res) {
    try {
        const [employees] = await db.query('SELECT * FROM Employees');
        return success(res, employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        return failure(res, error);
    }
}

async function createEmployee(req, res) {
    let connection;
    let transactionStarted = false;
    const locks = [];

    try {
        const body = req.body || {};
        const employeeName = value(body, 'Employee_Name', 'employee_name', 'name');
        if (!employeeName) {
            const error = new Error('Employee_Name is required');
            error.statusCode = 400;
            throw error;
        }

        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        const generated = await nextId(connection, 'Employees', 'Employee_ID');
        locks.push(generated.lockName);

        await connection.query(`
            INSERT INTO Employees (
                Employee_ID, Employee_Name, Phone_Number, Email, Job_Title, Address, Hire_Date
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            generated.id,
            employeeName,
            value(body, 'Phone_Number', 'phone_number', 'phone') ?? null,
            value(body, 'Email', 'email') ?? null,
            value(body, 'Job_Title', 'job_title', 'role') ?? null,
            value(body, 'Address', 'address') ?? null,
            value(body, 'Hire_Date', 'hire_date') ?? null,
        ]);

        const [employees] = await connection.query(
            'SELECT * FROM Employees WHERE Employee_ID = ?',
            [generated.id]
        );
        await connection.commit();
        transactionStarted = false;
        return success(res, employees[0], 201);
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        console.error('Error creating employee:', error);
        return failure(res, error, error.statusCode || (error.code === 'ER_DUP_ENTRY' ? 409 : 500));
    } finally {
        if (connection) {
            try { await releaseIdLocks(connection, locks); } finally { connection.release(); }
        }
    }
}

async function updateEmployee(req, res) {
    const fields = [
        ['Employee_Name', ['Employee_Name', 'employee_name', 'name']],
        ['Phone_Number', ['Phone_Number', 'phone_number', 'phone']],
        ['Email', ['Email', 'email']],
        ['Job_Title', ['Job_Title', 'job_title', 'role']],
        ['Address', ['Address', 'address']],
        ['Hire_Date', ['Hire_Date', 'hire_date']],
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
        if (!updates.length) return failure(res, { message: 'At least one employee field is required' }, 400);

        params.push(req.params.id);
        const [result] = await db.query(`UPDATE Employees SET ${updates.join(', ')} WHERE Employee_ID = ?`, params);
        if (!result.affectedRows) {
            const [existing] = await db.query('SELECT Employee_ID FROM Employees WHERE Employee_ID = ?', [req.params.id]);
            if (!existing.length) return failure(res, { message: 'Employee not found' }, 404);
        }
        const [rows] = await db.query('SELECT * FROM Employees WHERE Employee_ID = ?', [req.params.id]);
        return success(res, rows[0]);
    } catch (error) {
        console.error('Error updating employee:', error);
        return failure(res, error, error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    }
}

async function deleteEmployee(req, res) {
    try {
        const [result] = await db.query('DELETE FROM Employees WHERE Employee_ID = ?', [req.params.id]);
        if (!result.affectedRows) return failure(res, { message: 'Employee not found' }, 404);
        return success(res, { Employee_ID: Number(req.params.id) });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return failure(res, error, error.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500);
    }
}

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };