/* ==========================================================================
   SHIFT PLANNER - API CLIENT LAYER
   Handles HTTP requests to Spring Boot REST Endpoints
   ========================================================================== */

const API_BASE_URL = window.location.origin.includes('8080')
  ? window.location.origin
  : 'http://localhost:8080';

/**
 * Generic HTTP Fetch wrapper with error extraction
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    console.log(`SENDING REQUEST [${options.method || 'GET'}]:`, url);
    const response = await fetch(url, config);
    console.log(`RESPONSE STATUS [${options.method || 'GET'} ${url}]:`, response.status);

    // If HTTP 204 No Content
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Extract error message from Spring Boot response JSON or status text
      const errorMessage = (data && data.message) ? data.message : `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ==========================================================================
// API ENDPOINT SERVICES
// ==========================================================================

export const EmployeeAPI = {
  getAll: () => request('/api/employees'),
  getById: (id) => request(`/api/employees/${id}`),
  create: (employeeData) => request('/api/employees', { method: 'POST', body: employeeData }),
  update: (id, employeeData) => request(`/api/employees/${id}`, { method: 'PUT', body: employeeData }),
  delete: (id) => request(`/api/employees/${id}`, { method: 'DELETE' })
};

export const ShiftAPI = {
  getAll: () => request('/api/shifts'),
  getById: (id) => request(`/api/shifts/${id}`),
  create: (shiftData) => request('/api/shifts', { method: 'POST', body: shiftData }),
  update: (id, shiftData) => request(`/api/shifts/${id}`, { method: 'PUT', body: shiftData }),
  delete: (id) => request(`/api/shifts/${id}`, { method: 'DELETE' })
};

export const RosterAPI = {
  getAll: () => request('/api/rosters'),
  getById: (id) => request(`/api/rosters/${id}`),
  create: (employeeId, shiftId) => request('/api/rosters', {
    method: 'POST',
    body: { employeeId: Number(employeeId), shiftId: Number(shiftId) }
  }),
  delete: (id) => request(`/api/rosters/${id}`, { method: 'DELETE' })
};

export const SwapAPI = {
  getAll: () => request('/api/swaps'),
  getById: (id) => request(`/api/swaps/${id}`),
  create: (rosterId, requesterId, colleagueId) => request('/api/swaps', {
    method: 'POST',
    body: {
      rosterId: Number(rosterId),
      requesterId: Number(requesterId),
      colleagueId: Number(colleagueId)
    }
  }),
  accept: (id) => request(`/api/swaps/${id}/accept`, { method: 'PUT' }),
  decline: (id) => request(`/api/swaps/${id}/decline`, { method: 'PUT' }),
  approve: (id) => request(`/api/swaps/${id}/approve`, { method: 'PUT' }),
  delete: (id) => request(`/api/swaps/${id}`, { method: 'DELETE' })
};
