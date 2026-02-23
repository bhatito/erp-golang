import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "../auth/token";

export const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true, // penting untuk cookie refresh_token
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue = [];

function flushQueue(error, token) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // hanya handle 401 dari request yang belum di-retry
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      // kalau ada refresh yang sedang jalan, ngantri
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      refreshing = true;
      try {
        const r = await api.post("/auth/refresh");
        const newToken = r.data.accessToken;
        setAccessToken(newToken);

        flushQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        flushQueue(e, null);
        clearAccessToken();
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(err);
  }
);