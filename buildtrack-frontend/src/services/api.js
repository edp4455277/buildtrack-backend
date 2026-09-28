export const BASE_URL = 'http://localhost:3000/api';

async function request(path, { method = 'GET', data, signal } = {}) {
  const options = { method, signal, headers: {} };
  if (data !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Unable to connect to the BuildTrack API. Check that the server is running.', { cause: error });
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.status === 'error') {
    const error = new Error(payload?.message || payload?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload;
}

export const api = {
  get: async (path, options) => ({ data: await request(path, options) }),
  post: async (path, data) => ({ data: await request(path, { method: 'POST', data }) }),
  put: async (path, data) => ({ data: await request(path, { method: 'PUT', data }) }),
  delete: async (path) => ({ data: await request(path, { method: 'DELETE' }) }),
};

export function apiError(error) {
  return error?.message || 'Something went wrong. Please try again.';
}

export function getProjects() { return request('/projects'); }
export function createProject(data) { return request('/projects', { method: 'POST', data }); }
export function updateProject(id, data) { return request(`/projects/${id}`, { method: 'PUT', data }); }
export function deleteProject(id) { return request(`/projects/${id}`, { method: 'DELETE' }); }

export function getClients() { return request('/clients'); }
export function createClient(data) { return request('/clients', { method: 'POST', data }); }
export function updateClient(id, data) { return request(`/clients/${id}`, { method: 'PUT', data }); }
export function deleteClient(id) { return request(`/clients/${id}`, { method: 'DELETE' }); }

export function getContractors() { return request('/contractors'); }
export function createContractor(data) { return request('/contractors', { method: 'POST', data }); }
export function updateContractor(id, data) { return request(`/contractors/${id}`, { method: 'PUT', data }); }
export function deleteContractor(id) { return request(`/contractors/${id}`, { method: 'DELETE' }); }

export function getSuppliers() { return request('/suppliers'); }
export function createSupplier(data) { return request('/suppliers', { method: 'POST', data }); }
export function updateSupplier(id, data) { return request(`/suppliers/${id}`, { method: 'PUT', data }); }
export function deleteSupplier(id) { return request(`/suppliers/${id}`, { method: 'DELETE' }); }

export function getEmployees() { return request('/employees'); }
export function createEmployee(data) { return request('/employees', { method: 'POST', data }); }
export function updateEmployee(id, data) { return request(`/employees/${id}`, { method: 'PUT', data }); }
export function deleteEmployee(id) { return request(`/employees/${id}`, { method: 'DELETE' }); }

export function getEquipment() { return request('/equipment'); }
export function createEquipment(data) { return request('/equipment', { method: 'POST', data }); }
export function updateEquipment(id, data) { return request(`/equipment/${id}`, { method: 'PUT', data }); }
export function deleteEquipment(id) { return request(`/equipment/${id}`, { method: 'DELETE' }); }
export function allocateEquipment(data) { return request('/equipment/allocate', { method: 'POST', data }); }

export function getExpenses() { return request('/expenses'); }
export function createExpense(data) { return request('/expenses', { method: 'POST', data }); }
export function updateExpense(id, data) { return request(`/expenses/${id}`, { method: 'PUT', data }); }
export function deleteExpense(id) { return request(`/expenses/${id}`, { method: 'DELETE' }); }

export function createPurchaseOrder(data) { return request('/suppliers/orders', { method: 'POST', data }); }

export function getExpenditureReport() { return request('/reports/expenditure'); }
export function getSupplierBalancesReport() { return request('/reports/supplier-balances'); }