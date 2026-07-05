import api from './axios'

export const feedbackApi = {
  submit(messageId, vote) {
    return api.post('/feedback', { message_id: messageId, vote })
  },
}

export default feedbackApi
