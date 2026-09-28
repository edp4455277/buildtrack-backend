import { api, apiError, BASE_URL } from './services/api';

export const API_URL = BASE_URL;
export { api, apiError };

export function recordValue(record, ...keys) {
  return keys.reduce((value, key) => value ?? record?.[key], undefined);
}
