const db = require('../config/db');

const PROJECT_STATUSES = ['Planning', 'In Progress', 'Completed', 'On Hold'];
const EXPENSE_CATEGORIES = ['Materials', 'Labor', 'Equipment', 'Misc'];
const EQUIPMENT_STATUSES = ['In Use', 'Maintenance', 'Available'];

function fail(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    throw error;
}

function required(value, name) {
    if (value === undefined || value === null || value === '') {
        fail(`${name} is required`);
    }
    return value;
}

function numberValue(value, name, { positive = false } = {}) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || (positive && number === 0)) {
        fail(`${name} must be a valid ${positive ? 'positive ' : ''}number`);
    }
    return number;
}

function field(body, pascalName, normalizedName) {
    return body[pascalName] !== undefined ? body[pascalName] : body[normalizedName];
}

function toDbProjectStatus(status) {
    return { Planning: 'Planned', 'In Progress': 'Active' }[status] || status;
}

function toApiProjectStatus(status) {
    return { Planned: 'Planning', Active: 'In Progress' }[status] || status;
}

function toDbExpenseCategory(category) {
    return { Labor: 'Labour', Misc: 'Other' }[category] || category;
}

function toApiExpenseCategory(category) {
    return { Labour: 'Labor', Other: 'Misc' }[category] || category;
}

function toApiEquipmentStatus(status) {
    return { Allocated: 'In Use' }[status] || status;
}

function projectRecord(row) {
    return {
        id: row.Project_ID,
        name: row.Project_Name,
        location: row.Location ?? row.Project_Location,
        allocated_budget: Number(row.Allocated_Budget ?? row.Project_Budget ?? 0),
        total_expenditure: Number(row.Total_Expenditure || row.Project_Total_Expenditure || 0),
        start_date: row.Start_Date,
        status: toApiProjectStatus(row.Status ?? row.Project_Status),
        created_at: row.Created_At || null,
        client: row.Client_Name || null,
    };
}

function expenseRecord(row) {
    return {
        id: row.Expense_ID,
        project_id: row.Project_ID,
        project_name: row.Project_Name || null,
        category: toApiExpenseCategory(row.Expense_Category),
        amount: Number(row.Amount || 0),
        description: row.Description,
        expense_date: row.Expense_Date,
        created_at: row.Created_At || null,
    };
}

async function listProjects(req, res, next) {
    try {
                const [rows] = await db.query(`
                        SELECT
                                Project_ID,
                                Project_Name,
                                Location,
                                Allocated_Budget,
                                Total_Expenditure,
                                Start_Date,
                                Status,
                                Created_At,
                                NULL AS Client_ID,
                                NULL AS Contractor_ID
                        FROM projects
                        ORDER BY Project_ID DESC
                `);
        res.json(rows.map(projectRecord));
    } catch (error) { next(error); }
}

async function getProject(req, res, next) {
    try {
        const [rows] = await db.query(`
            SELECT Project_ID, Project_Name, Location, Allocated_Budget,
                   Total_Expenditure, Start_Date, Status, Created_At,
                   NULL AS Client_ID, NULL AS Contractor_ID
            FROM projects
            WHERE Project_ID = ?
        `, [req.params.id]);
        if (!rows.length) return fail('Project not found', 404);
        res.json(projectRecord(rows[0]));
    } catch (error) { next(error); }
}

