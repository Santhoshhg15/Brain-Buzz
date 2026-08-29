import { useAuthStore } from "./authStore";

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    // Token expired/invalid mid-session — log the instructor out cleanly
    useAuthStore.getState().logout();
  }
  return response;
}
