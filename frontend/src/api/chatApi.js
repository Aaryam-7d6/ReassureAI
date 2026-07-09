import api from './axios'

export const chatApi = {
  sendMessage(payload, { signal } = {}) {
    return api.post('/chat', payload, { signal })
  },
  history(params = {}) {
    return api.get('/chat/history', { params })
  },
  getConversation(id) {
    return api.get(`/chat/${id}`)
  },
  deleteConversation(id) {
    return api.delete(`/chat/${id}`)
  },
}

export default chatApi
