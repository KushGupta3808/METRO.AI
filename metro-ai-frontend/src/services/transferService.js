const API_URL = 'http://localhost:8000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Fetch real transfers from PostgreSQL and map them to match 
 * the exact UI schema expected by LedgerPage.jsx
 */
export async function getTransfers() {
  try {
    const response = await fetch(`${API_URL}/transfers`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve transfers');
    }

    const data = await response.json();

    // Transform backend DB naming conventions into clean UI fields
    return data.map(tx => ({
      id: tx.id.toString(),
      date: new Date(tx.created_at).toISOString().split('T')[0], // Formats to YYYY-MM-DD
      recipient: 'Anup Gupta', // Since we write with recipient_id: 1, map it to our active DB recipient
      sent: `${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${tx.source_currency}`,
      received: `${tx.total_delivery_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${tx.target_currency}`,
      provider: tx.provider_name,
      status: 'Completed'
    }));
  } catch (error) {
    console.error("Ledger Service Error:", error);
    throw error; // Fallback to mock data on failure handled inside LedgerPage.jsx
  }
}

/**
 * Record a new transfer audit log in PostgreSQL
 */
export async function createTransfer(transferData) {
  try {
    const response = await fetch(`${API_URL}/transfers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        recipient_id: 1, // Defaulting directly to Anup Gupta
        source_currency: transferData.sourceCurrency,
        target_currency: transferData.targetCurrency,
        amount: parseFloat(transferData.amount),
        provider_name: transferData.providerName,
        exchange_rate: parseFloat(transferData.exchangeRate),
        fee: parseFloat(transferData.fee || 0),
        total_delivery_amount: parseFloat(transferData.totalDeliveryAmount),
        ai_recommendation_at_time: transferData.aiRecommendation || 'SEND'
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'Failed to log transfer to database');
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to post transfer to database:", error);
    throw error;
  }
}