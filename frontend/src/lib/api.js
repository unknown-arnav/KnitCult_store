import axios from "axios";

const API_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "") + "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("kc_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auth
export const authApi = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  verifyOtp: (data) => api.post("/auth/verify-otp", data).then((r) => r.data),
  resendOtp: (email) => api.post("/auth/resend-otp", { email }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

// Products
export const productsApi = {
  list: (params = {}) => api.get("/products", { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
};

// Recommendations
export const recommendationsApi = {
  get: (productId, limit = 4) =>
    api.get(`/recommendations/${productId}`, { params: { limit } }).then((r) => r.data),
};

// Cart (authenticated)
export const cartApi = {
  get: () => api.get("/cart").then((r) => r.data),
  add: (product_id, size, qty = 1) =>
    api.post("/cart/add", { product_id, size, qty }).then((r) => r.data),
  update: (product_id, size, qty) =>
    api.put("/cart/update", { product_id, size, qty }).then((r) => r.data),
  remove: (product_id, size) =>
    api.delete("/cart/remove", { params: { product_id, size } }).then((r) => r.data),
  clear: () => api.delete("/cart/clear").then((r) => r.data),
};

// Coupons
export const couponsApi = {
  validate: (code, subtotal) =>
    api.post("/coupons/validate", { code, subtotal }).then((r) => r.data),
};

// Orders
export const ordersApi = {
  place: (data) => api.post("/orders", data).then((r) => r.data),
  mine: () => api.get("/orders").then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  updatePhone: (id, phone) =>
    api.put(`/orders/${id}/phone`, { phone }).then((r) => r.data),
};

// Payments (MOCK)
export const paymentsApi = {
  create: (order_id) => api.post("/payments/create", { order_id }).then((r) => r.data),
  status: (order_id) => api.get(`/payments/status/${order_id}`).then((r) => r.data),
};

// Admin
export const adminApi = {
  listProducts: () => api.get("/admin/products").then((r) => r.data),
  createProduct: (data) => api.post("/admin/products", data).then((r) => r.data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data).then((r) => r.data),
  updateStock: (id, stock) =>
    api.patch(`/admin/products/${id}/stock`, { stock }).then((r) => r.data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`).then((r) => r.data),
  listCoupons: () => api.get("/admin/coupons").then((r) => r.data),
  createCoupon: (data) => api.post("/admin/coupons", data).then((r) => r.data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data).then((r) => r.data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`).then((r) => r.data),
  listOrders: () => api.get("/admin/orders").then((r) => r.data),
  updateOrderStatus: (id, status) =>
    api.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data),
  refreshRecCache: () => api.post("/admin/cache/refresh").then((r) => r.data),
};

// Convert backend product → jersey shape used by pages
export const toJersey = (p) => {
  const tagList = (p.tags || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const type = tagList.find((t) => t.startsWith("type:"))?.slice(5) || "Home";
  const sizes = Object.keys(p.stock || {});
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    club: p.club,
    league: p.league,
    year: p.year,
    era: p.era,
    player: p.player,
    type: type.charAt(0).toUpperCase() + type.slice(1),
    price: p.price,
    rating: p.rating,
    reviewsCount: p.reviews_count,
    image: p.image,
    backImage: (p.images && p.images[1]) || p.image,
    images: p.images || [],
    description: p.description,
    sizes: sizes.length ? sizes : ["S", "M", "L", "XL"],
    stock: p.stock || {},
    isTrending: p.is_trending,
    isLimited: false,
    tags: p.tags || "",
    historicalCampaign: p.historical_campaign || null,
    availablePlayers: [
      p.player ? `${p.player.toUpperCase()} #10` : "CUSTOM NAME",
      "CUSTOM NAME",
    ],
  };
};

export default api;
