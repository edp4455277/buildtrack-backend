import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, LayoutDashboard, Users, BriefcaseBusiness, UserRound,
  Truck, Package, ShoppingCart, ClipboardList, Wrench, HardHat, Receipt,
  CreditCard, BarChart3, LogOut, Plus, RefreshCw, Search, Trash2, Pencil,
  X, AlertCircle
} from 'lucide-react';
import {
  apiError, logout, getClients, createClient, updateClient, deleteClient,
  getContractors, createContractor, updateContractor, deleteContractor,
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getProjects, createProject, updateProject, deleteProject,
  getProjectEmployees, assignEmployeeToProject, updateProjectEmployee, deleteProjectEmployee,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getMaterials, createMaterial, updateMaterial, deleteMaterial,
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
  getDeliveries, createDelivery, deleteDelivery,
  getEquipment, createEquipment, updateEquipment, deleteEquipment,
  getEquipmentAllocations, createEquipmentAllocation, updateEquipmentAllocation, deleteEquipmentAllocation,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getPayments, createPayment, updatePayment, deletePayment,
  getDashboardReport, getProjectSummaryReport, getLowStockReport,
  getEquipmentStatusReport, getSupplierActivityReport, getEmployeeProjectsReport
} from '../services/api';

const resources = {
  projects: {
    label: 'Projects', icon: BriefcaseBusiness,
    description: 'Construction projects and project budgets',
    loader: getProjects, create: createProject, update: updateProject, remove: deleteProject,
    id: 'Project_ID',
    fields: ['Project_Name', 'Project_Description', 'Client_ID', 'Contractor_ID', 'Project_Manager_ID', 'Start_Date', 'Expected_End_Date', 'Actual_End_Date', 'Project_Status', 'Project_Budget']
  },
  clients: {
    label: 'Clients', icon: Users, description: 'Project clients',
    loader: getClients, create: createClient, update: updateClient, remove: deleteClient,
    id: 'Client_ID', fields: ['Client_Name', 'Phone_Number', 'Email', 'Address']
  },
  contractors: {
    label: 'Contractors', icon: HardHat, description: 'Construction contractors',
    loader: getContractors, create: createContractor, update: updateContractor, remove: deleteContractor,
    id: 'Contractor_ID', fields: ['Contractor_Name', 'Phone_Number', 'Email', 'Address', 'License_Number']
  },
  suppliers: {
    label: 'Suppliers', icon: Truck, description: 'Material and service suppliers',
    loader: getSuppliers, create: createSupplier, update: updateSupplier, remove: deleteSupplier,
    id: 'Supplier_ID', fields: ['Supplier_Name', 'Phone_Number', 'Email', 'Address', 'Service_Type']
  },
  materials: {
    label: 'Materials', icon: Package, description: 'Construction materials and stock',
    loader: getMaterials, create: createMaterial, update: updateMaterial, remove: deleteMaterial,
    id: 'Material_ID', fields: ['Material_Name', 'Unit', 'Unit_Price', 'Stock_Quantity', 'Reorder_Level']
  },
  purchaseOrders: {
    label: 'Purchase Orders', icon: ShoppingCart, description: 'Purchase orders and procurement',
    loader: getPurchaseOrders, create: createPurchaseOrder, update: updatePurchaseOrder, remove: deletePurchaseOrder,
    id: 'Purchase_Order_ID', fields: ['Project_ID', 'Supplier_ID', 'Order_Date', 'Expected_Delivery_Date', 'Status', 'Total_Amount']
  },
  deliveries: {
    label: 'Deliveries', icon: ClipboardList, description: 'Material deliveries',
    loader: getDeliveries, create: createDelivery, remove: deleteDelivery,
    id: 'Delivery_ID', fields: ['Purchase_Order_ID', 'Delivery_Date', 'Delivery_Reference', 'Received_By', 'Status', 'Notes']
  },
  equipments: {
    label: 'Equipment', icon: Wrench, description: 'Construction equipment',
    loader: getEquipment, create: createEquipment, update: updateEquipment, remove: deleteEquipment,
    id: 'Equipment_ID', fields: ['Equipment_Name', 'Equipment_Type', 'Registration_Number', 'Availability_Status']
  },
  equipmentAllocations: {
    label: 'Equipment Allocations', icon: Wrench, description: 'Equipment assigned to projects',
    loader: getEquipmentAllocations, create: createEquipmentAllocation, update: updateEquipmentAllocation, remove: deleteEquipmentAllocation,
    id: 'Allocation_ID', fields: ['Equipment_ID', 'Project_ID', 'Allocation_Start_Date', 'Allocation_End_Date', 'Purpose', 'Status']
  },
  projectEmployees: {
    label: 'Project Employees', icon: UserRound, description: 'Employees assigned to projects',
    loader: getProjectEmployees, create: assignEmployeeToProject, update: updateProjectEmployee, remove: deleteProjectEmployee,
    id: 'Project_Employee_ID', fields: ['Project_ID', 'Employee_ID', 'Assignment_Start_Date', 'Assignment_End_Date', 'Role', 'Status']
  },
  expenses: {
    label: 'Project Expenses', icon: Receipt, description: 'Project expenditure',
    loader: getExpenses, create: createExpense, update: updateExpense, remove: deleteExpense,
    id: 'Expense_ID', fields: ['Project_ID', 'Expense_Date', 'Expense_Category', 'Description', 'Amount']
  },
  payments: {
    label: 'Payments', icon: CreditCard, description: 'Supplier and purchase order payments',
    loader: getPayments, create: createPayment, update: updatePayment, remove: deletePayment,
    id: 'Payment_ID',
    fields: ['Supplier_ID', 'Purchase_Order_ID', 'Payment_Date', 'Amount', 'Payment_Method', 'Reference_Number']
  }
};

