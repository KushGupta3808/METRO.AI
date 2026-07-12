// Placeholder service - the backend has no /api/v1/auth/* routes yet.
// Once JWT login/signup endpoints exist, replace the mock bodies below with
// real apiClient.request('/auth/login', { method: 'POST', body }) calls.
// LoginPage/SignupPage already call these functions by this exact signature,
// so nothing else in the app needs to change.

function simulateLatency(ms = 550) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login({ email, password }) {
  await simulateLatency();
  if (!email || !password) throw new Error('Email and password are required.');
  return {
    user: { email, name: email.split('@')[0] },
    token: `demo-${btoa(email)}`,
  };
}

export async function signup({ name, email, password }) {
  await simulateLatency();
  if (!email || !password) throw new Error('Email and password are required.');
  return {
    user: { email, name: name || email.split('@')[0] },
    token: `demo-${btoa(email)}`,
  };
}
