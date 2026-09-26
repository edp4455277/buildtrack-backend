import { useEffect, useState } from 'react';
import {
  Building2, FileText, LayoutGrid, Pencil, Plus, Receipt, Trash2, Truck, Users, Wrench, X,
} from 'lucide-react';
import { api, apiError, recordValue } from '../api';
import {
  getEquipment,
  getExpenses,
  getExpenditureReport,
  getProjects,
  getSupplierBalancesReport,
  getSuppliers,
} from '../services/api';

const resources = {
  projects: { label: 'Projects', icon: Building2, endpoint: '/projects', title: 'Projects Directory', fields: [
    { name: 'name', label: 'Project name', required: true },
    { name: 'location', label: 'Location' },
    { name: 'allocated_budget', label: 'Allocated budget', type: 'number', required: true },
    { name: 'start_date', label: 'Start date', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: ['Planning', 'In Progress', 'Completed', 'On Hold'] },
  ] },
  expenses: { label: 'Expenses', icon: Receipt, endpoint: '/expenses', title: 'Expense Ledger', fields: [
    { name: 'project_id', label: 'Project', type: 'project', required: true },
    { name: 'category', label: 'Category', type: 'select', options: ['Materials', 'Labor', 'Equipment', 'Misc'] },
    { name: 'amount', label: 'Amount', type: 'number', required: true },
    { name: 'description', label: 'Description' },
    { name: 'expense_date', label: 'Expense date', type: 'date', required: true },
  ] },
  suppliers: { label: 'Suppliers', icon: Truck, endpoint: '/suppliers', title: 'Supplier Management', fields: [
    { name: 'name', label: 'Supplier name', required: true },
    { name: 'service_type', label: 'Service type' },
    { name: 'contact_phone', label: 'Contact phone' },
    { name: 'balance_due', label: 'Balance due', type: 'number' },
  ] },
  contractors: { label: 'Contractors', icon: Users, endpoint: '/contractors', title: 'Contractor Directory', fields: [
    { name: 'name', label: 'Contractor name', required: true },
    { name: 'contact_phone', label: 'Contact phone' },
  ] },
  equipments: { label: 'Equipment', icon: Wrench, endpoint: '/equipment', title: 'Equipment Tracking', fields: [
    { name: 'name', label: 'Equipment name', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['Available', 'In Use', 'Maintenance'] },
    { name: 'assigned_project_id', label: 'Assigned project', type: 'project' },
  ] },
  clients: { label: 'Clients', icon: Users, endpoint: '/clients', title: 'Client Directory', fields: [
    { name: 'name', label: 'Client name', required: true },
    { name: 'contact_phone', label: 'Contact phone' },
  ] },
};

