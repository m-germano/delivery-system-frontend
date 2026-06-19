const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error('Erro ao comunicar com a API');
  }

  return response.json();
}
