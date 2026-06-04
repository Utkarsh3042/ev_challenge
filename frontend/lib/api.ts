/**
 * Typed API client. Works in both browser and RSC contexts.
 *
 * - In the browser it does absolute fetches using `NEXT_PUBLIC_API_BASE_URL`
 *   so the call goes straight to FastAPI.
 * - On the server (RSC) it can also do relative `/api/...` fetches if a
 *   rewrite is configured, but we keep things explicit and always use
 *   the configured base URL.
 */

import type {
  ApiError,
  MetaOptions,
  MetaSummary,
  ReferralValidation,
  RiderDetail,
  RiderListItem,
  RiderSubmit,
  RiderSubmitResponse,
  ScoreResponse,
  SegmentListResponse,
  StatsResponse,
  WhatsAppMessage,
  LeaderboardEntry,
} from './types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export class ApiClientError extends Error {
  status: number;
  payload: ApiError | null;
  constructor(message: string, status: number, payload: ApiError | null = null) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

type FetchOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
};

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = 'GET', body, query, headers, signal, cache, next } = opts;
  const qs = query
    ? '?' +
      Object.entries(query)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const url = `${BASE_URL}${path}${qs}`;

  const init: RequestInit = {
    method,
    headers: {
      Accept: 'application/json',
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    signal,
    cache,
    ...(next ? { next } : {}),
  };
  if (body != null) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  // For RSC fetches we want to forward cookies for admin auth
  if (typeof window === 'undefined') {
    (init as RequestInit & { credentials?: RequestCredentials }).credentials = 'include';
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    throw new ApiClientError(
      err instanceof Error ? err.message : 'Network error',
      0,
    );
  }

  if (res.status === 204) return undefined as T;

  // Try to parse JSON; tolerate empty bodies.
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const errPayload =
      data && typeof data === 'object' && 'error' in (data as object)
        ? ((data as { error: ApiError }).error)
        : null;
    const message =
      errPayload?.message ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${res.status}`;
    throw new ApiClientError(message, res.status, errPayload);
  }
  return data as T;
}

/* ===========================================================================
 * Public endpoints
 * ========================================================================*/

export const api = {
  baseUrl: BASE_URL,

  /* Rider */
  submitRider: (data: RiderSubmit) =>
    request<RiderSubmitResponse>('/api/riders/submit', { method: 'POST', body: data }),

  getScore: (phone: string) =>
    request<ScoreResponse>('/api/riders/score', { query: { phone } }),

  getQrPngUrl: (code: string) => `${BASE_URL}/api/riders/qr/${encodeURIComponent(code)}.png`,

  validateReferral: (code: string) =>
    request<ReferralValidation>(
      `/api/riders/validate-referral/${encodeURIComponent(code)}`,
    ),

  /* Meta */
  getMetaOptions: () => request<MetaOptions>('/api/meta/options', { next: { revalidate: 600 } }),
  getCities: () => request<string[]>('/api/meta/cities', { next: { revalidate: 3600 } }),
  getMetaSummary: () =>
    request<MetaSummary>('/api/meta/stats/summary', { next: { revalidate: 60 } }),

  /* Admin */
  adminLogin: (email: string, password: string) =>
    request<{ success: boolean; admin_id: string; email: string }>('/api/admin/login', {
      method: 'POST',
      body: { email, password },
    }),
  adminLogout: () => request<{ success: boolean }>('/api/admin/logout', { method: 'POST' }),
  adminMe: () => request<{ admin_id: string; email: string }>('/api/admin/me'),

  getStats: () => request<StatsResponse>('/api/admin/stats'),
  listRiders: (params: {
    city?: string;
    vehicle?: string;
    platform?: string;
    language?: string;
    segment?: string;
    q?: string;
    page?: number;
    page_size?: number;
  } = {}) =>
    request<RiderListItem[]>('/api/admin/riders', {
      query: { ...params },
      cache: 'no-store',
    }),
  getRider: (id: string) => request<RiderDetail>(`/api/admin/riders/${id}`, { cache: 'no-store' }),

  getLeaderboard: (limit = 50) =>
    request<LeaderboardEntry[]>('/api/admin/leaderboard', { query: { limit } }),

  getSegment: (name: string, page = 1, page_size = 50) =>
    request<SegmentListResponse>(`/api/admin/segments/${encodeURIComponent(name)}`, {
      query: { page, page_size },
    }),

  getExportUrl: (params: { city?: string; vehicle?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.city) qs.set('city', params.city);
    if (params.vehicle) qs.set('vehicle', params.vehicle);
    return `${BASE_URL}/api/admin/export${qs.size ? `?${qs.toString()}` : ''}`;
  },

  listMessages: (limit = 50) =>
    request<WhatsAppMessage[]>('/api/admin/messages', { query: { limit } }),
};

export { BASE_URL as API_BASE_URL };