async function createProject(req, res, next) {
    try {
        const body = req.body || {};
        const name = required(field(body, 'Project_Name', 'name'), 'Project_Name');
        const budget = numberValue(required(field(body, 'Allocated_Budget', 'allocated_budget'), 'Allocated_Budget'));
        const status = field(body, 'Status', 'status') || 'Planning';
        if (!PROJECT_STATUSES.includes(status)) fail(`status must be one of: ${PROJECT_STATUSES.join(', ')}`);
        const [result] = await db.query(`
            INSERT INTO projects (Project_Name, Location, Allocated_Budget, Start_Date, Status)
            VALUES (?, ?, ?, ?, ?)
        `, [name, field(body, 'Location', 'location') || null, budget, field(body, 'Start_Date', 'start_date') || null, toDbProjectStatus(status)]);
        const [rows] = await db.query(`
                 SELECT Project_ID, Project_Name, Location, Allocated_Budget,
                     Total_Expenditure, Start_Date, Status, Created_At,
                     NULL AS Client_ID, NULL AS Contractor_ID
                 FROM projects WHERE Project_ID = ?
        `, [result.insertId]);
        res.status(201).json(projectRecord(rows[0]));
    } catch (error) { next(error); }
}

async function updateProject(req, res, next) {
    try {
        const body = req.body || {};
        const fields = [];
        const values = [];
        const mappings = { name: 'Project_Name', location: 'Location', start_date: 'Start_Date' };
        Object.entries(mappings).forEach(([key, column]) => {
            if (body[key] !== undefined) { fields.push(`${column} = ?`); values.push(body[key]); }
        });
        if (body.allocated_budget !== undefined) { fields.push('Allocated_Budget = ?'); values.push(numberValue(body.allocated_budget)); }
        if (body.status !== undefined) {
            if (!PROJECT_STATUSES.includes(body.status)) fail(`status must be one of: ${PROJECT_STATUSES.join(', ')}`);
            fields.push('Status = ?'); values.push(toDbProjectStatus(body.status));
        }
        if (!fields.length) fail('At least one project field is required');
        values.push(req.params.id);
        const [result] = await db.query(`UPDATE projects SET ${fields.join(', ')} WHERE Project_ID = ?`, values);
        if (!result.affectedRows) return fail('Project not found', 404);
        return getProject(req, res, next);
    } catch (error) { next(error); }
}

async function deleteProject(req, res, next) {
    try {
        const [result] = await db.query('DELETE FROM projects WHERE Project_ID = ?', [req.params.id]);
        if (!result.affectedRows) return fail('Project not found', 404);
        res.status(204).send();
    } catch (error) { next(error); }
}

async function listExpenses(req, res, next) {
    try {
        const [rows] = await db.query(`
                 SELECT e.Expense_ID, e.Project_ID, e.Expense_Date,
                     e.Category AS Expense_Category, e.Description, e.Amount,
                     p.Project_Name
            FROM expenses e
            LEFT JOIN projects p ON p.Project_ID = e.Project_ID
            ORDER BY e.Expense_Date DESC, e.Expense_ID DESC
        `);
        res.json(rows.map(expenseRecord));
    } catch (error) { next(error); }
}

async function createExpense(req, res, next) {
    const connection = await db.getConnection();
    try {
        const body = req.body || {};
        const projectId = required(field(body, 'Project_ID', 'project_id'), 'Project_ID');
        const category = required(field(body, 'Category', 'category'), 'Category');
        const amount = numberValue(required(field(body, 'Amount', 'amount'), 'Amount'), 'Amount', { positive: true });
        if (!EXPENSE_CATEGORIES.includes(category)) fail(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
        await connection.beginTransaction();
        const [projects] = await connection.query('SELECT Project_ID FROM projects WHERE Project_ID = ? FOR UPDATE', [projectId]);
        if (!projects.length) fail('Project not found', 404);
        const [result] = await connection.query(`
            INSERT INTO expenses (Project_ID, Expense_Date, Category, Description, Amount)
            VALUES (?, ?, ?, ?, ?)
        `, [projectId, field(body, 'Expense_Date', 'expense_date') || new Date(), toDbExpenseCategory(category), field(body, 'Description', 'description') || null, amount]);
        await connection.query('UPDATE projects SET Total_Expenditure = Total_Expenditure + ? WHERE Project_ID = ?', [amount, projectId]);
        await connection.commit();
        const [rows] = await db.query(`
            SELECT e.Expense_ID, e.Project_ID, e.Expense_Date,
                   e.Category AS Expense_Category, e.Description, e.Amount,
                   p.Project_Name
            FROM expenses e
            LEFT JOIN projects p ON p.Project_ID = e.Project_ID
            WHERE e.Expense_ID = ?
        `, [result.insertId]);
        res.status(201).json(expenseRecord(rows[0]));
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally { connection.release(); }
}

async function deleteExpense(req, res, next) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT Project_ID, Amount FROM expenses WHERE Expense_ID = ? FOR UPDATE', [req.params.id]);
        if (!rows.length) fail('Expense not found', 404);
        await connection.query('DELETE FROM expenses WHERE Expense_ID = ?', [req.params.id]);
        await connection.query('UPDATE projects SET Total_Expenditure = GREATEST(Total_Expenditure - ?, 0) WHERE Project_ID = ?', [rows[0].Amount, rows[0].Project_ID]);
        await connection.commit();
        res.status(204).send();
    } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
}

