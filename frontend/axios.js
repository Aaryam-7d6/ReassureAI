import axios from 'axios';

// Global Axios instance configured according to DEC-005
const apiClient = axios.create({
    baseURL: '/api/v1', // Proxy handles routing to http://localhost:5000
    withCredentials: true, // REQUIRED: Ensures httpOnly JWT cookies are sent automatically
    headers: {
        'Content-Type': 'application/json'
    }
});

export default apiClient;