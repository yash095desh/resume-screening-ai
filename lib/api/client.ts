// lib/api/client.ts
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useApiClient() {
  const { getToken } = useAuth();

  async function get(endpoint: string) {
    const token = await getToken();
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const data = await res.json().catch(() => null);
    return { res, data, ok: res.ok, status: res.status };
  }

  async function post(endpoint: string, body?: any) {
    const token = await getToken();
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await res.json().catch(() => null);
    return { res, data, ok: res.ok, status: res.status };
  }

  async function put(endpoint: string, body?: any) {
    const token = await getToken();
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await res.json().catch(() => null);
    return { res, data, ok: res.ok, status: res.status };
  }

  async function del(endpoint: string) {
    const token = await getToken();
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const data = await res.json().catch(() => null);
    return { res, data, ok: res.ok, status: res.status };
  }

  async function upload(endpoint: string, formData: FormData) {
    const token = await getToken();
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    
    const data = await res.json().catch(() => null);
    return { res, data, ok: res.ok, status: res.status };
  }

  return { get, post, put, del, upload };
}