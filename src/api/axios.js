import axios from "axios";

// 🌍 Muhitga qarab backend manzilini avtomatik tanlaydi:
// - Lokal:  http://localhost:8080
// - Production (Vercel): process.env.NEXT_PUBLIC_API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

console.log("🌐 API ishlayapti:", API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // ✅ CORS uchun zarur
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
                // 🔥 refresh-token URL ham dinamik
                const res = await axios.post(
                    `${API_URL}/auth/refresh-token`,
                    { token: oldToken },
                    { withCredentials: true } // ✅ bu ham kerak
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
