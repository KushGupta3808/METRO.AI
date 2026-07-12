import apiClient from './apiClient';

// GET /api/v1/recipients
export function getRecipients() {
  return apiClient.request('/recipients');
}

// POST /api/v1/recipients
export function createRecipient(payload) {
  return apiClient.request('/recipients', { method: 'POST', body: payload });
}
