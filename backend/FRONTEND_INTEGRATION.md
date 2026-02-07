# Fortune Campus API - Frontend Integration Guide

Quick reference guide for frontend developers to integrate with the backend API.

## 🔗 Base Configuration

```typescript
// config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'API request failed');
    }

    return data.data;
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  patch(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
```

## 🔐 Authentication

### Login
```typescript
// services/auth.service.ts
export const authService = {
  async login(email: string, password: string) {
    const data = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('authToken', data.token);
    return data;
  },

  async register(userData: any) {
    const data = await apiClient.post('/auth/register', userData);
    localStorage.setItem('authToken', data.token);
    return data;
  },

  async getCurrentUser() {
    return await apiClient.get('/auth/me');
  },

  logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  },
};
```

### Usage in Component
```typescript
// pages/Login.tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const result = await authService.login(email, password);
    console.log('Logged in user:', result.user);
    navigate('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    setError('Invalid credentials');
  }
};
```

## 📊 Dashboard Data

```typescript
// services/dashboard.service.ts
export const dashboardService = {
  async getStats() {
    return await apiClient.get('/reports/branch');
  },

  async getRecentPlacements() {
    return await apiClient.get('/reports/placements');
  },
};
```

## 🎯 Leads Management

```typescript
// services/lead.service.ts
export const leadService = {
  async getLeads(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/leads?${query}`);
  },

  async getLeadById(id: string) {
    return await apiClient.get(`/leads/${id}`);
  },

  async createLead(leadData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    source: string;
    interestedCourse?: string;
    notes?: string;
    branchId?: string;
  }) {
    return await apiClient.post('/leads', leadData);
  },

  async updateLead(id: string, updates: any) {
    return await apiClient.put(`/leads/${id}`, updates);
  },

  async deleteLead(id: string) {
    return await apiClient.delete(`/leads/${id}`);
  },

  async convertToAdmission(leadId: string, admissionData: {
    courseId: string;
    feeAmount: number;
    batchName?: string;
  }) {
    return await apiClient.post(`/leads/${leadId}/convert`, admissionData);
  },
};
```

### Usage in Component
```typescript
// pages/Leads.tsx
const [leads, setLeads] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchLeads() {
    try {
      const data = await leadService.getLeads({ page: 1, limit: 20 });
      setLeads(data.leads);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }
  fetchLeads();
}, []);
```

## 🎓 Students Management

```typescript
// services/student.service.ts
export const studentService = {
  async getStudents(params?: {
    page?: number;
    limit?: number;
    courseId?: string;
    search?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/students?${query}`);
  },

  async getStudentById(id: string) {
    return await apiClient.get(`/students/${id}`);
  },

  async createStudent(studentData: {
    admissionId: string;
    enrollmentNumber: string;
    currentSemester?: number;
    cgpa?: number;
  }) {
    return await apiClient.post('/students', studentData);
  },

  async updateStudent(id: string, updates: any) {
    return await apiClient.put(`/students/${id}`, updates);
  },
};
```

## 👨‍🏫 Trainers Management

```typescript
// services/trainer.service.ts
export const trainerService = {
  async getTrainers(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/trainers?${query}`);
  },

  async createTrainer(trainerData: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    employeeId: string;
    specialization?: string;
    experience?: number;
    qualification?: string;
    branchId?: string;
  }) {
    return await apiClient.post('/trainers', trainerData);
  },
};
```

## 📚 Courses Management

```typescript
// services/course.service.ts
export const courseService = {
  async getCourses(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/courses?${query}`);
  },

  async getCourseById(id: string) {
    return await apiClient.get(`/courses/${id}`);
  },

  async createCourse(courseData: {
    name: string;
    code: string;
    description?: string;
    duration: number;
    fees: number;
    syllabus?: string;
    branchId?: string;
  }) {
    return await apiClient.post('/courses', courseData);
  },

  async assignTrainer(courseId: string, trainerId: string) {
    return await apiClient.post(`/courses/${courseId}/trainers`, { trainerId });
  },
};
```

## ✅ Attendance Management

```typescript
// services/attendance.service.ts
export const attendanceService = {
  async getAttendance(params: {
    studentId?: string;
    courseId?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/attendance?${query}`);
  },

  async markAttendance(data: {
    studentId: string;
    courseId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    remarks?: string;
    trainerId?: string;
  }) {
    return await apiClient.post('/attendance', data);
  },

  async bulkMarkAttendance(data: {
    courseId: string;
    date: string;
    trainerId?: string;
    attendanceRecords: Array<{
      studentId: string;
      status: string;
      remarks?: string;
    }>;
  }) {
    return await apiClient.post('/attendance/bulk', data);
  },
};
```

## 💼 Portfolio Management

```typescript
// services/portfolio.service.ts
export const portfolioService = {
  async getPortfolios(params?: { studentId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/portfolios?${query}`);
  },

  async createPortfolio(data: {
    studentId: string;
    title: string;
    description?: string;
    projectUrl?: string;
    githubUrl?: string;
    technologies: string[];
    completedAt?: string;
  }) {
    return await apiClient.post('/portfolios', data);
  },

  async verifyPortfolio(id: string, isVerified: boolean) {
    return await apiClient.post(`/portfolios/${id}/verify`, { isVerified });
  },
};
```

## 🏢 Placement Management

```typescript
// services/placement.service.ts
export const placementService = {
  async getPlacements(params?: {
    studentId?: string;
    companyId?: string;
    status?: string;
    page?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/placements?${query}`);
  },

  async createPlacement(data: {
    studentId: string;
    companyId: string;
    position: string;
    package?: number;
    joiningDate?: string;
    remarks?: string;
  }) {
    return await apiClient.post('/placements', data);
  },

  async updatePlacementStatus(id: string, status: string) {
    return await apiClient.patch(`/placements/${id}/status`, { status });
  },
};
```

## 📊 Reports

```typescript
// services/report.service.ts
export const reportService = {
  async getBranchReport(branchId?: string) {
    const query = branchId ? `?branchId=${branchId}` : '';
    return await apiClient.get(`/reports/branch${query}`);
  },

  async getTrainerReport(trainerId?: string) {
    const query = trainerId ? `?trainerId=${trainerId}` : '';
    return await apiClient.get(`/reports/trainer${query}`);
  },

  async getAdmissionsReport(params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/reports/admissions?${query}`);
  },

  async getPlacementsReport(params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/reports/placements?${query}`);
  },

  async getRevenueReport(params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return await apiClient.get(`/reports/revenue?${query}`);
  },
};
```

## 🔔 Error Handling

```typescript
// utils/errorHandler.ts
export function handleApiError(error: any) {
  if (error.message.includes('token')) {
    authService.logout();
    return 'Session expired. Please login again.';
  }
  
  if (error.message.includes('Network')) {
    return 'Network error. Please check your connection.';
  }

  return error.message || 'An unexpected error occurred';
}

