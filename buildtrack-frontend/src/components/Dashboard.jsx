import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Building2,
  ChevronRight,
  FileText,
  LayoutGrid,
  Menu,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  Truck,
  TrendingUp,
  X,
} from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

const navigation = [
  { label: 'Dashboard', icon: LayoutGrid, active: true },
  { label: 'Projects Directory', icon: Building2 },
  { label: 'Expense Ledger', icon: Receipt },
  { label: 'Supplier Management', icon: Truck },
  { label: 'Equipment Tracking', icon: BarChart3 },
  { label: 'Financial Reports', icon: FileText },
  { label: 'System Settings', icon: Settings },
];

const features = [
  { icon: LayoutGrid, title: 'Project Management', description: 'Real-time tracking of site progress, milestones, and status.' },
  { icon: Receipt, title: 'Expense Ledger', description: 'Log materials, labor, and sub-contractor payments instantly.' },
  { icon: TrendingUp, title: 'Budget Analytics', description: 'Monitor target budget vs. actual spend with automatic variance alerts.' },
  { icon: Truck, title: 'Supplier Management', description: 'Maintain records of active suppliers, equipment rentals, and receipts.' },
  { icon: ShieldCheck, title: 'Financial Transparency', description: 'Complete audit log of every project payment and budget adjustment.' },
  { icon: FileText, title: 'Instant Reports', description: 'Export itemized financial summaries and project reports in PDF or CSV.' },
];

