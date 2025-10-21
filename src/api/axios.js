import axios from "axios";

const api = axios.create({
    baseURL: "http://207.154.227.250:8080",
    headers: { "Content-Type": "application/json" },
});


// ✅ 1. Tokenni har bir so‘rovga qo‘shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ 2. Token muddati tugasa — avtomatik yangilash
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const oldToken = localStorage.getItem("token");
      try {
          const res = await axios.post("http://207.154.227.250:8080/auth/refresh-token", { token: oldToken });
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
