import axios from "axios";
import { authStorage } from "../modules/auth/authStorage";

const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const API_URL = configuredApiUrl || (import.meta.env.DEV ? "http://localhost:5000/api/v1" : "/api/v1");

if (import.meta.env.PROD && !configuredApiUrl) {
  // Same-origin fallback supports reverse-proxy deployments; set VITE_API_URL
  // explicitly when the API is hosted separately (for example on Render).
  console.error("VITE_API_URL is not configured. Set it to the deployed V-Sync API base URL.");
}

const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

// --------------------------------------------------
// Attach access token
// --------------------------------------------------

api.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ------------------------------------------------
    // IMPORTANT: FormData / file uploads
    // ------------------------------------------------
    //
    // Do NOT manually set multipart/form-data.
    // The browser must generate the multipart boundary.
    //
    // Without this, multer may receive no file and
    // return "Please select a file".
    // ------------------------------------------------

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      if (config.headers) {
        // Axios v1 uses AxiosHeaders, while older versions
        // may use a normal object.
        if (
          typeof config.headers.delete === "function"
        ) {
          config.headers.delete("Content-Type");
          config.headers.delete("content-type");
        } else {
          delete config.headers["Content-Type"];
          delete config.headers["content-type"];
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------------
// Refresh state
// --------------------------------------------------

let refreshPromise = null;

// --------------------------------------------------
// Response interceptor
// --------------------------------------------------

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) return Promise.reject(error);

    // Not an authentication error
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Don't try to refresh the refresh endpoint
    if (
      originalRequest?.url?.includes(
        "/auth/refresh"
      )
    ) {
      authStorage.clear();

      window.location.href = "/login";

      return Promise.reject(error);
    }

    // Don't retry the same request forever
    if (originalRequest?._retry) {
      authStorage.clear();

      window.location.href = "/login";

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken =
      authStorage.getRefreshToken();

    if (!refreshToken) {
      authStorage.clear();

      window.location.href = "/login";

      return Promise.reject(error);
    }

    // ------------------------------------------------
    // If another request is already refreshing,
    // wait for that SAME refresh operation.
    // ------------------------------------------------

    if (!refreshPromise) {
      refreshPromise = axios
        .post(
          `${API_URL}/auth/refresh`,
          {
            refreshToken,
          }
        )
        .then((response) => {
          const {
            accessToken,
            refreshToken: newRefreshToken,
          } = response.data.data;

          authStorage.setTokens(
            accessToken,
            newRefreshToken
          );

          return accessToken;
        })
        .catch((refreshError) => {
          authStorage.clear();

          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newAccessToken =
        await refreshPromise;

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      authStorage.clear();

      window.location.href = "/login";

      return Promise.reject(
        refreshError
      );
    }
  }
);

export default api;