const initialForms = Object.fromEntries(Object.entries(resources).map(([key, resource]) => [key, Object.fromEntries(resource.fields.map((field) => [field.name, field.options?.[0] || '']))]));
const money = (value) => `ZMW ${Number(value || 0).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const resourceLoaders = {
  projects: getProjects,
  expenses: getExpenses,
  suppliers: getSuppliers,
  equipments: getEquipment,
};

async function loadResource(resourceKey, endpoint) {
  const load = resourceLoaders[resourceKey];
  if (load) return load();

  const response = await api.get(endpoint);
  return response.data?.data ?? response.data;
}

function BuildTrackApp() {
  const [activePage, setActivePage] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadDashboardData = async () => {
      setDashboardLoading(true);
      setDashboardError('');
      try {
        const [projectRows, expenseRows] = await Promise.all([getProjects(), getExpenses()]);
        if (ignore) return;
        setProjects(Array.isArray(projectRows) ? projectRows : []);
        setExpenses(Array.isArray(expenseRows) ? expenseRows : []);
      } catch (error) {
        if (!ignore) setDashboardError(error.message || apiError(error));
      } finally {
        if (!ignore) setDashboardLoading(false);
      }
    };
    loadDashboardData();

    return () => {
      ignore = true;
    };
  }, []);

  const openCreate = (page) => setActivePage(page);

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#1a3832]">
      <header className="bg-[#1a3832] px-5 py-5 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b9d3cc]">BuildTrack Management</p><p className="mt-1 text-sm text-white/75">Construction operations workspace</p></div><button type="button" onClick={() => openCreate('projects')} className="inline-flex items-center gap-2 rounded-lg bg-[#d6e8d5] px-4 py-3 text-sm font-bold text-[#1a3832]"><Plus size={17} /> New project</button></div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden min-h-[calc(100vh-82px)] w-64 shrink-0 bg-[#1a3832] p-5 text-white lg:block"><p className="mb-7 border-b border-white/15 pb-6 text-lg font-bold">BuildTrack Admin</p><nav className="space-y-1" aria-label="Main navigation"><NavButton active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon={LayoutGrid}>Dashboard</NavButton>{Object.entries(resources).map(([key, resource]) => <NavButton key={key} active={activePage === key} onClick={() => setActivePage(key)} icon={resource.icon}>{resource.label}</NavButton>)}<NavButton active={activePage === 'reports'} onClick={() => setActivePage('reports')} icon={FileText}>Reports</NavButton></nav></aside>
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12">
          {activePage === 'dashboard' && <DashboardPage projects={projects} expenses={expenses} loading={dashboardLoading} error={dashboardError} onAction={openCreate} />}
          {activePage === 'reports' && <ReportsPage />}
          {activePage !== 'dashboard' && activePage !== 'reports' && <ResourcePage resourceKey={activePage} projects={projects} onProjectsChange={setProjects} onExpensesChange={setExpenses} />}
        </main>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, children }) { return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${active ? 'bg-white text-[#1a3832]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}><Icon size={18} /><span>{children}</span></button>; }

function DashboardPage({ projects, expenses, loading, error, onAction }) {
  const budget = projects.reduce((sum, project) => sum + Number(recordValue(project, 'allocated_budget', 'Project_Budget') || 0), 0);
  const spending = expenses.reduce((sum, expense) => sum + Number(recordValue(expense, 'amount', 'Amount') || 0), 0);
  return <div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1d6d78]">Overview</p><h1 className="text-3xl font-bold sm:text-4xl">Dashboard Overview</h1><p className="mt-2 text-sm text-slate-500">Live project, expense, and budget summary</p></div><button type="button" onClick={() => onAction('projects')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1d6d78] px-4 py-3 text-sm font-bold text-white"><Plus size={17} /> Create New Project</button></div>{error && <Alert message={error} />}{!loading && !error && !projects.length && !expenses.length && <p className="mb-5 text-sm text-slate-500">No dashboard data is available yet.</p>}<section className="grid gap-4 md:grid-cols-3"><Metric value={money(budget)} label="Allocated budget" /><Metric value={money(spending)} label="Total expenditure" /><Metric value={projects.length} label="Projects" /></section><section className="mt-8 rounded-xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Quick Actions</h2><div className="mt-5 flex flex-wrap gap-3"><ActionButton onClick={() => onAction('projects')}><Plus size={17} /> Create New Project</ActionButton><ActionButton onClick={() => onAction('expenses')}><Receipt size={17} /> Record Expense</ActionButton><ActionButton onClick={() => onAction('reports')}><FileText size={17} /> Generate Budget Report</ActionButton><ActionButton onClick={() => onAction('suppliers')}><Truck size={17} /> Add Supplier</ActionButton><ActionButton onClick={() => onAction('equipments')}><Wrench size={17} /> Assign Equipment</ActionButton></div>{loading && <p className="mt-5 text-xs text-slate-400">Loading live data...</p>}</section></div>;
}

function ResourcePage({ resourceKey, projects, onProjectsChange, onExpensesChange }) {
  const resource = resources[resourceKey];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(initialForms[resourceKey]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadRecords = async () => {
      setLoading(true);
      setError('');
      try {
        const rows = await loadResource(resourceKey, resource.endpoint);
        if (!ignore) setRecords(Array.isArray(rows) ? rows : []);
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || apiError(requestError));
          setRecords([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadRecords();

    return () => {
      ignore = true;
    };
  }, [resource.endpoint, resourceKey]);

  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setError('');
    const payload = { ...form };
    ['allocated_budget', 'amount', 'balance_due'].forEach((key) => { if (payload[key] !== '') payload[key] = parseFloat(payload[key]); });
    if (payload.project_id !== '') payload.project_id = parseInt(payload.project_id, 10);
    if (payload.assigned_project_id === '') payload.assigned_project_id = null;
    if (payload.assigned_project_id !== null) payload.assigned_project_id = parseInt(payload.assigned_project_id, 10);
    try {
      if (editingRecord) {
        await api.put(`${resource.endpoint}/${getRecordId(editingRecord)}`, payload);
      } else {
        await api.post(resource.endpoint, payload);
      }
      const refreshedRows = await loadResource(resourceKey, resource.endpoint);
      const nextRecords = Array.isArray(refreshedRows) ? refreshedRows : [];
      setRecords(nextRecords);
      if (resourceKey === 'projects') onProjectsChange(nextRecords);
      if (resourceKey === 'expenses') onExpensesChange(nextRecords);
      setError(''); setModalOpen(false); setEditingRecord(null); setForm(initialForms[resourceKey]);
    } catch (requestError) { setError(apiError(requestError)); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await api.delete(`${resource.endpoint}/${id}`);
      const refreshedRows = await loadResource(resourceKey, resource.endpoint);
      const nextRecords = Array.isArray(refreshedRows) ? refreshedRows : [];
      setRecords(nextRecords);
      if (resourceKey === 'projects') onProjectsChange(nextRecords);
      if (resourceKey === 'expenses') onExpensesChange(nextRecords);
    } catch (requestError) { setError(apiError(requestError)); }
  };

  const handleEdit = (item) => {
    setEditingRecord(item);
    setForm(formFromRecord(resourceKey, item));
    setError('');
    setModalOpen(true);
  };

  return <div className="mx-auto max-w-6xl"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1d6d78]">Operations</p><h1 className="text-3xl font-bold">{resource.title}</h1></div><button type="button" onClick={() => { setEditingRecord(null); setForm(initialForms[resourceKey]); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#1d6d78] px-4 py-3 text-sm font-bold text-white"><Plus size={17} /> Add {resource.label.slice(0, -1)}</button></div>{error && <Alert message={error} />}{loading ? <p className="text-sm text-slate-500">Loading {resource.label.toLowerCase()}...</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{records.map((record, index) => <RecordCard key={getRecordId(record) || index} resourceKey={resourceKey} record={record} onEdit={handleEdit} onDelete={handleDelete} />)}{!records.length && <p className="text-sm text-slate-500">No records found.</p>}</div>}{modalOpen && <ResourceModal resource={resource} projects={projects} form={form} setForm={setForm} editing={Boolean(editingRecord)} onClose={() => { setModalOpen(false); setEditingRecord(null); }} onSubmit={submit} submitting={submitting} />}</div>;
}

function getRecordId(record) { return recordValue(record, 'id', 'Project_ID', 'Expense_ID', 'Supplier_ID', 'Contractor_ID', 'Equipment_ID', 'Client_ID'); }

function formFromRecord(resourceKey, record) {
  const form = { ...initialForms[resourceKey] };
  resources[resourceKey].fields.forEach((field) => {
    const aliases = { name: ['name', 'Project_Name', 'Supplier_Name', 'Contractor_Name', 'Equipment_Name', 'Client_Name'], location: ['location', 'Location'], allocated_budget: ['allocated_budget', 'Allocated_Budget', 'Project_Budget'], start_date: ['start_date', 'Start_Date'], status: ['status', 'Status', 'Project_Status', 'Availability_Status'], project_id: ['project_id', 'Project_ID'], category: ['category', 'Category', 'Expense_Category'], amount: ['amount', 'Amount'], description: ['description', 'Description'], expense_date: ['expense_date', 'Expense_Date'], service_type: ['service_type', 'Service_Type'], contact_phone: ['contact_phone', 'Phone_Number'], balance_due: ['balance_due', 'Balance_Due'], assigned_project_id: ['assigned_project_id', 'Assigned_Project_ID'] };
    form[field.name] = recordValue(record, ...(aliases[field.name] || [field.name])) ?? '';
  });
  return form;
}

function RecordCard({ resourceKey, record, onEdit, onDelete }) { const name = recordValue(record, 'name', 'Project_Name', 'Supplier_Name', 'Contractor_Name', 'Equipment_Name', 'Client_Name') || 'Unnamed record'; const id = getRecordId(record); const detail = resourceKey === 'expenses' ? `${recordValue(record, 'category', 'Expense_Category') || 'Expense'} · ${money(recordValue(record, 'amount', 'Amount'))}` : resourceKey === 'projects' ? money(recordValue(record, 'allocated_budget', 'Project_Budget')) : recordValue(record, 'status', 'Status', 'Availability_Status', 'service_type', 'Service_Type') || recordValue(record, 'contact_phone', 'Phone_Number') || 'Active record'; return <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d6d78]">#{id ?? 'new'}</p><h2 className="mt-2 font-bold">{name}</h2><p className="mt-2 text-sm text-slate-500">{detail}</p></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => onEdit(record)} className="rounded-lg p-2 text-[#1d6d78] hover:bg-[#e8f1ef]" aria-label={`Edit ${name}`} title="Edit"><Pencil size={16} /></button><button type="button" onClick={() => onDelete(id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${name}`} title="Delete"><Trash2 size={16} /></button></div></div></article>; }

