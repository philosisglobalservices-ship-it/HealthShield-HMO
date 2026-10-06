import api from './axios';

export const membersApi = {
  getAll: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  terminate: (id, reason) => api.post(`/members/${id}/terminate`, { reason }),
  getDependants: (id) => api.get(`/members/${id}/dependants`),
  createDependant: (id, data) => api.post(`/members/${id}/dependants`, data),
  getEnrollments: (id) => api.get(`/members/${id}/enrollments`),
  getClaims: (id) => api.get(`/members/${id}/claims`),
  getAuthorizations: (id) => api.get(`/members/${id}/authorizations`),
};

export const employersApi = {
  getAll: (params) => api.get('/employers', { params }),
  getById: (id) => api.get(`/employers/${id}`),
  create: (data) => api.post('/employers', data),
  update: (id, data) => api.put(`/employers/${id}`, data),
  getMembers: (id, params) => api.get(`/employers/${id}/members`, { params }),
  getInvoices: (id) => api.get(`/employers/${id}/invoices`),
};

export const providersApi = {
  getAll: (params) => api.get('/providers', { params }),
  getById: (id) => api.get(`/providers/${id}`),
  create: (data) => api.post('/providers', data),
  update: (id, data) => api.put(`/providers/${id}`, data),
  getClaims: (id, params) => api.get(`/providers/${id}/claims`, { params }),
  getSettlements: (id) => api.get(`/providers/${id}/settlements`),
};

export const plansApi = {
  getAll: (params) => api.get('/plans', { params }),
  getById: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  getBenefits: (id) => api.get(`/plans/${id}/benefits`),
  addBenefit: (id, data) => api.post(`/plans/${id}/benefits`, data),
};

export const enrollmentsApi = {
  getAll: (params) => api.get('/enrollments', { params }),
  getById: (id) => api.get(`/enrollments/${id}`),
  create: (data) => api.post('/enrollments', data),
  terminate: (id, reason) => api.post(`/enrollments/${id}/terminate`, { reason }),
  suspend: (id) => api.post(`/enrollments/${id}/suspend`),
  reactivate: (id) => api.post(`/enrollments/${id}/reactivate`),
};

export const authorizationsApi = {
  getAll: (params) => api.get('/authorizations', { params }),
  getById: (id) => api.get(`/authorizations/${id}`),
  create: (data) => api.post('/authorizations', data),
  update: (id, data) => api.put(`/authorizations/${id}`, data),
  approve: (id, data) => api.post(`/authorizations/${id}/approve`, data),
  deny: (id, data) => api.post(`/authorizations/${id}/deny`, data),
  cancel: (id) => api.post(`/authorizations/${id}/cancel`),
};

export const claimsApi = {
  getAll: (params) => api.get('/claims', { params }),
  getById: (id) => api.get(`/claims/${id}`),
  create: (data) => api.post('/claims', data),
  submit: (id) => api.post(`/claims/${id}/submit`),
  approve: (id, data) => api.post(`/claims/${id}/approve`, data),
  deny: (id, data) => api.post(`/claims/${id}/deny`, data),
  pay: (id) => api.post(`/claims/${id}/pay`),
  appeal: (id, data) => api.post(`/claims/${id}/appeal`, data),
};

export const financeApi = {
  getInvoices: (params) => api.get('/finance/invoices', { params }),
  createInvoice: (data) => api.post('/finance/invoices', data),
  payInvoice: (id, data) => api.post(`/finance/invoices/${id}/pay`, data),
  getPayments: (params) => api.get('/finance/payments', { params }),
  getSettlements: (params) => api.get('/finance/settlements', { params }),
  createSettlement: (data) => api.post('/finance/settlements', data),
  getSummary: () => api.get('/finance/reports/summary'),
};

export const casesApi = {
  getAll: (params) => api.get('/cases', { params }),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.put(`/cases/${id}`, data),
  resolve: (id, data) => api.post(`/cases/${id}/resolve`, data),
  close: (id) => api.post(`/cases/${id}/close`),
};

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  disable: (id) => api.post(`/users/${id}/disable`),
  getRoles: () => api.get('/roles'),
  createRole: (data) => api.post('/roles', data),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export const reportsApi = {
  getMembers: (params) => api.get('/reports/members', { params }),
  getClaims: (params) => api.get('/reports/claims', { params }),
  getFinancial: (params) => api.get('/reports/financial', { params }),
  getProviders: (params) => api.get('/reports/providers', { params }),
  getUtilization: (params) => api.get('/reports/utilization', { params }),
};

export const auditApi = {
  getLogs: (params) => api.get('/audit/logs', { params }),
  getSecurityEvents: (params) => api.get('/audit/security-events', { params }),
  getNotifications: () => api.get('/audit/notifications'),
  markRead: (id) => api.put(`/audit/notifications/${id}/read`),
  markAllRead: () => api.put('/audit/notifications/all/read'),
};
