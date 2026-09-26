import axios from 'axios';

export const API_URL = 'http://localhost:3000/api';

export const api = axios.create({ baseURL: API_URL });

export function apiError(error) {
  console.error(error.response?.data || error);
  return error.response?.data?.error || 'Something went wrong. Please try again.';
}

export function recordValue(record, ...keys) {
  return keys.reduce((value, key) => value ?? record?.[key], undefined);
}
