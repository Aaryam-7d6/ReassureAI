import api from './axios'

export const reportApi = {
  upload(file) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list() {
    return api.get('/reports')
  },
  get(id) {
    return api.get(`/reports/${id}`)
  },
}

export default reportApi
