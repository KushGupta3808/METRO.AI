import apiClient from './apiClient';

// GET /api/v1/transfers
export function getTransfers() {
  return apiClient.request('/transfers');
}

// POST /api/v1/transfers - requires a valid recipient_id
export function createTransfer(payload) {
  return apiClient.request('/transfers', { method: 'POST', body: payload });
}
