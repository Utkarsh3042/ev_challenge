/**
 * Server-side helpers for admin auth.
 *
 * The backend stores the JWT in an httpOnly `admin_token` cookie. On the
 * frontend, we forward the cookie when calling admin endpoints from RSC,
 * and we redirect to /admin/login if the backend rejects the request.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiClientError } from './api';

export const ADMIN_COOKIE = 'admin_token';

export async function getAdminSession() {
  // For RSC, we use a direct call to /api/admin/me and let it read the cookie.
  try {
    return await api.adminMe();
  } catch {
    return null;
  }
}

/** Throws a redirect to /admin/login if not authenticated. */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }
  return session!;
}

/** Read the raw admin token cookie (for client-side logout etc). */
export function readAdminToken(): string | undefined {
  return cookies().get(ADMIN_COOKIE)?.value;
}

/** Used by /admin/login page to detect a session and bounce to /admin. */
export async function redirectIfAuthenticated() {
  const session = await getAdminSession();
  if (session) {
    redirect('/admin');
  }
}

/** Best-effort logout that also clears the cookie on the backend. */
export async function logoutAdmin(): Promise<boolean> {
  try {
    await api.adminLogout();
    return true;
  } catch (err) {
    if (err instanceof ApiClientError) return err.status !== 401;
    return false;
  }
}
