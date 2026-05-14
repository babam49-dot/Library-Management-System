import api from './axiosInstance';

export const getAllReservations = (params) => api.get('/reservations', { params });
export const getMyReservations = () => api.get('/reservations/my');
export const cancelReservation = (id) => api.delete(\`/reservations/\${id}\`);
export const getQueueForCopy = (copyId) => api.get(\`/reservations/queue/\${copyId}\`);
