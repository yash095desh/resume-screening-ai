// lib/api/admin-client.ts
// API client for admin endpoints — uses ADMIN_SECRET from sessionStorage

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'admin_secret';

function getSecret(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

const NO_TOKEN_RESPONSE = {
  data: null,
  ok: false,
  status: 401,
};

export function useAdminClient() {
  async function get(endpoint: string) {
    const secret = getSecret();
    if (!secret) return NO_TOKEN_RESPONSE;
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json().catch(() => null);
    return { data, ok: res.ok, status: res.status };
  }

  async function post(endpoint: string, body?: any) {
    const secret = getSecret();
    if (!secret) return NO_TOKEN_RESPONSE;
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { data, ok: res.ok, status: res.status };
  }

  async function del(endpoint: string) {
    const secret = getSecret();
    if (!secret) return NO_TOKEN_RESPONSE;
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json().catch(() => null);
    return { data, ok: res.ok, status: res.status };
  }

  return { get, post, del };
}