function ResourceModal({ resource, projects, form, setForm, editing, onClose, onSubmit, submitting }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10241f]/70 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold">{editing ? 'Edit' : 'Add'} {resource.label.slice(0, -1)}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div><form onSubmit={onSubmit} className="space-y-4">{resource.fields.map((field) => <FormField key={field.name} field={field} value={form[field.name]} projects={projects} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />)}<div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="rounded-lg border border-[#1a3832] px-4 py-3 text-sm font-bold">Cancel</button><button type="submit" disabled={submitting} className="rounded-lg bg-[#1d6d78] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{submitting ? 'Saving...' : editing ? 'Update record' : 'Save record'}</button></div></form></div></div>; }

function FormField({ field, value, projects, onChange }) { if (field.type === 'project') return <label className="block text-sm font-semibold">{field.label}<select name={field.name} value={value} onChange={onChange} required={field.required} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"><option value="">Select project</option>{projects.filter((project) => ['Planning', 'In Progress', 'Planned', 'Active'].includes(recordValue(project, 'status', 'Status', 'Project_Status'))).map((project) => <option key={recordValue(project, 'id', 'Project_ID')} value={recordValue(project, 'id', 'Project_ID')}>{recordValue(project, 'name', 'Project_Name')}</option>)}</select></label>; if (field.type === 'select') return <label className="block text-sm font-semibold">{field.label}<select name={field.name} value={value} onChange={onChange} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm">{field.options.map((option) => <option key={option}>{option}</option>)}</select></label>; return <label className="block text-sm font-semibold">{field.label}<input name={field.name} type={field.type || 'text'} value={value} onChange={onChange} required={field.required} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm" /></label>; }

function ReportsPage() {
  const [expenditure, setExpenditure] = useState([]);
  const [supplierBalances, setSupplierBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadReports() {
      setLoading(true);
      setError('');
      try {
        const [expenditureRows, supplierRows] = await Promise.all([
          getExpenditureReport(),
          getSupplierBalancesReport(),
        ]);
        if (ignore) return;
        setExpenditure(Array.isArray(expenditureRows) ? expenditureRows : []);
        setSupplierBalances(Array.isArray(supplierRows) ? supplierRows : []);
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || apiError(requestError));
          setExpenditure([]);
          setSupplierBalances([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadReports();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1d6d78]">Analysis</p>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
      </div>
      {error && <Alert message={error} />}
      {loading && <p className="mb-5 text-sm text-slate-500" role="status">Loading reports...</p>}
      <div className="space-y-8">
        <ReportTable
          title="Project expenditure vs budget"
          rows={expenditure}
          idField="Project_ID"
          emptyMessage="No project expenditure data found."
          columns={[
            { label: 'Project', render: (row) => row.Project_Name },
            { label: 'Budget', render: (row) => money(row.Project_Budget) },
            { label: 'Expenditure', render: (row) => money(row.TotalExpenditure) },
            { label: 'Remaining', render: (row) => money(row.RemainingExpenditure) },
            { label: 'Budget used', render: (row) => row.BudgetUsedPercentage == null ? 'N/A' : `${Number(row.BudgetUsedPercentage).toFixed(2)}%` },
          ]}
        />
        <ReportTable
          title="Supplier balances"
          rows={supplierBalances}
          idField="Supplier_ID"
          emptyMessage="No supplier balance data found."
          columns={[
            { label: 'Supplier', render: (row) => row.Supplier_Name },
            { label: 'Total ordered', render: (row) => money(row.TotalOrdered) },
            { label: 'Total paid', render: (row) => money(row.TotalPaid) },
            { label: 'Outstanding balance', render: (row) => money(row.OutstandingBalance) },
          ]}
        />
      </div>
    </div>
  );
}

function ReportTable({ title, rows, idField, emptyMessage, columns }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <tr>{columns.map((column) => <th key={column.label} className="p-4">{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[idField]} className="border-b border-slate-100 last:border-0">
                {columns.map((column) => <td key={column.label} className="p-4">{column.render(row)}</td>)}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={columns.length} className="p-5 text-slate-500">{emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ value, label }) { return <article className="rounded-xl bg-[#e9ecef] p-6"><p className="text-3xl font-extrabold">{value}</p><p className="mt-4 font-bold">{label}</p></article>; }
function ActionButton({ children, onClick }) { return <button type="button" onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1a3832] px-4 py-3 text-sm font-bold hover:bg-[#e8f1ef]">{children}</button>; }
function Alert({ message }) { return <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>; }

export default BuildTrackApp;
