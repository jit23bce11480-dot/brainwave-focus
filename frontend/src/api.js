// Every call to the backend lives here, so components never build URLs themselves.

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Sends a request and returns the JSON reply.
// Throws an Error if the server can't be reached or replies with an error status.
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = data.details || [];
    throw error;
  }
  return data;
}

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });

export const analyzeProfile = (userData, userId) => post('/api/analyze', { ...userData, userId });
export const startSession = (userId) => post('/api/session/start', { userId });
export const recordBreak = (sessionId) => post('/api/session/break', { sessionId });
export const endSession = (sessionId) => post('/api/session/end', { sessionId });
export const getStats = (userId) => request(`/api/stats/${encodeURIComponent(userId)}`);
