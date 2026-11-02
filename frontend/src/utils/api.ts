const API_URL = import.meta.env.VITE_API_URL

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = sessionStorage.getItem('aparassist_token')

  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })
}