const employeeFields = [
  ['Employee_Name', 'Employee Name'],
  ['Job_Title', 'Job Title'],
  ['Phone_Number', 'Phone Number'],
  ['Email', 'Email'],
  ['Address', 'Address'],
  ['Hire_Date', 'Hire Date']
];

function extractRows(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function money(value) {
  return `K ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeDateValue(value) {
  if (value === null || value === undefined || value === '') return '';

  const dateString = String(value).trim();
  if (!dateString) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

  const isoMatch = dateString.match(/^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/);
  if (isoMatch) return dateString.split(/[T\s]/)[0];

  return dateString;
}

function formatDisplayDate(value) {
  const normalized = normalizeDateValue(value);
  if (!normalized) return '—';

  const [year, month, day] = normalized.split('-').map(Number);
  if (!year || !month || !day) return String(value);

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(utcDate);
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(value.trim())) {
    return formatDisplayDate(value);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function titleFromKey(key) {
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
}

function getRecordId(record, resource) {
  if (!record) return null;
  return record[resource?.id] || record.id || record.ID ||
    record.Project_ID || record.Client_ID || record.Employee_ID ||
    record.Supplier_ID || record.Material_ID || record.Purchase_Order_ID ||
    record.Delivery_ID || record.Equipment_ID || record.Expense_ID ||
    record.Payment_ID || record.Allocation_ID || record.Project_Employee_ID;
}

const PAGE_TITLES = Object.freeze({
  dashboard: 'Dashboard',
  employees: 'Employees',
  reports: 'Reports'
});

function getPageTitle(activePage) {
  return PAGE_TITLES[activePage] || resources[activePage]?.label || 'BuildTrack';
}

function getResourceLabel(resource, plural = true) {
  if (!resource?.label) return plural ? 'records' : 'record';
  return plural ? resource.label : resource.label.replace(/s$/, '');
}

function getFieldType(field) {
  const normalized = field.toLowerCase();

  if (normalized.includes('date')) return 'date';
  if (['amount', 'budget', 'price', 'quantity'].some(key => normalized.includes(key))) return 'number';
  return 'text';
}

function BuildTrackApp() {
  const [activePage, setActivePage] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboardReport, setDashboardReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      const [p, e, emp, d] = await Promise.all([
        getProjects(), getExpenses(), getEmployees(), getDashboardReport()
      ]);
      setProjects(extractRows(p));
      setExpenses(extractRows(e));
      setEmployees(extractRows(emp));
      setDashboardReport(d);
    } catch (error) {
      console.error('Dashboard loading error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadDashboard, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logout();
    window.history.replaceState({}, '', '/');
    window.location.reload();
  };

  const pageTitle = getPageTitle(activePage);

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-[#1a3832]">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a3832] text-white">
            <Building2 size={19} />
          </div>
          <div>
            <p className="font-bold">BuildTrack</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Management System</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <NavButton active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon={<LayoutDashboard size={18} />}>
            Dashboard
          </NavButton>

          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Management</p>

          {Object.entries(resources).map(([key, r]) => (
            <NavButton key={key} active={activePage === key} onClick={() => setActivePage(key)} icon={<r.icon size={18} />}>
              {r.label}
            </NavButton>
          ))}

          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">People & Reports</p>

          <NavButton active={activePage === 'employees'} onClick={() => setActivePage('employees')} icon={<Users size={18} />}>
            Employees
          </NavButton>

          <NavButton active={activePage === 'reports'} onClick={() => setActivePage('reports')} icon={<BarChart3 size={18} />}>
            Reports
          </NavButton>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600">
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1d6d78]">BuildTrack</p>
            <h1 className="mt-1 text-xl font-bold">{pageTitle}</h1>
          </div>

          <button onClick={loadDashboard} disabled={refreshing} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <div className="p-5 sm:p-8">
          {activePage === 'dashboard' && (
            <DashboardPage projects={projects} expenses={expenses} employees={employees} dashboardReport={dashboardReport} onNavigate={setActivePage} />
          )}
          {activePage === 'employees' && <EmployeesPage employees={employees} reload={loadDashboard} />}
          {activePage === 'reports' && <ReportsPage />}
          {resources[activePage] && <ResourcePage resourceKey={activePage} resource={resources[activePage]} />}
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, children }) {
  return (
    <button onClick={onClick} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-[#1a3832] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
      {icon}<span>{children}</span>
    </button>
  );
}

function DashboardPage({ projects, expenses, employees, dashboardReport, onNavigate }) {
  const budget = projects.reduce((t, p) => t + Number(p.Project_Budget || p.Allocated_Budget || p.allocated_budget || 0), 0);
  const spending = expenses.reduce((t, e) => t + Number(e.Amount || e.amount || 0), 0);
  const report = dashboardReport?.data && typeof dashboardReport.data === 'object'
    ? dashboardReport.data
    : dashboardReport;
  const activeProjects = projects.filter(p =>
    String(p.Status || p.Project_Status || p.status || '').toLowerCase() === 'active'
  ).length;
  const reportStats = [
    { key: 'total_clients', title: 'Clients', page: 'clients' },
    { key: 'total_suppliers', title: 'Suppliers', page: 'suppliers' },
    { key: 'total_equipment', title: 'Equipment', page: 'equipments' },
    { key: 'low_stock_materials', title: 'Low Stock Materials', page: 'materials' },
    { key: 'total_payments', title: 'Total Payments', page: 'payments', money: true }
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#1d6d78]">Overview</p>
        <h2 className="mt-1 text-2xl font-bold">Construction operations at a glance</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Monitor projects, expenditure, employees and the operational resources connected to your construction work.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Projects" value={projects.length} icon={<BriefcaseBusiness size={20} />} onClick={() => onNavigate('projects')} />
        <StatCard title="Active Projects" value={activeProjects} icon={<BarChart3 size={20} />} onClick={() => onNavigate('projects')} />
        <StatCard title="Allocated Budget" value={money(budget)} icon={<CreditCard size={20} />} onClick={() => onNavigate('projects')} />
        <StatCard title="Total Expenditure" value={money(spending)} icon={<Receipt size={20} />} onClick={() => onNavigate('expenses')} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SmallStat title="Employees" value={employees.length} onClick={() => onNavigate('employees')} />
        <SmallStat title="Suppliers" value="Manage" onClick={() => onNavigate('suppliers')} />
        <SmallStat title="Materials" value="Manage" onClick={() => onNavigate('materials')} />
        <SmallStat title="Equipment" value="Manage" onClick={() => onNavigate('equipments')} />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">Additional Live Metrics</h3>
            <p className="mt-1 text-sm text-slate-500">Current totals from the BuildTrack dashboard report.</p>
          </div>
          <BarChart3 size={20} className="text-[#1d6d78]" />
        </div>

        {report && typeof report === 'object' && !Array.isArray(report) ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {reportStats.map(({ key, title, page, money: isMoney }) => {
              const parsed = Number(report[key] ?? 0);
              const value = Number.isFinite(parsed) ? parsed : 0;
              return (
                <SmallStat
                  key={key}
                  title={title}
                  value={isMoney ? money(value) : new Intl.NumberFormat('en-ZM', { maximumFractionDigits: 0 }).format(value)}
                  onClick={() => onNavigate(page)}
                />
              );
            })}
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
            <AlertCircle size={18} /> Dashboard report data is not available.
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="font-bold">Quick Actions</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction label="Create New Project" onClick={() => onNavigate('projects')} />
          <QuickAction label="Record Expense" onClick={() => onNavigate('expenses')} />
          <QuickAction label="Add Supplier" onClick={() => onNavigate('suppliers')} />
          <QuickAction label="Manage Equipment" onClick={() => onNavigate('equipments')} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, onClick }) {
  return (
    <button onClick={onClick} className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#1d6d78] hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">{title}</span>
        <div className="rounded-lg bg-[#edf6f4] p-2 text-[#1d6d78]">{icon}</div>
      </div>
      <p className="mt-4 text-2xl font-bold">{value}</p>
    </button>
  );
}

function PageHeader({ eyebrow, title, description, actionLabel, onAction }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold text-[#1d6d78]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold">{title}</h2>
        {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      </div>

      {onAction && (
        <button onClick={onAction} className="flex items-center justify-center gap-2 rounded-lg bg-[#1d6d78] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#165761]">
          <Plus size={17} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function SearchField({ value, onChange, placeholder }) {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <Search size={18} className="text-slate-400" />
      <input value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none" />
    </div>
  );
}

function SmallStat({ title, value, onClick }) {
  return (
    <button onClick={onClick} className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-[#1d6d78]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{title}</p>
      <p className="mt-3 text-lg font-bold">{value}</p>
    </button>
  );
}

function QuickAction({ label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm font-semibold transition hover:border-[#1d6d78] hover:bg-slate-50">
      {label}<Plus size={17} />
    </button>
  );
}

function ResourcePage({ resourceKey, resource }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setRows(extractRows(await resource.loader()));
    } catch (err) {
      console.error(`${resourceKey} loading error:`, err);
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [resource, resourceKey]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase();
    return rows.filter(row =>
      Object.values(row || {}).some(value => String(value ?? '').toLowerCase().includes(term))
    );
  }, [rows, search]);

  const handleDelete = async record => {
    const id = getRecordId(record, resource);
    if (!id) return alert('Unable to determine the record ID.');
    if (!window.confirm(`Are you sure you want to delete this ${resource.label.toLowerCase()} record?`)) return;

    try {
      await resource.remove(id);
      await load();
    } catch (err) {
      alert(apiError(err));
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Management"
        title={resource.label}
        description={resource.description}
        actionLabel={`Add ${getResourceLabel(resource, false)}`}
        onAction={() => setEditingRecord({})}
      />

      <SearchField
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={`Search ${resource.label.toLowerCase()}...`}
      />

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">
          <AlertCircle size={18} />{error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading {resource.label.toLowerCase()}...
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="font-semibold">No {resource.label.toLowerCase()} found.</p>
          <p className="mt-2 text-sm text-slate-500">The API returned no records for this section.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {resource.fields.map(field => (
                    <th key={field} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {titleFromKey(field)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={getRecordId(row, resource) || index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    {resource.fields.map(field => (
                      <td key={field} className="px-4 py-4 text-sm text-slate-600">{formatValue(row[field])}</td>
                    ))}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {resource.update && (
                          <button onClick={() => setEditingRecord(row)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1d6d78]" title="Edit">
                            <Pencil size={16} />
                          </button>
                        )}
                        {resource.remove && (
                          <button onClick={() => handleDelete(row)} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingRecord !== null && (
        <ResourceForm
          resourceKey={resourceKey}
          resource={resource}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={async () => {
            setEditingRecord(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function ResourceForm({ resource, record, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const sanitized = {};
    resource.fields.forEach(field => {
      const value = record?.[field];
      sanitized[field] = field.toLowerCase().includes('date') ? normalizeDateValue(value) : value ?? '';
    });
    return sanitized;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const change = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const submit = async event => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const data = {};
      resource.fields.forEach(field => {
        if (form[field] !== undefined && form[field] !== '') data[field] = form[field];
      });

      const id = getRecordId(record, resource);

      if (id && resource.update) {
        await resource.update(id, data);
      } else if (resource.create) {
        if (resource.id === 'Project_Employee_ID' && data.Project_ID) {
          await resource.create(data.Project_ID, data);
        } else {
          await resource.create(data);
        }
      }

      await onSaved();
    } catch (err) {
      console.error(err);
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="font-bold">{getRecordId(record, resource) ? `Edit ${resource.label}` : `Add ${resource.label}`}</h3>
            <p className="mt-1 text-xs text-slate-500">Enter the database field values below.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {resource.fields.map(field => {
              const isId = field.endsWith('_ID');
              const type = getFieldType(field);

              return (
                <label key={field} className="block text-sm font-semibold text-slate-700">
                  {titleFromKey(field)}
                  <input
                    type={type}
                    value={type === 'date' ? normalizeDateValue(form[field]) : (form[field] ?? '')}
                    disabled={isId && Boolean(getRecordId(record, resource))}
                    onChange={e => change(field, e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#1d6d78] focus:ring-2 focus:ring-[#1d6d78]/20 disabled:bg-slate-100"
                  />
                </label>
              );
            })}
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#1d6d78] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#165761] disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeesPage({ employees, reload }) {
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const removeEmployee = async employee => {
    if (!employee.Employee_ID || !window.confirm('Delete this employee?')) return;

    try {
      await deleteEmployee(employee.Employee_ID);
      await reload();
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Employees"
        description="Manage employees who work on BuildTrack projects."
        actionLabel="Add Employee"
        onAction={() => setEditing({})}
      />

      {error && <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['ID', 'Employee Name', 'Job Title', 'Phone', 'Email', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {employees.map(employee => (
                <tr key={employee.Employee_ID} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm">{employee.Employee_ID}</td>
                  <td className="px-5 py-4 text-sm font-semibold">{employee.Employee_Name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{employee.Job_Title}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{employee.Phone_Number || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{employee.Email || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(employee)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1d6d78]"><Pencil size={16} /></button>
                      <button onClick={() => removeEmployee(employee)} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && (
        <EmployeeForm
          employee={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function EmployeeForm({ employee, onClose, onSaved }) {
  const [form, setForm] = useState({
    Employee_Name: employee.Employee_Name || '',
    Job_Title: employee.Job_Title || '',
    Phone_Number: employee.Phone_Number || '',
    Email: employee.Email || '',
    Address: employee.Address || '',
    Hire_Date: normalizeDateValue(employee.Hire_Date)
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const submit = async event => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      if (employee.Employee_ID) {
        await updateEmployee(employee.Employee_ID, form);
      } else {
        await createEmployee(form);
      }

      await onSaved();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h3 className="font-bold">{employee.Employee_ID ? 'Edit Employee' : 'Add Employee'}</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={19} /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {employeeFields.map(([field, label]) => (
              <label key={field} className="text-sm font-semibold">
                {label}
                <input
                  type={field === 'Hire_Date' ? 'date' : field === 'Email' ? 'email' : 'text'}
                  value={field === 'Hire_Date' ? normalizeDateValue(form[field]) : (form[field] || '')}
                  onChange={e => update(field, e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#1d6d78] focus:ring-2 focus:ring-[#1d6d78]/20"
                />
              </label>
            ))}
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#1d6d78] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReportsPage() {
  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async type => {
    const reports = {
      dashboard: getDashboardReport,
      projects: getProjectSummaryReport,
      lowStock: getLowStockReport,
      equipment: getEquipmentStatusReport,
      suppliers: getSupplierActivityReport,
      employees: getEmployeeProjectsReport
    };

    try {
      setLoading(true);
      setError('');
      setReportType(type);
      setReport(null);
      const response = await reports[type]();
      setReport(response?.data ?? response);
    } catch {
      setReport(null);
      setError('Unable to load this report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadReport('dashboard'), 0);
    return () => clearTimeout(timer);
  }, []);

  const titles = {
    dashboard: 'Dashboard Report',
    projects: 'Project Summary Report',
    lowStock: 'Low Stock Report',
    equipment: 'Equipment Status Report',
    suppliers: 'Supplier Activity Report',
    employees: 'Employee Projects Report'
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#1d6d78]">Analytics</p>
        <h2 className="mt-1 text-2xl font-bold">Reports</h2>
        <p className="mt-2 text-sm text-slate-500">View operational reports generated from BuildTrack.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <ReportButton active={reportType === 'dashboard'} onClick={() => loadReport('dashboard')}>Dashboard</ReportButton>
        <ReportButton active={reportType === 'projects'} onClick={() => loadReport('projects')}>Project Summary</ReportButton>
        <ReportButton active={reportType === 'lowStock'} onClick={() => loadReport('lowStock')}>Low Stock</ReportButton>
        <ReportButton active={reportType === 'equipment'} onClick={() => loadReport('equipment')}>Equipment</ReportButton>
        <ReportButton active={reportType === 'suppliers'} onClick={() => loadReport('suppliers')}>Suppliers</ReportButton>
        <ReportButton active={reportType === 'employees'} onClick={() => loadReport('employees')}>Employee Projects</ReportButton>
      </div>

      {error && <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="font-bold">{titles[reportType]}</h3>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading report...</div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-600">{error}</div>
          ) : reportType === 'dashboard' ? (
            <DashboardReport report={report} />
          ) : (
            <ReportContent type={reportType} report={report} />
          )}
        </div>
      </div>
    </div>
  );
}

const reportColumns = {
  projects: [
    { key: 'Project_ID', label: 'Project ID' },
    { key: 'Project_Name', label: 'Project Name' },
    { key: 'Client_Name', label: 'Client' },
    { key: 'Contractor_Name', label: 'Contractor' },
    { key: 'Project_Manager_Name', label: 'Project Manager' },
    { key: 'Project_Status', label: 'Status' },
    { key: 'Project_Budget', label: 'Budget', money: true },
    { key: 'Total_Expenses', label: 'Expenditure', money: true },
    { key: 'Remaining_Budget', label: 'Remaining Balance', money: true }
  ],
  lowStock: [
    { key: 'Material_ID', label: 'Material ID' },
    { key: 'Material_Name', label: 'Material Name' },
    { key: 'Stock_Quantity', label: 'Current Stock' },
    { key: 'Reorder_Level', label: 'Reorder Level' },
    { key: 'Unit', label: 'Unit' }
  ],
  equipment: [
    { key: 'Availability_Status', label: 'Status' },
    { key: 'Total', label: 'Equipment Count' }
  ],
  suppliers: [
    { key: 'Supplier_Name', label: 'Supplier' },
    { key: 'Purchase_Orders', label: 'Purchase Orders' },
    { key: 'Deliveries', label: 'Deliveries' },
    { key: 'Ordered_Value', label: 'Ordered Value', money: true },
    { key: 'Paid_Value', label: 'Paid Value', money: true },
    {
      label: 'Balance Due',
      money: true,
      value: row => Number(row.Ordered_Value || 0) - Number(row.Paid_Value || 0)
    }
  ],
  employees: [
    { key: 'Employee_Name', label: 'Employee' },
    { key: 'Project_Name', label: 'Project' },
    { key: 'Role', label: 'Role' },
    { key: 'Assignment_Status', label: 'Assignment Status' },
    { key: 'Assignment_Start_Date', label: 'Assignment Start' },
    { key: 'Assignment_End_Date', label: 'Assignment End' }
  ]
};

function DashboardReport({ report }) {
  const dashboard = report?.data && typeof report.data === 'object' && !Array.isArray(report.data)
    ? report.data
    : report;

  if (!dashboard || typeof dashboard !== 'object' || Array.isArray(dashboard)) {
    return <p className="py-10 text-center text-sm text-slate-500">No data available.</p>;
  }

  const stats = [
    ['total_projects', 'Total Projects'],
    ['active_projects', 'Active Projects'],
    ['total_employees', 'Total Employees'],
    ['total_clients', 'Total Clients'],
    ['total_suppliers', 'Total Suppliers'],
    ['total_equipment', 'Total Equipment'],
    ['total_expenses', 'Total Expenses', true],
    ['total_payments', 'Total Payments', true],
    ['total_project_budget', 'Total Project Budget', true],
    ['low_stock_materials', 'Low Stock Materials']
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map(([key, label, isMoney]) => {
        const numericValue = Number(dashboard[key] ?? 0);
        const value = Number.isFinite(numericValue) ? numericValue : 0;
        return (
          <ReportCard
            key={key}
            title={label}
            value={isMoney
              ? `K${new Intl.NumberFormat('en-ZM', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(value)}`
              : new Intl.NumberFormat('en-ZM', { maximumFractionDigits: 0 }).format(value)}
          />
        );
      })}
    </div>
  );
}

function ReportCard({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ReportContent({ type, report }) {
  const rows = Array.isArray(report) ? report : extractRows(report);
  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-slate-500">No data available.</p>;
  }

  if (type === 'equipment') {
    return (
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {['Available', 'Allocated', 'Maintenance'].map(status => {
          const matching = rows.find(row =>
            String(row.Availability_Status || '').toLowerCase() === status.toLowerCase()
          );
          return (
            <ReportCard
              key={status}
              title={status}
              value={formatValue(matching?.Total ?? 0)}
            />
          );
        })}
        <div className="sm:col-span-3">
          <ReportTable rows={rows} columns={reportColumns.equipment} />
        </div>
      </div>
    );
  }

  return <ReportTable rows={rows} columns={reportColumns[type] || []} />;
}

function ReportTable({ rows, columns }) {
  const availableColumns = columns.filter(column =>
    column.value || rows.some(row => Object.hasOwn(row || {}, column.key))
  );

  if (!availableColumns.length) {
    return <p className="py-10 text-center text-sm text-slate-500">No data available.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[640px] text-left">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {availableColumns.map(column => (
              <th key={column.label} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.Project_Employee_ID || `${row.Employee_ID || row.Project_ID || row.Material_ID || row.Supplier_ID || index}-${row.Project_ID || index}`} className="border-b border-slate-100 last:border-0">
              {availableColumns.map(column => {
                const value = column.value ? column.value(row) : row[column.key];
                const displayValue = value === null || value === undefined || value === ''
                  ? (column.key?.endsWith('_Date') ? '—' : column.key === 'Project_Name' ? 'Not assigned' : '—')
                  : column.money
                    ? money(value)
                    : column.key?.includes('Date')
                      ? formatDisplayDate(value)
                      : formatValue(value);

                return (
                  <td key={column.label} className="px-4 py-3 text-sm text-slate-600">
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${active ? 'bg-[#1a3832] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
      {children}
    </button>
  );
}

export default BuildTrackApp;