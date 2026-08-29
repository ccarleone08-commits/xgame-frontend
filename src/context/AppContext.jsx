/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import translations from '../i18n/translations';
import { API_BASE_URL, SUPPORT_HUB_URL, buildApiAbsoluteUrl } from '../config/api';

export const AppContext = createContext(null);

// Custom hook to use the AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const getApiErrorMessage = (error, fallback = 'Something went wrong.') => {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.title === 'string' && data.title.trim()) return data.title;

  if (data?.errors && typeof data.errors === 'object') {
    const firstError = Object.values(data.errors).flat().find(Boolean);
    if (typeof firstError === 'string' && firstError.trim()) return firstError;
  }

  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return fallback;
};

const normalizeDepositRequest = (item = {}) => {
  const rawReceiptUrl =
    item.receiptUrl ||
    item.receiptPath ||
    item.receipt ||
    item.imageUrl ||
    item.fileUrl ||
    item.receiptImage ||
    null;

  const receiptUrl = rawReceiptUrl
    ? (/^https?:\/\//i.test(String(rawReceiptUrl)) || String(rawReceiptUrl).startsWith('/assets/')
      ? rawReceiptUrl
      : buildApiAbsoluteUrl(rawReceiptUrl))
    : null;

  return {
    ...item,
    id: item.id ?? item.depositRequestId ?? item.requestId ?? `${item.createDate || item.createdAt || Date.now()}`,
    historyId: `deposit-${item.id ?? item.depositRequestId ?? item.requestId ?? `${item.createDate || item.createdAt || Date.now()}`}`,
    amount: Number(item.amount) || 0,
    createDate: item.createDate || item.createdAt || item.requestDate || item.date || null,
    statusText: item.statusText || item.status || 'Pending',
    requestType: 'deposit',
    receiptUrl,
  };
};

const normalizeWithdrawRequest = (item = {}) => {
  const rawId = item.id ?? item.withdrawRequestId ?? item.requestId ?? `${item.createDate || item.createdAt || Date.now()}`;

  return {
    ...item,
    id: rawId,
    historyId: `withdraw-${rawId}`,
    amount: Number(item.amount) || 0,
    createDate: item.createDate || item.createdAt || item.requestDate || item.date || null,
    statusText: item.statusText || item.status || 'Pending',
    walletAddress: item.walletAddress || item.address || item.wallet || '',
    requestType: 'withdraw',
  };
};

const normalizeSupportMessage = (item = {}) => ({
  id: item.id ?? item.messageId ?? `${item.sentAt || item.createdAt || Date.now()}-${Math.random()}`,
  senderName: item.senderName || item.sender || item.userName || 'Support',
  content: item.content || item.message || item.text || '',
  sentAt: item.sentAt || item.createDate || item.createdAt || item.timestamp || null,
  isInternal: Boolean(item.isInternal),
});

const normalizeSupportTicket = (item = {}) => {
  const rawId = item.id ?? item.ticketId ?? item.supportTicketId ?? `${item.createDate || item.createdAt || Date.now()}`;

  return {
    ...item,
    id: rawId,
    ticketNumber: item.ticketNumber || item.number || `#${rawId}`,
    fullName: item.fullName || item.name || '',
    email: item.email || '',
    category: Number(item.category) || 0,
    priority: Number(item.priority) || 2,
    subject: item.subject || '',
    message: item.message || item.description || item.content || '',
    status: Number(item.status) || 1,
    createDate: item.createDate || item.createdAt || item.requestDate || null,
    solvedAt: item.solvedAt || item.closedAt || null,
    assignedWorkerName: item.assignedWorkerName || item.workerName || '',
    messages: Array.isArray(item.messages) ? item.messages.map((msg) => normalizeSupportMessage(msg)) : [],
  };
};

const getLanguageLocale = (lang) => {
  switch (lang) {
    case 'tr':
      return 'tr-TR';
    case 'hi':
      return 'hi-IN';
    case 'ar':
      return 'ar';
    case 'ru':
      return 'ru-RU';
    case 'uz':
      return 'uz-UZ';
    case 'en':
    default:
      return 'en-US';
  }
};

const parseRecentGameDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const rawValue = String(value).trim();
  if (!rawValue) return null;

  // Backend often sends GMT+0 time without timezone suffix.
  // In that case, treat it as UTC so the browser converts it to the device timezone.
  const normalizedValue = rawValue.includes(' ') && !rawValue.includes('T')
    ? rawValue.replace(' ', 'T')
    : rawValue;
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(normalizedValue);
  const parsedDate = new Date(hasTimezone ? normalizedValue : `${normalizedValue}Z`);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  const fallbackDate = new Date(rawValue);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

