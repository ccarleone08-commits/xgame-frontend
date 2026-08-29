const DEFAULT_API_BASE_URL = 'https://api.xgame.game';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const trimEnvValue = (value) => String(value || '').trim();

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
);

export const HEALTHCHECK_URL = trimEnvValue(import.meta.env.VITE_HEALTHCHECK_URL);

export const isHealthcheckConfigured = HEALTHCHECK_URL.length > 0;

export const SUPPORT_HUB_URL =
  trimTrailingSlash(import.meta.env.VITE_SUPPORT_HUB_URL) || `${API_BASE_URL}/hubs/support`;

export const buildApiAbsoluteUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(String(path))) return path;
  return `${API_BASE_URL}${String(path).startsWith('/') ? '' : '/'}${path}`;
};
