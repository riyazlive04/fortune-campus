// API Base URL
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Always ensure it ends with /api
  if (!url.endsWith('/api') && !url.endsWith('/api/')) {
    url = `${url.replace(/\/$/, '')}/api`;
  }
  return url;
};

export const API_BASE_URL = getBaseUrl();
console.log('🌐 API connection initialized at:', API_BASE_URL);

// Storage utilities - defined first so all API services can use it
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

  getPublicCourses: async () => {
    const response = await fetch(`${API_BASE_URL}/courses/public/list`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch public courses');
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
  getBranchReports: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/reports`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch reports');
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

// Branch Dashboard API Service
export const branchDashboardApi = {
  getOverview: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/overview`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch overview');
    return result;
  },
  getAdmissions: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/admissions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch admissions');
    return result;
  },
  getAttendance: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/attendance`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch attendance');
    return result;
  },
  getProgress: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/progress`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch progress');
    return result;
  },
  getPortfolio: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/portfolio`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch portfolio');
    return result;
  },
  getTrainers: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/trainers`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch trainers');
    return result;
  },
  getFees: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/fees`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch fees');
    return result;
  },
  getPlacements: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/placements`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch placements');
    return result;
  },
  getCompliance: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/compliance`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch compliance');
    return result;
  },
  getBranchReports: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/branch-reports`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch branch reports');
    return result;
  },
  getPlacementStats: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/placements`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch placement stats');
    return result;
  },
  getPlacementReadiness: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/placement-readiness`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch placement readiness');
    return result;
  },
  getFeeStats: async (page = 1, limit = 20) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/fees?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch fee stats');
    return result;
  },
  updateStudentFee: async (admissionId: string, data: { feeAmount: number; feePaid: number }) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/admissions/${admissionId}/fees`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update fees');
    }
    return result;
  },
  downloadReport: async (type: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/reports/${type}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to download report');
    return response.blob();
  },
  getPortfolioStats: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/portfolio`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  getProgressStats: async (page = 1, limit = 20) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/progress?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  convertLead: async (leadId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/lead/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ leadId }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to convert lead');
    }
    return result;
  },
  getAttendanceList: async (page = 1, limit = 20, date?: string) => {
    const token = storage.getToken();
    const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (date) queryParams.append('date', date);

    const response = await fetch(`${API_BASE_URL}/branch-dashboard/attendance/list?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  uploadReport: async (data: FormData) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/branch-dashboard/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Content-Type is automatic with FormData
      },
      body: data
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to upload report');
    return result;
  },
};

// Trainer Attendance API Service
export const trainerAttendanceApi = {
  markAttendance: async (data: {
    trainerId: string;
    date: string;
    status: string;
    remarks?: string;
    inTime?: string;
    outTime?: string;
  }) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainer-attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to mark attendance');
    return result;
  },
  getHistory: async (params: { trainerId?: string; startDate?: string; endDate?: string }) => {
    const token = storage.getToken();
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/trainer-attendance/history?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch history');
    return result;
  }
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

// Placements API Service
export const placementsApi = {
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
};

// Attendance API Service
export const attendanceApi = {
  getStats: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/attendance/stats?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch attendance stats');
    return result;
  },

  markEntry: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/attendance/entry`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to mark entry');
    return result;
  },

  markExit: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/attendance/${id}/exit`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to mark exit');
    return result;
  },

  markAttendance: async (data: { studentId: string; status: string; remarks?: string; date?: string; period?: number }) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to mark attendance');
    return result;
  },

  getAttendance: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/attendance?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch attendance records');
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
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch notifications');
    return result;
  },

  getWhatsappLogs: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/notifications/whatsapp-logs?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch WhatsApp logs');
    return result;
  },

  markAsRead: async (id: string = 'all') => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to mark notifications as read');
    return result;
  }
};

// Trainer Dashboard API Service
export const trainerApi = {
  getDashboardStats: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch trainer stats');
    return result;
  },

  getBatchStudents: async (batchId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/batches/${batchId}/students`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch batch students');
    return result;
  },

  getBranchStudents: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/branch-students`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch branch students');
    return result;
  },

  getStudentDetails: async (studentId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/students/${studentId}/details`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch student details');
    return result;
  },

  checkEligibility: async (batchId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/batches/${batchId}/check-eligibility`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to check eligibility');
    return result;
  },

  getBatchTests: async (batchId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/batches/${batchId}/tests`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch tests');
    return result;
  },

  createTest: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/tests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to create test');
    return result;
  },

  getTestScores: async (testId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/tests/${testId}/scores`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch test scores');
    return result;
  },

  deleteTest: async (testId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/tests/${testId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to delete test');
    return result;
  },

  updateTestScores: async (testId: string, scores: any[]) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/tests/${testId}/scores`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ scores }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to update scores');
    return result;
  },

  getBranchReports: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/reports`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch reports');
    return result;
  },
};

// Portfolio Task API Extensions
export const portfolioTasksApi = {
  getTasks: async (courseId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/tasks/${courseId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch portfolio tasks');
    return result;
  },

  submitWork: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to submit portfolio work');
    return result;
  },

  getPendingSubmissions: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/pending`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch pending submissions');
    return result;
  },

  getStats: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch portfolio stats');
    return result;
  },

  getStudentPortfolio: async (studentId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/student/${studentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch student portfolio');
    return result;
  },

  reviewSubmission: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolios/review/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to review submission');
    return result;
  },
};

// Software Progress API
export const softwareProgressApi = {
  getBatchProgress: async (batchId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/batches/${batchId}/progress`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch batch progress');
    return result;
  },

  getBranchProgress: async () => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/branch-progress`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch branch progress');
    return result;
  },

  updateProgress: async (studentId: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/trainers/students/${studentId}/progress`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to update progress');
    return result;
  },
};

// Batch API Service
export const batchesApi = {
  getBatches: async (params?: any) => {
    const token = storage.getToken();
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/batches?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch batches');
    return result;
  },

  getBatchById: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch batch');
    return result;
  },

  createBatch: async (data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/batches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to create batch');
    return result;
  },

  updateBatch: async (id: string, data: any) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to update batch');
    return result;
  },

  deleteBatch: async (id: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to delete batch');
    return result;
  },

  assignStudents: async (batchId: string, studentIds: string[]) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/batches/${batchId}/students`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentIds })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to assign students');
    return result;
  },

  removeStudent: async (batchId: string, studentId: string) => {
    const token = storage.getToken();
    const response = await fetch(`${API_BASE_URL}/batches/${batchId}/students/${studentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to remove student');
    return result;
  }
};