const formatCurrency = (value) => `ZMW ${Number(value || 0).toLocaleString('en-ZM', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '', allocated_budget: '', start_date: '', status: 'Planning' });
  const [expenseFormData, setExpenseFormData] = useState({ project_id: '', category: 'Materials', amount: '', description: '', expense_date: '' });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectResponse, expenseResponse] = await Promise.all([
        axios.get(`${API_URL}/projects`),
        axios.get(`${API_URL}/expenses`),
      ]);
      setProjects(projectResponse.data);
      setExpenses(expenseResponse.data);
    } catch (requestError) {
      console.error(requestError.response?.data || requestError);
      setError('Unable to load live dashboard data. Check that the API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setError(null);
      try {
        const [projectResponse, expenseResponse] = await Promise.all([
          axios.get(`${API_URL}/projects`),
          axios.get(`${API_URL}/expenses`),
        ]);
        setProjects(projectResponse.data);
        setExpenses(expenseResponse.data);
      } catch (requestError) {
        console.error(requestError.response?.data || requestError);
        setError('Unable to load live dashboard data. Check that the API is running.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const totalBudget = projects.reduce((sum, project) => sum + Number(project.allocated_budget || 0), 0);
  const totalSpend = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const activeProjects = projects.filter((project) => ['Planning', 'In Progress'].includes(project.status)).length;

  const handleInputChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleExpenseInputChange = (event) => {
    setExpenseFormData({ ...expenseFormData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...formData, allocated_budget: parseFloat(formData.allocated_budget) };
      await axios.post(`${API_URL}/projects`, payload);
      const refreshedResponse = await axios.get(`${API_URL}/projects`);
      setProjects(refreshedResponse.data);
      setIsModalOpen(false);
      setFormData({ name: '', location: '', allocated_budget: '', start_date: '', status: 'Planning' });
      setError(null);
    } catch (requestError) {
      console.error(requestError.response?.data || requestError);
      setError('Unable to create the project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...expenseFormData, project_id: parseInt(expenseFormData.project_id, 10), amount: parseFloat(expenseFormData.amount) };
      await axios.post(`${API_URL}/expenses`, payload);
      const refreshedResponse = await axios.get(`${API_URL}/expenses`);
      setExpenses(refreshedResponse.data);
      setIsExpenseModalOpen(false);
      setExpenseFormData({ project_id: '', category: 'Materials', amount: '', description: '', expense_date: '' });
      setError(null);
    } catch (requestError) {
      console.error(requestError.response?.data || requestError);
      setError('Unable to create the expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#1a3832]">
      <header className="bg-[#1a3832] px-5 py-5 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#b9d3cc]">BuildTrack Management</p>
            <p className="text-sm text-white/75">Construction &amp; Expense Oversight</p>
          </div>
          <button type="button" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="rounded-lg p-2 text-white lg:hidden" aria-label="Toggle navigation">
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className={`${isSidebarOpen ? 'block' : 'hidden'} absolute z-20 h-[calc(100vh-82px)] w-72 bg-[#1a3832] p-5 text-white lg:relative lg:block lg:min-h-[calc(100vh-82px)] lg:shrink-0`}>
          <div className="mb-8 border-b border-white/15 pb-6">
            <p className="text-lg font-bold">BuildTrack Admin</p>
            <p className="mt-1 text-xs text-white/55">Operations workspace</p>
          </div>
          <nav className="space-y-1" aria-label="Main navigation">
            {navigation.map(({ label, icon: Icon, active }) => (
              <button key={label} type="button" className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${active ? 'bg-white text-[#1a3832] shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
                <span>{label}</span>
                {active && <ChevronRight size={16} className="ml-auto" />}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1d6d78]">Overview</p>
                <h1 className="text-3xl font-bold tracking-tight text-[#1a3832] sm:text-4xl">Dashboard Overview</h1>
                <p className="mt-2 text-sm text-slate-500">Project, expense, and budget summary</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1d6d78] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#165761]"><Plus size={17} /> Create New Project</button>
            </div>

            {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <section className="grid gap-4 md:grid-cols-3" aria-label="Dashboard metrics">
              <MetricCard value={formatCurrency(totalBudget)} label="Total Allocated Budget" detail="Across active projects" />
              <MetricCard value={formatCurrency(totalSpend)} label="Total Expenditure" detail="Logged materials & labor" />
              <MetricCard value={activeProjects} label="Active Projects" detail="Currently in progress" />
            </section>

            <section className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><h2 className="text-xl font-bold text-[#1a3832]">Quick Actions</h2><p className="mt-1 text-sm text-slate-500">Keep your project operations moving.</p></div>
                <button type="button" onClick={fetchDashboardData} className="text-left text-sm font-semibold text-[#1d6d78] hover:underline">Refresh data</button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ActionButton primary onClick={() => setIsModalOpen(true)}><Plus size={17} /> Create New Project</ActionButton>
                <ActionButton onClick={() => setIsExpenseModalOpen(true)}><Receipt size={17} /> Record Expense</ActionButton>
                <ActionButton><FileText size={17} /> Generate Budget Report</ActionButton>
              </div>
              {loading && <p className="mt-5 text-xs text-slate-400">Syncing project records...</p>}
            </section>

            <section className="mt-12">
              <div className="mb-5 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1d6d78]">Built for the field</p><h2 className="text-2xl font-bold text-[#1a3832]">Everything in one view</h2></div><span className="hidden text-sm text-slate-400 sm:block">Construction intelligence</span></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-xl bg-[#e9ecef] p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a3832] text-white"><Icon size={20} /></div><h3 className="font-bold text-[#1a3832]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}
              </div>
            </section>

            <section className="mt-8 rounded-xl bg-[#1d6d78] px-6 py-10 text-center text-white sm:px-10"><h2 className="text-2xl font-bold">Ready to start a new construction project?</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/80">Track budget allocations, log expenses on-site, and manage project lifecycles seamlessly.</p><button type="button" onClick={() => setIsModalOpen(true)} className="mt-6 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#1a3832] transition hover:bg-[#e8f1ef]">Start a project</button></section>
          </div>
        </main>
      </div>

      {isModalOpen && <ProjectModal formData={formData} onChange={handleInputChange} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} submitting={submitting} />}
      {isExpenseModalOpen && <ExpenseModal projects={projects} formData={expenseFormData} onChange={handleExpenseInputChange} onClose={() => setIsExpenseModalOpen(false)} onSubmit={handleExpenseSubmit} submitting={submitting} />}
    </div>
  );
}

function MetricCard({ value, label, detail }) {
  return <article className="rounded-xl bg-[#e9ecef] p-6"><p className="text-3xl font-extrabold tracking-tight text-[#1a3832]">{value}</p><p className="mt-4 font-bold text-[#1a3832]">{label}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></article>;
}

function ActionButton({ children, primary = false, onClick }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition ${primary ? 'bg-[#1d6d78] text-white hover:bg-[#165761]' : 'border border-[#1a3832] text-[#1a3832] hover:bg-[#e8f1ef]'}`}>{children}</button>;
}

function ProjectModal({ formData, onChange, onClose, onSubmit, submitting }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10241f]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="create-project-title"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl sm:p-8"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#1d6d78]">New record</p><h2 id="create-project-title" className="mt-1 text-xl font-bold text-[#1a3832]">Create New Project</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog"><X size={20} /></button></div><form onSubmit={onSubmit} className="space-y-4"><Field label="Project Name" name="name" value={formData.name} onChange={onChange} placeholder="e.g. Copperbelt Access Road" required /><Field label="Location" name="location" value={formData.location} onChange={onChange} placeholder="e.g. Kitwe" /><Field label="Allocated Budget (ZMW)" name="allocated_budget" type="number" value={formData.allocated_budget} onChange={onChange} placeholder="e.g. 120000" required /><Field label="Start Date" name="start_date" type="date" value={formData.start_date} onChange={onChange} /><SelectField label="Status" name="status" value={formData.status} onChange={onChange} options={['Planning', 'In Progress', 'Completed', 'On Hold']} /><ModalActions onClose={onClose} submitting={submitting} label="Save Project" /></form></div></div>;
}

function ExpenseModal({ projects, formData, onChange, onClose, onSubmit, submitting }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10241f]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="create-expense-title"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl sm:p-8"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#1d6d78]">New record</p><h2 id="create-expense-title" className="mt-1 text-xl font-bold text-[#1a3832]">Record Expense</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog"><X size={20} /></button></div><form onSubmit={onSubmit} className="space-y-4"><SelectField label="Project" name="project_id" value={formData.project_id} onChange={onChange} options={projects.map((project) => ({ value: project.id, label: project.name }))} required /><SelectField label="Category" name="category" value={formData.category} onChange={onChange} options={['Materials', 'Labor', 'Equipment', 'Misc']} /><Field label="Amount (ZMW)" name="amount" type="number" value={formData.amount} onChange={onChange} placeholder="e.g. 2500" required /><Field label="Description" name="description" value={formData.description} onChange={onChange} placeholder="e.g. Cement delivery" /><Field label="Expense Date" name="expense_date" type="date" value={formData.expense_date} onChange={onChange} required /><ModalActions onClose={onClose} submitting={submitting} label="Save Expense" /></form></div></div>;
}

function SelectField({ label, name, value, onChange, options, required = false }) {
  return <label className="block text-sm font-semibold text-[#1a3832]">{label}<select name={name} value={value} onChange={onChange} required={required} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-[#1d6d78] focus:ring-2 focus:ring-[#1d6d78]/20"><option value="">Select {label.toLowerCase()}</option>{options.map((option) => { const item = typeof option === 'string' ? { value: option, label: option } : option; return <option key={item.value} value={item.value}>{item.label}</option>; })}</select></label>;
}

function ModalActions({ onClose, submitting, label }) {
  return <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="rounded-lg border border-[#1a3832] px-4 py-3 text-sm font-bold text-[#1a3832]">Cancel</button><button type="submit" disabled={submitting} className="rounded-lg bg-[#1d6d78] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Saving...' : label}</button></div>;
}

function Field({ label, name, value, onChange, placeholder, type = 'text', required = false }) {
  return <label className="block text-sm font-semibold text-[#1a3832]">{label}<input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-normal outline-none focus:border-[#1d6d78] focus:ring-2 focus:ring-[#1d6d78]/20" /></label>;
}

export default Dashboard;
