import axios from 'axios'

// Configure global axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true, // CRITICAL: Required for httpOnly JWT cookies (DEC-005)
  headers: {
    'Content-Type': 'application/json',
  }
})

// Optional interceptors for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We can handle global 401s here to trigger a logout
    if (error.response && error.response.status === 401) {
      // e.g. window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default api
