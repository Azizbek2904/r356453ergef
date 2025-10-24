import axios from "axios";

// ✅ Cloudflare tunnel URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "https://comprehensive-listing-driving-sources.trycloudflare.com";

console.log("🌐 API Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // CORS uchun zarur
});

// ✅ Tokenni har bir so‘rovga qo‘shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Token muddati tugasa — avtomatik yangilash
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const oldToken = localStorage.getItem("token");
      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { token: oldToken },
          { withCredentials: true }
        );
        const newToken = res.data.token;
        localStorage.setItem("token", newToken);
        error.config.headers["Authorization"] = `Bearer ${newToken}`;
        return api.request(error.config);
      } catch (refreshErr) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