const isLocalProfileHost = (host) =>
  host === 'localhost' ||
  host === '0.0.0.0' ||
  host.startsWith('127.') ||
  host.startsWith('192.168.') ||
  host.endsWith('.local');

const stripServiceSubdomain = (host) => host.replace(/^(api|www)\./i, '');

const ensureProfileImageApiHost = (url) => {
  const host = url.hostname;
  if (isLocalProfileHost(host) || host.startsWith('api.')) return url;
  url.hostname = `api.${stripServiceSubdomain(host)}`;
  return url;
};

const buildProfileImageApiBaseUrl = (baseUrl) => {
  try {
    const url = new URL(baseUrl);
    ensureProfileImageApiHost(url);
    return url.toString().replace(/\/+$/, '');
  } catch {
    return API_BASE_URL;
  }
};

const PROFILE_IMAGE_API_BASE_URL = buildProfileImageApiBaseUrl(API_BASE_URL);

const buildProfileImageApiUrl = (path) => {
  if (!path) return PROFILE_IMAGE_API_BASE_URL;
  const value = String(path).trim();
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const apiBaseUrl = new URL(PROFILE_IMAGE_API_BASE_URL);
      if (stripServiceSubdomain(url.hostname) === stripServiceSubdomain(apiBaseUrl.hostname)) {
        ensureProfileImageApiHost(url);
      }
      return url.toString();
    } catch {
      return value;
    }
  }
  return `${PROFILE_IMAGE_API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

// Normalize image URL coming from backend.
// - If it's a bundled gallery/public asset -> return app-local path
// - Otherwise treat it as a backend profile image path and prefix with api. host
const getImageUrl = (img) => {
  if (!img) return null;
  const trimmed = String(img).trim();
  if (/^data:/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return buildProfileImageApiUrl(trimmed);

  // Handle gallery profile images stored as bare filenames
  const galleryNameRegex = /^profilePhoto\d*\.png$/i;
  if (galleryNameRegex.test(trimmed)) {
    return `/assets/gallery/${trimmed}`;
  }

  if (trimmed.startsWith('/assets/')) {
    return trimmed;
  }

  return buildProfileImageApiUrl(trimmed);
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'en');
  const [recentGames, setRecentGames] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [depositRequestsLoading, setDepositRequestsLoading] = useState(false);
  const [depositRequestSubmitting, setDepositRequestSubmitting] = useState(false);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [withdrawRequestsLoading, setWithdrawRequestsLoading] = useState(false);
  const [withdrawRequestSubmitting, setWithdrawRequestSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔧 Axios instance
  // const api = axios.create({
  //   baseURL: API_BASE,
  //   withCredentials: true,
  // });
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' // ngrok üçün
      }
    });

    // 🧩 Token interceptor
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, []);

  // 👤 USER məlumatlarını çək
  const getUserProfile = useCallback(async () => {

    try {
      setLoading(true);
      const res = await api.get("/api/Auths/GetCurrentUser/current", { withCredentials: true });
      console.log("User data:", res.data);
      const userData = res.data || {};
      // Normalize image URL so UI can use it directly
      if (userData.image) userData.image = getImageUrl(userData.image);
      setUser(userData);
      setBalance(userData.balance || 0);
    } catch (err) {
      console.error("User fetch error:", err);
      setIsAuthenticated(false);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, [api]);

  // 🚀 İlk açılışda token varsa user-i çək
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      getUserProfile();
    }
    // Load language from localStorage or default
    const savedLang = localStorage.getItem('app_language') || 'en';
    setLanguage(savedLang);
    // set document direction
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  }, [getUserProfile]);

  // 🔑 LOGIN
  const login = async (credentials) => {
    try {

      setLoading(true);
      const res = await api.post("/api/Auths/Login", credentials);
      const token = typeof res.data === "string" ? res.data : res.data.token;

      if (token) {
        localStorage.setItem("token", token);
        setIsAuthenticated(true);
        await getUserProfile();
        navigate("/games");
        return { success: true };
      } else {
        return { success: false, error: "Token tapılmadı" };
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      return { success: false, error: err.response?.data || err.message };
    } finally {
      setLoading(false);
    }
  };

  // 📝 REGISTER
  const register = async (userData) => {
    try {
      setLoading(true);
      const payload = { ...userData };
      if (!payload.image || !String(payload.image).trim()) {
        payload.image = "profilePhoto.png";
      }

      const shouldIncludeValue = (value) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        return true;
      };

      const cleanPayload = Object.keys(payload).reduce((acc, key) => {
        const val = payload[key];
        if (shouldIncludeValue(val)) acc[key] = val;
        return acc;
      }, {});

      let res;
      const imageVal = cleanPayload.image;
      const isDataUrl = typeof imageVal === 'string' && imageVal.startsWith('data:');
      const isFile = typeof File !== 'undefined' && imageVal instanceof File;

      if (isDataUrl || isFile) {
        let file = isFile ? imageVal : dataUrlToFile(imageVal, 'profile_upload.png');
        if (file) {
          file = await compressImageFile(file, {
            maxWidth: 512,
            maxHeight: 512,
            maxBytes: 600 * 1024,
          });
        }
        const formData = new FormData();
        Object.entries(cleanPayload).forEach(([key, value]) => {
          if (key === 'image') return; // handled separately as file
          formData.append(key, value);
        });
        formData.append('Image', file || 'profilePhoto.png');
        res = await axios.post(
          buildApiAbsoluteUrl('/api/Auths/Register'),
          formData,
          {
            withCredentials: true,
            headers: {
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );
      } else {
        try {
          res = await api.post("/api/Auths/Register", cleanPayload);
        } catch (err) {
          if (err?.response?.status === 415) {
            const formData = new FormData();
            Object.entries(cleanPayload).forEach(([key, value]) => {
              formData.append(key, value);
            });
            if (!formData.has('image')) {
              formData.append('image', 'profilePhoto.png');
            }
            res = await axios.post(
              buildApiAbsoluteUrl('/api/Auths/Register'),
              formData,
              {
                withCredentials: true,
                headers: {
                  'ngrok-skip-browser-warning': 'true',
                },
              }
            );
          } else {
            throw err;
          }
        }
      }
      const token = typeof res.data === "string" ? res.data : res.data.token;

      if (token) {
        localStorage.setItem("token", token);
        setIsAuthenticated(true);
        await getUserProfile();
        navigate("/");
        return { success: true };
      } else {
        return { success: false, error: "Token tapılmadı" };
      }
    } catch (err) {
      console.error("Register error:", err.response?.data || err.message);
      return { success: false, error: err.response?.data || err.message };
    } finally {
      setLoading(false);
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setBalance(0);
    setRecentGames([]);
    setDepositRequests([]);
    setWithdrawRequests([]);
    setIsAuthenticated(false);
    navigate("/login");
  };

  // 💰 BALANCE update
  const updateBalance = (newBalance) => {
    setBalance(newBalance);
    setUser((prev) => ({ ...prev, balance: newBalance }));
  };

  const refreshBalance = useCallback(async () => {
    try {
      const res = await api.get("/api/Auths/GetCurrentUser/current", { withCredentials: true });
      const userData = res.data || {};
      if (userData.image) userData.image = getImageUrl(userData.image);
      setBalance(userData.balance || 0);
      // keep local user object in sync with refreshed profile
      setUser((prev) => ({ ...prev, ...(userData || {}) }));
    } catch (err) {
      console.error('Balance refresh error:', err);
    }
  }, [api]);

  // ⚙️ USER update (məs: profil şəkli, ad, email və s.)
  const updateUser = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setDepositRequests([]);
      setDepositRequestsLoading(false);
      setWithdrawRequests([]);
      setWithdrawRequestsLoading(false);
      setRecentGames([]);
      return;
    }
  }, [isAuthenticated]);

  // --- Language handling (simple, no external libs) ---
  const setAppLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key) => {
    const lang = language || 'en';
    return (translations[lang] && translations[lang][key]) || key;
  };

  const dataUrlToFile = (dataUrl, filename) => {
    const match = String(dataUrl).match(/^data:(.+?);base64,(.*)$/);
    if (!match) return null;
    const mime = match[1];
    const b64 = match[2];
    const byteStr = atob(b64);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    return new File([arr], filename, { type: mime });
  };

  const urlToFile = async (url, filename) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const blob = await res.blob();
    const name = filename || 'profile.png';
    return new File([blob], name, { type: blob.type || 'image/png' });
  };

  const inferFileName = (src) => {
    if (!src) return 'profile.png';
    const cleaned = String(src).split('?')[0].split('#')[0];
    const last = cleaned.substring(cleaned.lastIndexOf('/') + 1) || 'profile.png';
    return last;
  };

  const buildImageFile = async (imageSrc) => {
    if (!imageSrc) return null;
    const src = String(imageSrc);
    if (src.startsWith('data:')) {
      const name = inferFileName('profile_upload.png');
      return dataUrlToFile(src, name);
    }
    // Treat local asset paths and remote URLs the same: fetch and convert to File
    if (src.startsWith('/assets/') || /^https?:\/\//i.test(src)) {
      const name = inferFileName(src);
      return urlToFile(src, name);
    }
    // Fallback: if backend expects a stored filename, do not convert
    return null;
  };

  const compressImageFile = async (file, options) => {
    const { maxWidth, maxHeight, maxBytes } = options;
    if (!file || !file.type.startsWith('image/')) return file;
    if (file.size <= maxBytes) return file;

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
    const targetW = Math.max(1, Math.round(img.width * ratio));
    const targetH = Math.max(1, Math.round(img.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const tryQualities = [0.85, 0.75, 0.65, 0.55, 0.45];
    for (const quality of tryQualities) {
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality)
      );
      if (!blob) continue;
      if (blob.size <= maxBytes) {
        return new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      }
    }

    const fallbackBlob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.4)
    );
    return fallbackBlob
      ? new File([fallbackBlob], 'profile.jpg', { type: 'image/jpeg' })
      : file;
  };

  const updateProfileImage = async (imageSrc) => {
    let file = await buildImageFile(imageSrc);
    if (!file) {
      return { success: false, error: 'Image source not convertible to file.' };
    }
    // Avoid 413 by compressing large images before upload
    file = await compressImageFile(file, {
      maxWidth: 512,
      maxHeight: 512,
      maxBytes: 600 * 1024,
    });
    const formData = new FormData();
    formData.append('Image', file);
    // Use a plain axios call to avoid the instance default JSON content-type (causes 415)
    const res = await axios.put(
      buildProfileImageApiUrl('/api/Auths/UpdateProfileImage/profile/image'),
      formData,
      {
        withCredentials: true,
        headers: {
          Authorization: localStorage.getItem("token")
            ? `Bearer ${localStorage.getItem("token")}`
            : undefined,
          'ngrok-skip-browser-warning': 'true',
        },
      }
    );
    return { success: true, data: res.data };
  };

  // Save profile number + image locally and sync with backend
  const saveProfileSelection = async (profileNo, profileImageSrc) => {
    // Update local user object so UI reflects choice immediately
    setUser((prev) => ({
      ...prev,
      profileNo,
      profileImage: profileImageSrc,
      // also set `image` normalized so UI components reading `user.image` get updated
      image: getImageUrl(profileImageSrc) || prev?.image,
    }));

    try {
      if (isAuthenticated && profileImageSrc) {
        await updateProfileImage(profileImageSrc);
        await getUserProfile();
      }
      return { success: true };
    } catch (err) {
      console.error('Profile image update error:', err.response?.data || err.message);
      return { success: false, error: err.response?.data || err.message };
    }
  };

  const refreshDepositRequests = useCallback(async (options = {}) => {
    const { silent = false } = options;
    const token = localStorage.getItem("token");

    if (!token) {
      setDepositRequests([]);
      return { success: false, error: 'Missing auth token.', data: [] };
    }

    if (!silent) setDepositRequestsLoading(true);

    try {
      const res = await api.get("/api/deposit/my-requests");
      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.data?.result)
            ? res.data.result
            : [];

      const normalized = rawList
        .map((item) => normalizeDepositRequest(item))
        .sort((a, b) => {
          const aTime = a?.createDate ? new Date(a.createDate).getTime() : 0;
          const bTime = b?.createDate ? new Date(b.createDate).getTime() : 0;
          return bTime - aTime;
        });

      setDepositRequests(normalized);
      return { success: true, data: normalized };
    } catch (err) {
      console.error('Deposit requests fetch error:', err);
      if (err?.response?.status === 401) {
        setDepositRequests([]);
      }

      return {
        success: false,
        error: getApiErrorMessage(err, 'Could not load deposit requests.'),
        data: [],
      };
    } finally {
      if (!silent) setDepositRequestsLoading(false);
    }
  }, [api]);

  const submitDepositRequest = async ({ amount, receipt }) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return { success: false, error: 'You need to sign in again.' };
    }

    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('receipt', receipt);

    setDepositRequestSubmitting(true);

    try {
      const res = await axios.post(
        buildApiAbsoluteUrl('/api/deposit/request'),
        formData,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      await Promise.all([
        refreshDepositRequests({ silent: true }),
        refreshBalance(),
      ]);

      return { success: true, data: res.data };
    } catch (err) {
      console.error('Deposit submit error:', err);
      return {
        success: false,
        error: getApiErrorMessage(err, 'Deposit request could not be submitted.'),
      };
    } finally {
      setDepositRequestSubmitting(false);
    }
  };

  const refreshWithdrawRequests = useCallback(async (options = {}) => {
    const { silent = false } = options;
    const token = localStorage.getItem("token");

    if (!token) {
      setWithdrawRequests([]);
      return { success: false, error: 'Missing auth token.', data: [] };
    }

    if (!silent) setWithdrawRequestsLoading(true);

    try {
      const res = await api.get("/api/withdraw/my-requests");
      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.data?.result)
            ? res.data.result
            : [];

      const normalized = rawList
        .map((item) => normalizeWithdrawRequest(item))
        .sort((a, b) => {
          const aTime = a?.createDate ? new Date(a.createDate).getTime() : 0;
          const bTime = b?.createDate ? new Date(b.createDate).getTime() : 0;
          return bTime - aTime;
        });

      setWithdrawRequests(normalized);
      return { success: true, data: normalized };
    } catch (err) {
      console.error('Withdraw requests fetch error:', err);
      if (err?.response?.status === 401) {
        setWithdrawRequests([]);
      }

      return {
        success: false,
        error: getApiErrorMessage(err, 'Could not load withdraw requests.'),
        data: [],
      };
    } finally {
      if (!silent) setWithdrawRequestsLoading(false);
    }
  }, [api]);

  const submitWithdrawRequest = async ({ amount, walletAddress }) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return { success: false, error: 'You need to sign in again.' };
    }

    setWithdrawRequestSubmitting(true);

    try {
      const res = await api.post("/api/withdraw/request", {
        amount,
        walletAddress,
      });

      await Promise.all([
        refreshWithdrawRequests({ silent: true }),
        refreshBalance(),
      ]);

      return { success: true, data: res.data };
    } catch (err) {
      console.error('Withdraw submit error:', err);
      return {
        success: false,
        error: getApiErrorMessage(err, 'Withdraw request could not be submitted.'),
      };
    } finally {
      setWithdrawRequestSubmitting(false);
    }
  };

  const createSupportTicket = async (payload) => {
    try {
      const res = await api.post('/api/support/tickets', payload);
      return {
        success: true,
        data: normalizeSupportTicket(res.data),
      };
    } catch (err) {
      console.error('Support ticket create error:', err);
      return {
        success: false,
        error: getApiErrorMessage(err, 'Support ticket could not be created.'),
      };
    }
  };

  const fetchMySupportTickets = async () => {
    try {
      const res = await api.get('/api/support/tickets/my');
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.data?.result)
            ? res.data.result
            : [];

      const normalized = list
        .map((item) => normalizeSupportTicket(item))
        .sort((a, b) => {
          const aTime = a?.createDate ? new Date(a.createDate).getTime() : 0;
          const bTime = b?.createDate ? new Date(b.createDate).getTime() : 0;
          return bTime - aTime;
        });

      return {
        success: true,
        data: normalized,
      };
    } catch (err) {
      console.error('Support tickets fetch error:', err);
      return {
        success: false,
        error: getApiErrorMessage(err, 'Support tickets could not be loaded.'),
        data: [],
      };
    }
  };

  const fetchSupportTicket = async (ticketId) => {
    try {
      const res = await api.get(`/api/support/tickets/${ticketId}`);
      return {
        success: true,
        data: normalizeSupportTicket(res.data),
      };
    } catch (err) {
      console.error('Support ticket detail error:', err);
      return {
        success: false,
        error: getApiErrorMessage(err, 'Support ticket detail could not be loaded.'),
      };
    }
  };

  const formatRecentGameDate = useCallback((iso) => {
    if (!iso) return '—';
    const date = parseRecentGameDateValue(iso);
    if (!date) return '—';
    const locale = getLanguageLocale(language);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    }

    const diffMinutes = diffMs / (1000 * 60);
    if (diffMinutes < 60) {
      const minutes = Math.max(1, Math.floor(diffMinutes));
      return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(-minutes, 'minute');
    }

    const diffHours = diffMinutes / 60;
    const timeLabel = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);

    if (diffHours < 24) {
      const hours = Math.max(1, Math.floor(diffHours));
      return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(-hours, 'hour');
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays <= 7) {
      const dayLabel = new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(-diffDays, 'day');
      return `${dayLabel} ${timeLabel}`;
    }

    const dateLabel = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);

    return `${dateLabel} ${timeLabel}`;
  }, [language]);

  const formatRecentGameName = useCallback((value) => {
    const raw = String(value || '').trim();
    if (!raw) return 'Unknown';

    const normalized = raw
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .toLowerCase();

    const specialMap = {
      'back gammon': 'Backgammon',
    };

    if (specialMap[normalized]) return specialMap[normalized];

    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const formatRecentGameAmount = useCallback((amount) => {
    const value = Math.abs(Number(amount) || 0);
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, '');
    return formatted;
  }, []);

  const fetchRecentGamesHistory = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setRecentGames([]);
      return { success: false, error: 'Missing auth token.', data: [] };
    }

    try {
      const res = await api.get('/api/Leaderboard/player/all');
      const data = Array.isArray(res.data) ? res.data : (res.data && res.data.result) || [];

      const transformed = (data || [])
        .flatMap((gameItem, gameIndex) => {
          const gameName = formatRecentGameName(gameItem?.gameType || gameItem?.GameType);
          const sessions = Array.isArray(gameItem?.recentSessions) ? gameItem.recentSessions : [];

          return sessions.map((session, sessionIndex) => {
            const playedAt = session?.playedAt || gameItem?.lastGamePlayed || gameItem?.rankLastUpdated || null;
            const isWin = Boolean(session?.isWin);
            const rawAmount = isWin ? session?.sessionEarnings : session?.sessionLossAmount;
            const coins = `${isWin ? '+' : '-'}${formatRecentGameAmount(rawAmount)}`;

            return {
              id: `${gameName}-${playedAt || gameIndex}-${sessionIndex}`,
              game: gameName,
              result: isWin ? 'Win' : 'Loss',
              coins,
              date: formatRecentGameDate(playedAt),
              playedAt,
            };
          });
        })
        .sort((a, b) => {
          const aTime = parseRecentGameDateValue(a?.playedAt)?.getTime() || 0;
          const bTime = parseRecentGameDateValue(b?.playedAt)?.getTime() || 0;
          return bTime - aTime;
        });

      setRecentGames(transformed);
      return { success: true, data: transformed };
    } catch (err) {
      console.error('Recent games history fetch error:', err);
      return {
        success: false,
        error: getApiErrorMessage(err, 'Could not load recent games.'),
        data: [],
      };
    }
  }, [api, formatRecentGameAmount, formatRecentGameDate, formatRecentGameName]);

  // Keep profile history fresh only while the profile page is active.
  useEffect(() => {
    if (!isAuthenticated || !location.pathname.startsWith('/profile')) return;
    fetchRecentGamesHistory();
  }, [fetchRecentGamesHistory, isAuthenticated, location.pathname, user?.id]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!isAuthenticated || !token) return;

    refreshBalance();

  }, [
    isAuthenticated,
    refreshBalance,
  ]);

  const value = {
    user,
    balance,
    isAuthenticated,
    loading,
    token: localStorage.getItem("token"),
    login,
    register,
    logout,
    updateBalance,
    refreshBalance,
    depositRequests,
    depositRequestsLoading,
    depositRequestSubmitting,
    withdrawRequests,
    withdrawRequestsLoading,
    withdrawRequestSubmitting,
    refreshDepositRequests,
    refreshWithdrawRequests,
    submitDepositRequest,
    submitWithdrawRequest,
    createSupportTicket,
    fetchMySupportTickets,
    fetchSupportTicket,
    supportHubUrl: SUPPORT_HUB_URL,
    updateUser,
    saveProfileSelection,
    getUserProfile,
    recentGames,
    refreshLeaderboard: fetchRecentGamesHistory,
    // language helpers
    language,
    setAppLanguage,
    t,
    // Derived profile image for components: prefer backend `image`, then local `profileImage`
    profileImage: (user && (user.image || user.profileImage)) || null,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
