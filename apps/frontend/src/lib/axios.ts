import axios, { AxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { useAuthStore } from '../features/auth/store/auth.store';
import { callToast } from './toast-singleton';

export type RetriableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
  suppressUnauthorizedRedirect?: boolean;
};

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const requestUrl = originalRequest?.url || '';
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register') &&
      !requestUrl.includes('/auth/refresh') &&
      !requestUrl.includes('/auth/logout')
    ) {
      originalRequest._retry = true;

      try {
        await apiClient.post('/auth/refresh', undefined, {
          skipAuthRefresh: true,
          suppressUnauthorizedRedirect: originalRequest.suppressUnauthorizedRedirect,
        } as RetriableRequestConfig);

        return apiClient.request(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        if (!originalRequest.suppressUnauthorizedRedirect) {
          callToast('error', 'Session expired');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    if (!error.response) {
      callToast('error', 'Network error. Check your connection.');
      return Promise.reject(error);
    }

    if (status === 401) {
      useAuthStore.getState().logout();
      if (!originalRequest?.suppressUnauthorizedRedirect) {
        callToast('error', 'Session expired');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      callToast('error', 'You do not have permission to do this');
    } else if (status === 422) {
      callToast('error', message || 'The request could not be processed.');
    } else if (status >= 500) {
      callToast('error', 'Server error. Please try again.');
    }
    return Promise.reject(error.response?.data || error);
  }
);