async function updateExpense(req, res, next) {
    const connection = await db.getConnection();
    try {
        const body = req.body || {};
        await connection.beginTransaction();
        const [existingRows] = await connection.query(`
            SELECT Expense_ID, Project_ID, Expense_Date, Category AS Expense_Category, Description, Amount
            FROM expenses WHERE Expense_ID = ? FOR UPDATE
        `, [req.params.id]);
        if (!existingRows.length) fail('Expense not found', 404);
        const existing = existingRows[0];
        const projectId = body.project_id === undefined ? existing.Project_ID : required(body.project_id, 'project_id');
        const category = body.category || toApiExpenseCategory(existing.Expense_Category);
        const amount = body.amount === undefined ? Number(existing.Amount) : numberValue(body.amount, 'amount', { positive: true });
        if (!EXPENSE_CATEGORIES.includes(category)) fail(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
        const [projectRows] = await connection.query('SELECT Project_ID FROM projects WHERE Project_ID = ? FOR UPDATE', [projectId]);
        if (!projectRows.length) fail('Project not found', 404);
        await connection.query(`UPDATE expenses SET Project_ID = ?, Expense_Date = ?, Category = ?, Description = ?, Amount = ? WHERE Expense_ID = ?`, [projectId, body.expense_date || existing.Expense_Date, toDbExpenseCategory(category), body.description === undefined ? existing.Description : body.description, amount, req.params.id]);
        await connection.query('UPDATE projects SET Total_Expenditure = Total_Expenditure - ? WHERE Project_ID = ?', [existing.Amount, existing.Project_ID]);
        await connection.query('UPDATE projects SET Total_Expenditure = Total_Expenditure + ? WHERE Project_ID = ?', [amount, projectId]);
        await connection.commit();
        const [rows] = await db.query(`
            SELECT e.Expense_ID, e.Project_ID, e.Expense_Date,
                   e.Category AS Expense_Category, e.Description, e.Amount,
                   p.Project_Name
            FROM expenses e
            LEFT JOIN projects p ON p.Project_ID = e.Project_ID
            WHERE e.Expense_ID = ?
        `, [req.params.id]);
        res.json(expenseRecord(rows[0]));
    } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
}

async function listSuppliers(req, res, next) {
    try {
        const [rows] = await db.query('SELECT Supplier_ID, Supplier_Name, Service_Type, Contact_Phone AS Phone_Number, Balance_Due FROM suppliers ORDER BY Supplier_ID DESC');
        res.json(rows.map((row) => ({ id: row.Supplier_ID, name: row.Supplier_Name, service_type: row.Service_Type || null, contact_phone: row.Phone_Number, balance_due: Number(row.Balance_Due || 0) })));
    } catch (error) { next(error); }
}

async function createSupplier(req, res, next) {
    try {
        const body = req.body || {};
        const name = required(field(body, 'Supplier_Name', 'name'), 'Supplier_Name');
        const balanceValue = field(body, 'Balance_Due', 'balance_due');
        const balance = balanceValue === undefined ? 0 : numberValue(balanceValue, 'Balance_Due');
        const serviceType = field(body, 'Service_Type', 'service_type');
        const phone = field(body, 'Contact_Phone', 'contact_phone');
        const [result] = await db.query('INSERT INTO suppliers (Supplier_Name, Service_Type, Contact_Phone, Balance_Due) VALUES (?, ?, ?, ?)', [name, serviceType || null, phone || null, balance]);
        res.status(201).json({ id: result.insertId, name, service_type: serviceType || null, contact_phone: phone || null, balance_due: balance });
    } catch (error) { next(error); }
}

async function deleteSupplier(req, res, next) {
    try { const [result] = await db.query('DELETE FROM suppliers WHERE Supplier_ID = ?', [req.params.id]); if (!result.affectedRows) return fail('Supplier not found', 404); res.status(204).send(); } catch (error) { next(error); }
}

async function updateSupplier(req, res, next) {
    try {
        const body = req.body || {};
        const fields = [];
        const values = [];
        if (body.name !== undefined) { fields.push('Supplier_Name = ?'); values.push(required(body.name, 'name')); }
        if (body.service_type !== undefined) { fields.push('Service_Type = ?'); values.push(body.service_type); }
        if (body.contact_phone !== undefined) { fields.push('Contact_Phone = ?'); values.push(body.contact_phone); }
        if (body.balance_due !== undefined) { fields.push('Balance_Due = ?'); values.push(numberValue(body.balance_due, 'balance_due')); }
        if (!fields.length) fail('At least one supplier field is required');
        values.push(req.params.id);
        const [result] = await db.query(`UPDATE suppliers SET ${fields.join(', ')} WHERE Supplier_ID = ?`, values);
        if (!result.affectedRows) return fail('Supplier not found', 404);
        const [rows] = await db.query('SELECT Supplier_ID, Supplier_Name, Service_Type, Contact_Phone AS Phone_Number, Balance_Due FROM suppliers WHERE Supplier_ID = ?', [req.params.id]);
        const row = rows[0];
        res.json({ id: row.Supplier_ID, name: row.Supplier_Name, service_type: row.Service_Type || null, contact_phone: row.Phone_Number, balance_due: Number(row.Balance_Due || 0) });
    } catch (error) { next(error); }
}

async function listEquipment(req, res, next) {
    try {
        const [rows] = await db.query('SELECT Equipment_ID, Equipment_Name, Status AS Availability_Status, Assigned_Project_ID, Created_At FROM equipments ORDER BY Equipment_ID DESC');
        res.json(rows.map((row) => ({ id: row.Equipment_ID, name: row.Equipment_Name, status: toApiEquipmentStatus(row.Availability_Status), assigned_project_id: row.Assigned_Project_ID, created_at: row.Created_At || null })));
    } catch (error) { next(error); }
}

async function createEquipment(req, res, next) {
    try {
        const body = req.body || {};
        const name = required(field(body, 'Equipment_Name', 'name'), 'Equipment_Name');
        const status = field(body, 'Status', 'status') || 'Available';
        const assignedProjectId = field(body, 'Assigned_Project_ID', 'assigned_project_id');
        if (!EQUIPMENT_STATUSES.includes(status)) fail(`status must be one of: ${EQUIPMENT_STATUSES.join(', ')}`);
        const [result] = await db.query('INSERT INTO equipments (Equipment_Name, Status, Assigned_Project_ID) VALUES (?, ?, ?)', [name, status === 'In Use' ? 'Allocated' : status, assignedProjectId || null]);
        res.status(201).json({ id: result.insertId, name, status, assigned_project_id: assignedProjectId || null });
    } catch (error) { next(error); }
}

async function deleteEquipment(req, res, next) {
    try { const [result] = await db.query('DELETE FROM equipments WHERE Equipment_ID = ?', [req.params.id]); if (!result.affectedRows) return fail('Equipment not found', 404); res.status(204).send(); } catch (error) { next(error); }
}

async function updateEquipment(req, res, next) {
    try {
        const body = req.body || {};
        const fields = [];
        const values = [];
        if (body.name !== undefined) { fields.push('Equipment_Name = ?'); values.push(required(body.name, 'name')); }
        if (body.status !== undefined) {
            if (!EQUIPMENT_STATUSES.includes(body.status)) fail(`status must be one of: ${EQUIPMENT_STATUSES.join(', ')}`);
            fields.push('Status = ?'); values.push(body.status === 'In Use' ? 'Allocated' : body.status);
        }
        if (body.assigned_project_id !== undefined) { fields.push('Assigned_Project_ID = ?'); values.push(body.assigned_project_id || null); }
        if (!fields.length) fail('At least one equipment field is required');
        values.push(req.params.id);
        const [result] = await db.query(`UPDATE equipments SET ${fields.join(', ')} WHERE Equipment_ID = ?`, values);
        if (!result.affectedRows) return fail('Equipment not found', 404);
        const [rows] = await db.query('SELECT Equipment_ID, Equipment_Name, Status AS Availability_Status, Assigned_Project_ID, Created_At FROM equipments WHERE Equipment_ID = ?', [req.params.id]);
        const row = rows[0];
        res.json({ id: row.Equipment_ID, name: row.Equipment_Name, status: toApiEquipmentStatus(row.Availability_Status), assigned_project_id: row.Assigned_Project_ID, created_at: row.Created_At || null });
    } catch (error) { next(error); }
}

async function listClients(req, res, next) {
    try {
        const [rows] = await db.query('SELECT Client_ID, Client_Name, Contact_Phone AS Phone_Number FROM clients ORDER BY Client_ID DESC');
        res.json(rows.map((row) => ({ id: row.Client_ID, name: row.Client_Name, contact_phone: row.Phone_Number })));
    } catch (error) { next(error); }
}

async function createClient(req, res, next) {
    try {
        const body = req.body || {};
        const name = required(field(body, 'Client_Name', 'name'), 'Client_Name');
        const phone = field(body, 'Contact_Phone', 'contact_phone');
        const [result] = await db.query('INSERT INTO clients (Client_Name, Contact_Phone) VALUES (?, ?)', [name, phone || null]);
        res.status(201).json({ id: result.insertId, name, contact_phone: phone || null });
    } catch (error) { next(error); }
}

async function listContractors(req, res, next) {
    try {
        const [rows] = await db.query('SELECT Contractor_ID, Contractor_Name, Contact_Phone AS Phone_Number FROM contractors ORDER BY Contractor_ID DESC');
        res.json(rows.map((row) => ({ id: row.Contractor_ID, name: row.Contractor_Name, contact_phone: row.Phone_Number })));
    } catch (error) { next(error); }
}

async function createContractor(req, res, next) {
    try {
        const body = req.body || {};
        const name = required(field(body, 'Contractor_Name', 'name'), 'Contractor_Name');
        const phone = field(body, 'Contact_Phone', 'contact_phone');
        const [result] = await db.query('INSERT INTO contractors (Contractor_Name, Contact_Phone) VALUES (?, ?)', [name, phone || null]);
        res.status(201).json({ id: result.insertId, name, contact_phone: phone || null });
    } catch (error) { next(error); }
}

async function updateClient(req, res, next) {
    try {
        const body = req.body || {};
        const fields = [];
        const values = [];
        if (body.name !== undefined) { fields.push('Client_Name = ?'); values.push(required(body.name, 'name')); }
        if (body.contact_phone !== undefined) { fields.push('Contact_Phone = ?'); values.push(body.contact_phone); }
        if (!fields.length) fail('At least one client field is required');
        values.push(req.params.id);
        const [result] = await db.query(`UPDATE clients SET ${fields.join(', ')} WHERE Client_ID = ?`, values);
        if (!result.affectedRows) return fail('Client not found', 404);
        const [rows] = await db.query('SELECT Client_ID, Client_Name, Contact_Phone AS Phone_Number FROM clients WHERE Client_ID = ?', [req.params.id]);
        const row = rows[0];
        res.json({ id: row.Client_ID, name: row.Client_Name, contact_phone: row.Phone_Number });
    } catch (error) { next(error); }
}

async function deleteClient(req, res, next) {
    try {
        const [result] = await db.query('DELETE FROM clients WHERE Client_ID = ?', [req.params.id]);
        if (!result.affectedRows) return fail('Client not found', 404);
        res.status(204).send();
    } catch (error) { next(error); }
}

async function updateContractor(req, res, next) {
    try {
        const body = req.body || {};
        const fields = [];
        const values = [];
        if (body.name !== undefined) { fields.push('Contractor_Name = ?'); values.push(required(body.name, 'name')); }
        if (body.contact_phone !== undefined) { fields.push('Contact_Phone = ?'); values.push(body.contact_phone); }
        if (!fields.length) fail('At least one contractor field is required');
        values.push(req.params.id);
        const [result] = await db.query(`UPDATE contractors SET ${fields.join(', ')} WHERE Contractor_ID = ?`, values);
        if (!result.affectedRows) return fail('Contractor not found', 404);
        const [rows] = await db.query('SELECT Contractor_ID, Contractor_Name, Contact_Phone AS Phone_Number FROM contractors WHERE Contractor_ID = ?', [req.params.id]);
        const row = rows[0];
        res.json({ id: row.Contractor_ID, name: row.Contractor_Name, contact_phone: row.Phone_Number });
    } catch (error) { next(error); }
}

async function deleteContractor(req, res, next) {
    try {
        const [result] = await db.query('DELETE FROM contractors WHERE Contractor_ID = ?', [req.params.id]);
        if (!result.affectedRows) return fail('Contractor not found', 404);
        res.status(204).send();
    } catch (error) { next(error); }
}

async function dashboardSummary(req, res, next) {
    try {
        const [rows] = await db.query(`
            SELECT
                COALESCE(SUM(p.Allocated_Budget), 0) AS totalAllocatedBudget,
                COALESCE((SELECT SUM(e.Amount) FROM expenses e), 0) AS totalExpenditure,
                COALESCE(SUM(p.Status = 'Active'), 0) AS activeProjectsCount
            FROM projects p
        `);
        res.json({ totalAllocatedBudget: Number(rows[0].totalAllocatedBudget), totalExpenditure: Number(rows[0].totalExpenditure), activeProjectsCount: Number(rows[0].activeProjectsCount || 0) });
    } catch (error) { next(error); }
}

async function budgetReport(req, res, next) {
    try {
        const [rows] = await db.query(`SELECT p.Project_ID AS project_id, p.Project_Name AS project_name, p.Allocated_Budget AS Project_Budget, COALESCE(SUM(e.Amount), 0) AS total_expenditure, p.Allocated_Budget - COALESCE(SUM(e.Amount), 0) AS variance FROM projects p LEFT JOIN expenses e ON e.Project_ID = p.Project_ID GROUP BY p.Project_ID, p.Project_Name, p.Allocated_Budget ORDER BY p.Project_ID`);
        res.json(rows.map((row) => ({ ...row, allocated_budget: Number(row.Project_Budget || 0), total_expenditure: Number(row.total_expenditure || 0), variance: Number(row.variance || 0) })));
    } catch (error) { next(error); }
}

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject, listExpenses, createExpense, updateExpense, deleteExpense, listSuppliers, createSupplier, updateSupplier, deleteSupplier, listEquipment, createEquipment, updateEquipment, deleteEquipment, listClients, createClient, updateClient, deleteClient, listContractors, createContractor, updateContractor, deleteContractor, dashboardSummary, budgetReport };
