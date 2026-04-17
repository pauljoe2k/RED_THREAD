import axios from 'axios';
import { type UserInfo } from './auth';

// ─── Base URL ─────────────────────────────────────────────────────────────────
// NEXT_PUBLIC_API_URL must be set in Vercel → Settings → Environment Variables.
// Fallback to localhost ONLY in development so a missing var is obvious in prod.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error(
    '[api.ts] NEXT_PUBLIC_API_URL is not set. ' +
    'Add it in Vercel → Project Settings → Environment Variables.'
  );
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // withCredentials: true — makes the browser send the httpOnly JWT cookie
  // on every request. Without this flag cross-origin cookies are blocked.
  withCredentials: true,
});

// ─── Response: unwrap backend envelope { success, data } ─────────────────────
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Token is NOT returned in the response body — it lives in the httpOnly cookie.
// Response data shape: UserInfo { _id, username, email }

export const registerUser = (data: { username: string; email: string; password: string }) =>
  api.post<UserInfo>('/auth/register', data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post<UserInfo>('/auth/login', data);

/** Clears the httpOnly JWT cookie on the backend. */
export const logoutUser = () => api.post('/auth/logout');

export const getMe = () => api.get<UserInfo>('/auth/me');

// ─── Conspiracy Nodes ─────────────────────────────────────────────────────────
interface NodeData {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  createdBy: { _id: string; username: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export const fetchNodes  = (params?: { page?: number; limit?: number }) =>
  api.get('/nodes', { params });

export const fetchNode   = (id: string) => api.get<NodeData>(`/nodes/${id}`);

export const createNode  = (data: { title: string; description: string; tags?: string[] }) =>
  api.post<NodeData>('/nodes', data);

export const updateNode  = (
  id: string,
  data: { title?: string; description?: string; tags?: string[] }
) => api.put<NodeData>(`/nodes/${id}`, data);

export const deleteNode  = (id: string) => api.delete<{ message: string }>(`/nodes/${id}`);

// ─── Red Threads ──────────────────────────────────────────────────────────────
interface ThreadData {
  _id: string;
  fromNode: { _id: string; title: string };
  toNode:   { _id: string; title: string };
  type: string;
  description: string;
  createdBy: { _id: string; username: string; email: string };
  createdAt: string;
}

export const fetchThreads = (params?: { page?: number; limit?: number }) =>
  api.get('/threads', { params });

export const fetchThread       = (id: string) => api.get<ThreadData>(`/threads/${id}`);
export const fetchThreadsByNode = (nodeId: string) => api.get<ThreadData[]>(`/threads/node/${nodeId}`);

export const createThread = (data: {
  fromNode: string;
  toNode: string;
  type: string;
  description?: string;
}) => api.post<ThreadData>('/threads', data);

export const updateThread = (id: string, data: { type?: string; description?: string }) =>
  api.put<ThreadData>(`/threads/${id}`, data);

export const deleteThread = (id: string) => api.delete<{ message: string }>(`/threads/${id}`);

// ─── Error message extractor ──────────────────────────────────────────────────
export const getErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    return res?.data?.message || fallback;
  }
  return fallback;
};

export default api;
