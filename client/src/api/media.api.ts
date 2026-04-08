import apiClient from './client'

export const mediaApi = {
  upload: (formData: FormData) =>
    apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (patientId: string) =>
    apiClient.get('/media', { params: { patientId } }),
  delete: (id: string) => apiClient.delete('/media/' + id),
}
