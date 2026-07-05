import api from './axios'

export const authApi = {
  register(payload) {
    return api.post('/auth/register', payload)
  },
  login(payload) {
    return api.post('/auth/login', payload)
  },
  logout() {
    return api.post('/auth/logout')
  },
  me() {
    return api.get('/auth/me')
  },
}

export default authApi
