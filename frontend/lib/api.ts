import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          Cookies.set("access_token", data.access_token, { expires: 1 });
          Cookies.set("refresh_token", data.refresh_token, { expires: 30 });
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
import type {
  TokenResponse, LoginRequest, RegisterRequest, User,
  Store, StoreCreate, Product, Deal, Review,
  PaginatedResponse, SearchStoreParams, SearchProductParams, DealListParams,
} from "./types";

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<TokenResponse>("/auth/register", data).then((r) => r.data),
  login: (data: LoginRequest) =>
    api.post<TokenResponse>("/auth/login", data).then((r) => r.data),
  refresh: (refresh_token: string) =>
    api.post<TokenResponse>("/auth/refresh", { refresh_token }).then((r) => r.data),
  logout: (refresh_token: string) =>
    api.post("/auth/logout", { refresh_token }).then((r) => r.data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post("/auth/change-password", data).then((r) => r.data),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const userApi = {
  me: () => api.get<User>("/users/me").then((r) => r.data),
  update: (data: Partial<User>) =>
    api.patch<User>("/users/me", data).then((r) => r.data),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<User>("/users/me/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
  becomeSeller: (business_name: string) =>
    api.post<User>("/users/me/become-seller", { business_name }).then((r) => r.data),
};

// ─── Search ──────────────────────────────────────────────────────────────────
export const searchApi = {
  stores: (params: SearchStoreParams) =>
    api.get<PaginatedResponse<Store>>("/search/stores", { params }).then((r) => r.data),
  products: (params: SearchProductParams) =>
    api.get<PaginatedResponse<Product>>("/search/products", { params }).then((r) => r.data),
};

// ─── Stores ──────────────────────────────────────────────────────────────────
export const storeApi = {
  create: (data: StoreCreate) =>
    api.post<Store>("/stores", data).then((r) => r.data),
  list: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<Store>>("/stores", { params: { page, limit } }).then((r) => r.data),
  get: (id: string) =>
    api.get<Store>(`/stores/${id}`).then((r) => r.data),
  update: (id: string, data: Partial<StoreCreate>) =>
    api.patch<Store>(`/stores/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/stores/${id}`).then((r) => r.data),
  uploadPhoto: (storeId: string, file: File, isCover = false) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("is_cover", String(isCover));
    return api.post<Store>(`/stores/${storeId}/photos`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
  save: (id: string) =>
    api.post(`/stores/${id}/save`).then((r) => r.data),
  unsave: (id: string) =>
    api.delete(`/stores/${id}/save`).then((r) => r.data),
  savedList: (page = 1) =>
    api.get<PaginatedResponse<Store>>("/stores/saved/list", { params: { page } }).then((r) => r.data),
};

// ─── Products ────────────────────────────────────────────────────────────────
export const productApi = {
  create: (storeId: string, data: Partial<Product>) =>
    api.post<Product>(`/stores/${storeId}/products`, data).then((r) => r.data),
  list: (storeId: string, page = 1) =>
    api.get<PaginatedResponse<Product>>(`/stores/${storeId}/products`, { params: { page } }).then((r) => r.data),
  get: (storeId: string, productId: string) =>
    api.get<Product>(`/stores/${storeId}/products/${productId}`).then((r) => r.data),
  update: (storeId: string, productId: string, data: Partial<Product>) =>
    api.patch<Product>(`/stores/${storeId}/products/${productId}`, data).then((r) => r.data),
  delete: (storeId: string, productId: string) =>
    api.delete(`/stores/${storeId}/products/${productId}`).then((r) => r.data),
  uploadImage: (storeId: string, productId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<Product>(`/stores/${storeId}/products/${productId}/images`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
};

// ─── Deals ───────────────────────────────────────────────────────────────────
export const dealApi = {
  list: (params: DealListParams) =>
    api.get<PaginatedResponse<Deal>>("/deals", { params }).then((r) => r.data),
  storeDeals: (storeId: string, includeExpired = false) =>
    api.get<PaginatedResponse<Deal>>(`/stores/${storeId}/deals`, {
      params: { include_expired: includeExpired },
    }).then((r) => r.data),
  create: (storeId: string, data: Partial<Deal>) =>
    api.post<Deal>(`/stores/${storeId}/deals`, data).then((r) => r.data),
  update: (dealId: string, data: Partial<Deal>) =>
    api.patch<Deal>(`/deals/${dealId}`, data).then((r) => r.data),
  save: (dealId: string) =>
    api.post(`/deals/${dealId}/save`).then((r) => r.data),
  savedList: (page = 1) =>
    api.get<PaginatedResponse<Deal>>("/deals/saved", { params: { page } }).then((r) => r.data),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewApi = {
  list: (storeId: string, page = 1) =>
    api.get<PaginatedResponse<Review>>(`/stores/${storeId}/reviews`, { params: { page } }).then((r) => r.data),
  create: (storeId: string, data: { rating: number; comment?: string }) =>
    api.post<Review>(`/stores/${storeId}/reviews`, data).then((r) => r.data),
};
