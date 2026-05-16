import api from './axiosInstance';

export const submitBorrowRequest = (data) => api.post('/borrowing/request', data);
export const getSession = (code) => api.get(`/borrowing/session/${code}`);
export const confirmCollection = (code, data) => api.post(`/borrowing/confirm/${code}`, data);
export const processReturn = (data) => api.post('/borrowing/return', data);
export const getMyBorrows = (params) => api.get('/borrowing/my', { params });
export const getActiveCount = () => api.get('/borrowing/my/active-count');
export const getOverdueRecords = (params) => api.get('/borrowing/overdue', { params });
export const getAllSessions = (params) => api.get('/borrowing/sessions', { params });
export const cancelRequest = (code) => api.delete(`/borrowing/request/${code}`);
