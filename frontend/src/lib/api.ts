// API Base URL
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Ensure it ends with /api (but only if it's the base URL)
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

console.log('🌐 API connection initialized at:', API_BASE_URL);

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
    console.log(`🔑 Attempting login at: ${API_BASE_URL}/auth/login`);
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
    // Determine if this is a public enquiry (no auth token)
    const token = storage.getToken();
    const endpoint = token ? `${API_BASE_URL}/leads` : `${API_BASE_URL}/leads/public`;

    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create lead');
    }

    return result;
  },

  createPublicLead: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/leads/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

  approveAdmission: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/admissions/${id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to approve admission');
    }

    return result;
  },

  rejectAdmission: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/admissions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'REJECTED' }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to reject admission');
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
    window.dispatchEvent(new Event('user-updated'));
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-updated'));
  },

  clear: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-updated'));
  },
};

// Students API Service
export const studentsApi = {
  getStudents: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/students?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch students');
    }

    return result;
  },

  getStudentById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch student details');
    }

    return result;
  },

  createStudent: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create student');
    }

    return result;
  },

  updateStudent: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update student');
    }

    return result;
  },

  deleteStudent: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete student');
    }

    return result;
  },
};

// Attendance API Service
export const attendanceApi = {
  getStats: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/attendance/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch attendance stats');
    }

    return result;
  },
};

// Portfolio API Service
export const portfolioApi = {
  getPortfolios: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/portfolios?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch portfolios');
    }

    return result;
  },

  getPortfolioById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch portfolio details');
    }

    return result;
  },

  createPortfolio: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create portfolio');
    }

    return result;
  },

  updatePortfolio: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update portfolio');
    }

    return result;
  },

  deletePortfolio: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete portfolio');
    }

    return result;
  },

  verifyPortfolio: async (id: string, isVerified: boolean) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/${id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ isVerified }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to verify portfolio');
    }

    return result;
  }
};

// Placement API Service
export const placementApi = {
  getPlacements: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/placements?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch placements');
    }

    return result;
  },

  getPlacementById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/placements/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch placement details');
    }

    return result;
  },

  createPlacement: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/placements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create placement');
    }

    return result;
  },

  updatePlacement: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/placements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update placement');
    }

    return result;
  },

  deletePlacement: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/placements/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete placement');
    }

    return result;
  },

  updateStatus: async (id: string, status: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/placements/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update placement status');
    }

    return result;
  }
};

// Company API Service
export const companyApi = {
  getCompanies: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/companies?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch companies');
    }

    return result;
  },

  getCompanyById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch company details');
    }

    return result;
  },

  createCompany: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create company');
    }

    return result;
  },

  updateCompany: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update company');
    }

    return result;
  },

  deleteCompany: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete company');
    }

    return result;
  }
};

// Incentives API Service
export const incentivesApi = {
  getIncentives: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/incentives?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch incentives');
    }

    return result;
  },

  getIncentiveById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/incentives/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch incentive details');
    }

    return result;
  },

  createIncentive: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/incentives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create incentive');
    }

    return result;
  },

  updateIncentive: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/incentives/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update incentive');
    }

    return result;
  },

  deleteIncentive: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/incentives/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete incentive');
    }

    return result;
  },

  markAsPaid: async (id: string, isPaid: boolean) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/incentives/${id}/paid`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ isPaid }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update incentive payment status');
    }

    return result;
  }
};

// Reports API Service
export const reportsApi = {
  getBranchReport: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/reports/branch?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch branch report');
    }

    return result;
  },

  getTrainerReport: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/reports/trainer?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch trainer report');
    }

    return result;
  },

  getAdmissionsReport: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/reports/admissions?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch admissions report');
    }

    return result;
  },

  getPlacementsReport: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/reports/placements?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch placements report');
    }

    return result;
  },

  getRevenueReport: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/reports/revenue?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch revenue report');
    }

    return result;
  },

  submitGrowthReport: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/growth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit growth report');
    }

    return result;
  },

  getStudentGrowthReports: async (studentId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/growth/${studentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch student growth reports');
    }

    return result;
  },

  submitFileReport: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit file report');
    }

    return result;
  },

  getTrainerPerformance: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/reports/performance?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch trainer performance');
    }

    return result;
  },

  getDailyAdmissions: async (branchId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/daily-admissions?branchId=${branchId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch daily admissions');
    return result;
  },

  getFeesPending: async (branchId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/fees-pending?branchId=${branchId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch fees pending');
    return result;
  },

  getPlacementEligible: async (branchId: string, minCgpa?: number) => {
    const token = storage.getToken();
    const query = new URLSearchParams({ branchId, minCgpa: (minCgpa || 0).toString() }).toString();
    const response = await fetch(`${API_BASE_URL}/reports/placement-eligible?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch placement eligible students');
    return result;
  },

  getExpenses: async (branchId: string, month: number, year: number) => {
    const token = storage.getToken();
    const query = new URLSearchParams({ branchId, month: month.toString(), year: year.toString() }).toString();
    const response = await fetch(`${API_BASE_URL}/reports/expenses?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch expenses');
    return result;
  },

  submitExpense: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to submit expense');
    return result;
  },

  getSocialEngagement: async (branchId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/social-engagement?branchId=${branchId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch social engagement');
    return result;
  },

  submitEventPlan: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/event-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to submit event plan');
    return result;
  },
};

// Notifications API Service
export const notificationsApi = {
  getNotifications: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/notifications?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch notifications');
    }

    return result;
  },


  getWhatsappLogs: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/notifications/whatsapp-logs?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch WhatsApp logs');
    }

    return result;
  },

  markAsRead: async (id: string = 'all') => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to mark notifications as read');
    }

    return result;
  }
};