// Usage in component
try {
  await leadService.createLead(formData);
} catch (error) {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage);
}
```

## 🎨 Type Definitions

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CEO' | 'BRANCH_HEAD' | 'TRAINER' | 'STUDENT';
  branchId: string | null;
  branch?: Branch;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  source: string;
  status: string;
  interestedCourse?: string;
  branchId: string;
  createdAt: string;
}

export interface Student {
  id: string;
  enrollmentNumber: string;
  currentSemester?: number;
  cgpa?: number;
  user: User;
  course: Course;
  branch: Branch;
}

// Add more types as needed...
```

## 🚀 Usage Examples

### Creating a Lead Form
```typescript
const LeadForm: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    interestedCourse: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leadService.createLead(formData);
      toast.success('Lead created successfully!');
      navigate('/leads');
    } catch (error) {
      toast.error(handleApiError(error));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Displaying Student List with Pagination
```typescript
const StudentList: React.FC = () => {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchStudents() {
      const data = await studentService.getStudents({ page, limit: 20 });
      setStudents(data.students);
      setTotalPages(data.meta.totalPages);
    }
    fetchStudents();
  }, [page]);

  return (
    <div>
      <StudentTable data={students} />
      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
      />
    </div>
  );
};
```

## ⚙️ Environment Variables

Add to your `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://api.fortunecampus.com/api
```

## 📝 Best Practices

1. **Always handle errors** - Use try-catch blocks
2. **Show loading states** - Improve UX during API calls
3. **Use TypeScript** - Define interfaces for all API responses
4. **Cache when possible** - Use React Query or SWR for better performance
5. **Secure tokens** - Store JWT securely, clear on logout
6. **Validate inputs** - Client-side validation before API calls

## 🔍 Testing API Calls

Use browser console or Postman:
```javascript
// In browser console (after login)
fetch('http://localhost:5000/api/students', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
})
.then(r => r.json())
.then(console.log);
```

---

For complete API documentation, see [README.md](./README.md)
