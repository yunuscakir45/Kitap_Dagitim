import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const studentApi = {
    getAll: () => api.get('/students'),
    create: (data) => api.post('/students', data),
    createMany: (data) => api.post('/students/bulk', data),
    delete: (id) => api.delete(`/students/${id}`),
};

export const bookApi = {
    getAll: () => api.get('/books'),
    create: (data) => api.post('/books', data),
    delete: (id) => api.delete(`/books/${id}`),
};

export const distributionApi = {
    getAll: () => api.get('/distributions'),
    run: (data) => api.post('/distributions/run', data),
    undo: (id) => api.post(`/distributions/${id}/undo`),
    getStudentHistory: (id) => api.get(`/distributions/history/student/${id}`),
};

export const adminApi = {
    resetAll: (data) => api.post('/admin/reset-all', data),
};

export default api;
