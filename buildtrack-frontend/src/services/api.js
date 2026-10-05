export const BASE_URL = 'http://localhost:3000/api';

export const getToken = () => {
  return localStorage.getItem('token');
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
};


async function request(path, { method = 'GET', data, signal } = {}) {
  const options = {
    method,
    signal,
    headers: {},
  };

  const token = getToken();

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw new Error(
      'Unable to connect to the BuildTrack API. Make sure the backend server is running on port 3000.',
      { cause: error }
    );
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401 && path !== '/auth/login') {
    logout();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (
    !response.ok ||
    payload?.status === 'error' ||
    payload?.success === false
  ) {
    const error = new Error(
      payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}`
    );

    error.status = response.status;

    throw error;
  }

  return payload?.data ?? payload;
}

export const api = {
  get: async (path, options = {}) => ({
    data: await request(path, options),
  }),

  post: async (path, data) => ({
    data: await request(path, {
      method: 'POST',
      data,
    }),
  }),

  put: async (path, data) => ({
    data: await request(path, {
      method: 'PUT',
      data,
    }),
  }),

  delete: async (path) => ({
    data: await request(path, {
      method: 'DELETE',
    }),
  }),
};

export function apiError(error) {
  return error?.message || 'Something went wrong. Please try again.';
}

export async function login(email, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    data: {
      email,
      password,
    },
  });

  if (result?.token) {
    localStorage.setItem('token', result.token);
  }

  if (result?.user) {
    localStorage.setItem('user', JSON.stringify(result.user));
  }

  return result;
}

export function getClients() {
  return request('/clients');
}

export function getClient(id) {
  return request(`/clients/${id}`);
}

export function createClient(data) {
  return request('/clients', {
    method: 'POST',
    data,
  });
}

export function updateClient(id, data) {
  return request(`/clients/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteClient(id) {
  return request(`/clients/${id}`, {
    method: 'DELETE',
  });
}


export function getContractors() {
  return request('/contractors');
}

export function getContractor(id) {
  return request(`/contractors/${id}`);
}

export function createContractor(data) {
  return request('/contractors', {
    method: 'POST',
    data,
  });
}

export function updateContractor(id, data) {
  return request(`/contractors/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteContractor(id) {
  return request(`/contractors/${id}`, {
    method: 'DELETE',
  });
}



export function getEmployees() {
  return request('/employees');
}

export function getEmployee(id) {
  return request(`/employees/${id}`);
}

export function createEmployee(data) {
  return request('/employees', {
    method: 'POST',
    data,
  });
}

export function updateEmployee(id, data) {
  return request(`/employees/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteEmployee(id) {
  return request(`/employees/${id}`, {
    method: 'DELETE',
  });
}

export function getProjects() {
  return request('/projects');
}

export function getProject(id) {
  return request(`/projects/${id}`);
}

export function createProject(data) {
  return request('/projects', {
    method: 'POST',
    data,
  });
}

export function updateProject(id, data) {
  return request(`/projects/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteProject(id) {
  return request(`/projects/${id}`, {
    method: 'DELETE',
  });
}


export function getProjectEmployees() {
  return request('/project-employees');
}

export function getProjectEmployeesByProject(projectId) {
  return request(`/project-employees/project/${projectId}`);
}

export function assignEmployeeToProject(projectId, data) {
  return request(`/project-employees/project/${projectId}`, {
    method: 'POST',
    data,
  });
}

export function updateProjectEmployee(id, data) {
  return request(`/project-employees/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteProjectEmployee(id) {
  return request(`/project-employees/${id}`, {
    method: 'DELETE',
  });
}


export function getSuppliers() {
  return request('/suppliers');
}

export function getSupplier(id) {
  return request(`/suppliers/${id}`);
}

export function createSupplier(data) {
  return request('/suppliers', {
    method: 'POST',
    data,
  });
}

export function updateSupplier(id, data) {
  return request(`/suppliers/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteSupplier(id) {
  return request(`/suppliers/${id}`, {
    method: 'DELETE',
  });
}


export function getMaterials() {
  return request('/materials');
}

export function getMaterial(id) {
  return request(`/materials/${id}`);
}

export function getLowStockMaterials() {
  return request('/materials/low-stock');
}

export function createMaterial(data) {
  return request('/materials', {
    method: 'POST',
    data,
  });
}

export function updateMaterial(id, data) {
  return request(`/materials/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteMaterial(id) {
  return request(`/materials/${id}`, {
    method: 'DELETE',
  });
}



export function getPurchaseOrders() {
  return request('/purchase-orders');
}

export function getPurchaseOrder(id) {
  return request(`/purchase-orders/${id}`);
}

export function createPurchaseOrder(data) {
  return request('/purchase-orders', {
    method: 'POST',
    data,
  });
}

export function updatePurchaseOrder(id, data) {
  return request(`/purchase-orders/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deletePurchaseOrder(id) {
  return request(`/purchase-orders/${id}`, {
    method: 'DELETE',
  });
}

export function addPurchaseOrderItem(id, data) {
  return request(`/purchase-orders/${id}/items`, {
    method: 'POST',
    data,
  });
}

export function deletePurchaseOrderItem(id, itemId) {
  return request(`/purchase-orders/${id}/items/${itemId}`, {
    method: 'DELETE',
  });
}



export function getDeliveries() {
  return request('/deliveries');
}

export function getDelivery(id) {
  return request(`/deliveries/${id}`);
}

export function createDelivery(data) {
  return request('/deliveries', {
    method: 'POST',
    data,
  });
}

export function addDeliveryItem(id, data) {
  return request(`/deliveries/${id}/items`, {
    method: 'POST',
    data,
  });
}

export function deleteDelivery(id) {
  return request(`/deliveries/${id}`, {
    method: 'DELETE',
  });
}

export function getEquipment() {
  return request('/equipment');
}

export function getEquipmentItem(id) {
  return request(`/equipment/${id}`);
}

export function createEquipment(data) {
  return request('/equipment', {
    method: 'POST',
    data,
  });
}

export function updateEquipment(id, data) {
  return request(`/equipment/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteEquipment(id) {
  return request(`/equipment/${id}`, {
    method: 'DELETE',
  });
}


export function getEquipmentAllocations() {
  return request('/equipment-allocations');
}

export function createEquipmentAllocation(data) {
  return request('/equipment-allocations', {
    method: 'POST',
    data,
  });
}

export function updateEquipmentAllocation(id, data) {
  return request(`/equipment-allocations/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteEquipmentAllocation(id) {
  return request(`/equipment-allocations/${id}`, {
    method: 'DELETE',
  });
}
export function allocateEquipment(data) {
  return createEquipmentAllocation(data);
}

export function getExpenses() {
  return request('/expenses');
}

export function getExpensesByProject(projectId) {
  return request(`/expenses/project/${projectId}`);
}

export function getExpense(id) {
  return request(`/expenses/${id}`);
}

export function createExpense(data) {
  return request('/expenses', {
    method: 'POST',
    data,
  });
}

export function updateExpense(id, data) {
  return request(`/expenses/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteExpense(id) {
  return request(`/expenses/${id}`, {
    method: 'DELETE',
  });
}

export function getPayments() {
  return request('/payments');
}

export function getPayment(id) {
  return request(`/payments/${id}`);
}

export function createPayment(data) {
  return request('/payments', {
    method: 'POST',
    data,
  });
}

export function updatePayment(id, data) {
  return request(`/payments/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deletePayment(id) {
  return request(`/payments/${id}`, {
    method: 'DELETE',
  });
}

export function getDashboardReport() {
  return request('/reports/dashboard');
}

export function getProjectSummaryReport() {
  return request('/reports/project-summary');
}

export function getLowStockReport() {
  return request('/reports/low-stock');
}

export function getEquipmentStatusReport() {
  return request('/reports/equipment-status');
}

export function getSupplierActivityReport() {
  return request('/reports/supplier-activity');
}

export function getEmployeeProjectsReport() {
  return request('/reports/employee-projects');
}

export function getExpenditureReport() {
  return getProjectSummaryReport();
}

export function getSupplierBalancesReport() {
  return getSupplierActivityReport();
}


export function getHealth() {
  return request('/health');
}