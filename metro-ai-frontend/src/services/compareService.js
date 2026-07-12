import apiClient from './apiClient';

// Matches GET /api/v1/compare?source=&target=&amount=&payout_method=
// Returns { routes: [...], ai_recommendation: 'SEND' | 'HOLD', ai_analysis_summary: string }
export function getCompare({ source, target, amount, payoutMethod }) {
  return apiClient.request('/compare', {
    params: { source, target, amount, payout_method: payoutMethod },
  });
}
