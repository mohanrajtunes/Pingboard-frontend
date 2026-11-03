import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const api = axios.create({ baseURL: API });

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// When the access token has expired, swap it for a new one using the
// refresh token, then repeat the request once.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const refresh = localStorage.getItem("refresh");
    const isAuthCall = original?.url?.includes("/auth/");
    if (error.response?.status === 401 && refresh && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${API}/auth/token/refresh/`, { refresh });
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem("access", data.access);
        if (data.refresh) localStorage.setItem("refresh", data.refresh);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        refreshing = null;
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// A list endpoint may answer with a bare array or a paginated object.
export const unwrap = (data) => (Array.isArray(data) ? data : data?.results ?? []);

// Turn whatever the API said into one readable sentence.
export function errorMessage(error, fallback = "Something went wrong. Try again.") {
  if (!error?.response) return "Can't reach the server. Check your connection.";
  if (error.response.status === 429) return "Too many attempts. Wait a minute and try again.";
  const data = error.response.data;
  if (typeof data === "string") return fallback;
  if (data?.detail) return data.detail;
  const first = data && Object.values(data)[0];
  if (Array.isArray(first)) return first[0];
  if (typeof first === "string") return first;
  return fallback;
}

// Field-level errors for forms: { url: "We couldn't find that host." }
export function fieldErrors(error) {
  const data = error?.response?.data;
  if (!data || typeof data !== "object" || data.detail) return {};
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = Array.isArray(value) ? value[0] : String(value);
  }
  return out;
}

export default api;
