import axios from 'axios';
import { router } from 'expo-router';
import { BASE_URL } from './api';
import { Storage } from './storage';

let logoutInProgress = false;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

const scheduleLogoutAt = (expiresAt: number) => {
  if (expiryTimer) clearTimeout(expiryTimer);
  const delay = expiresAt - Date.now();
  if (delay <= 0) {
    void clearSession();
    return;
  }
  expiryTimer = setTimeout(() => void clearSession(), delay);
};

const clearSession = async () => {
  if (logoutInProgress) return;
  logoutInProgress = true;

  const refreshToken = await Storage.getItem('refreshToken');
  if (refreshToken) {
    try {
      await axios.post(`${BASE_URL}/api/auth/logout`, { refreshToken }, { timeout: 3000 });
    } catch {
      // The local session must still end if the server cannot be reached.
    }
  }

  await Promise.all([
    Storage.removeItem('token'),
    Storage.removeItem('refreshToken'),
    Storage.removeItem('userId'),
    Storage.removeItem('role'),
    Storage.removeItem('tokenExpiresAt'),
  ]);
  router.replace('/auth/login');
};

export const resetAuthLogoutState = () => {
  logoutInProgress = false;
  if (expiryTimer) clearTimeout(expiryTimer);
};

export const scheduleAuthLogout = async (expiresInSeconds: number) => {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  await Storage.setItem('tokenExpiresAt', String(expiresAt));
  scheduleLogoutAt(expiresAt);
};

void Storage.getItem('tokenExpiresAt').then((value) => {
  const expiresAt = Number(value);
  if (Number.isFinite(expiresAt) && expiresAt > 0) scheduleLogoutAt(expiresAt);
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = String(error.config?.url || '');
    const isAuthRequest = /\/api\/auth\/(login|refresh|logout)(?:\?|$)/.test(requestUrl);

    if (error.response?.status === 401 && !isAuthRequest) {
      await clearSession();
    }

    return Promise.reject(error);
  },
);
