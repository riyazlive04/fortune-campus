// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Setup API Service
export const setupApi = {
  // Check if initial setup is required
  checkStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/setup/status`);
    if (!response.ok) {
      throw new Error('Failed to check setup status');
    }
    return response.json();
  },

  // Initialize the system with first admin user
  initialize: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/setup/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to initialize setup');
    }

    return result;
  },
};

// Auth API Service
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    return result;
  },

  getCurrentUser: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get user');
    }

    return result;
  },
};

// Leads API Service
export const leadsApi = {
  getLeads: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    branchId?: string;
    search?: string;
  } = {}) => {
    const token = storage.getToken();
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/leads?${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch leads');
    }

    return result;
  },

  deleteLead: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete lead');
    }

    return result;
  },

  getLeadById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch lead');
    }

    return result;
  },

  createLead: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create lead');
    }

    return result;
  },

  updateLead: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update lead');
    }

    return result;
  },
};

// Courses API Service
export const coursesApi = {
  getCourses: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/courses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch courses');
    }

    return result;
  },

  getCourseById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch course details');
    }

    return result;
  },

  createCourse: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create course');
    }

    return result;
  },

  updateCourse: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update course');
    }

    return result;
  },
};

// Trainers API Service
export const trainersApi = {
  getTrainers: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/trainers?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch trainers');
    }

    return result;
  },

  getTrainerById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch trainer details');
    }

    return result;
  },

  createTrainer: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create trainer');
    }

    return result;
  },

  updateTrainer: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update trainer');
    }

    return result;
  },

  deleteTrainer: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete trainer');
    }

    return result;
  },
};

// Branches API Service
export const branchesApi = {
  getBranches: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branches`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch branches');
    }

    return result;
  },
};

// Dashboard API Service
export const dashboardApi = {
  getStats: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch dashboard stats');
    }

    return result;
  },
};

// Admissions API Service
export const admissionsApi = {
  getAdmissions: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/admissions?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch admissions');
    }

    return result;
  },

  getAdmissionById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/admissions/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch admission');
    }

    return result;
  },

  createAdmission: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/admissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create admission');
    }

    return result;
  },

  updateAdmission: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/admissions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update admission');
    }

    return result;
  },

  deleteAdmission: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/admissions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete admission');
    }

    return result;
  },
};

// Storage utilities
export const storage = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },

  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  removeToken: () => {
    localStorage.removeItem('auth_token');
  },

  setUser: (user: any) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    localStorage.removeItem('user');
  },

  clear: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },
};
