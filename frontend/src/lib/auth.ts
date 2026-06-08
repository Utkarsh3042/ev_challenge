import { api, ApiClientError } from './api';

export const ADMIN_COOKIE = 'admin_token';

export async function getAdminSession() {
  try {
    return await api.adminMe();
  } catch {
    return null;
  }
}

export async function logoutAdmin(): Promise<boolean> {
  try {
    await api.adminLogout();
    return true;
  } catch (err) {
    if (err instanceof ApiClientError) return err.status !== 401;
    return false;
  }
}
