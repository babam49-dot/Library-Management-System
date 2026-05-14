import api from './axiosInstance';

export const getAllReturns = (params) => api.get('/returns', { params });
export const getReturnByBorrowId = (borrowId) => api.get(\`/returns/borrow/\${borrowId}\`);
