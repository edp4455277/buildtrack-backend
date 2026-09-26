export const BASE_URL = 'http://localhost:3000/api';

async function get(path) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`);
  } catch {
    throw new Error('Unable to connect to the BuildTrack API. Check that the server is running.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.status === 'error') {
    throw new Error(payload?.message || payload?.error || `Request failed with status ${response.status}`);
  }

  return payload?.data ?? payload;
}

export function getProjects() {
  return get('/projects');
}

export function getSuppliers() {
  return get('/suppliers');
}

export function getEquipment() {
  return get('/equipment');
}

export function getExpenses() {
  return get('/expenses');
}

export function getExpenditureReport() {
  return get('/reports/expenditure');
}

export function getSupplierBalancesReport() {
  return get('/reports/supplier-balances');
}