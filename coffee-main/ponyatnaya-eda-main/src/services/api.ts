import axios, { type AxiosInstance, isAxiosError } from 'axios';

/** Базовый URL бэкенда без /api (например http://127.0.0.1:8000) */
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://127.0.0.1:8000';
const API_BASE = `${API_ORIGIN.replace(/\/$/, '')}/api`;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

function formatApiError(err: unknown): string {
  if (!isAxiosError(err) || !err.response?.data) {
    return err instanceof Error ? err.message : 'Произошла ошибка';
  }
  const data = err.response.data as Record<string, unknown>;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.non_field_errors) && typeof data.non_field_errors[0] === 'string') {
    return data.non_field_errors[0];
  }
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const v = data[firstKey];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  }
  return 'Произошла ошибка';
}

/** Код ошибки API (например email_not_verified) и текст. */
export function parseApiError(err: unknown): { message: string; code?: string } {
  if (!isAxiosError(err) || !err.response?.data) {
    return { message: err instanceof Error ? err.message : 'Произошла ошибка' };
  }
  const data = err.response.data as Record<string, unknown>;
  const message = typeof data.detail === 'string' ? data.detail : formatApiError(err);
  const code = typeof data.code === 'string' ? data.code : undefined;
  return { message, code };
}

export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (path == null || path === '') return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const origin = API_ORIGIN.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith('/media')) {
    return `${origin}${normalized}`;
  }
  return `${origin}/media${normalized}`;
}

export interface Badge {
  id: string;
  text: string;
  color: string;
}

/** Единый тип карточки товара для UI и корзины */
export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  weight?: string;
  category_id: string;
  subcategory_id?: string | null;
  is_active: boolean;
  stock_status?: string;
  stock_color?: string;
  badges?: Badge[];
  nutrition_per_100g?: number[];
}

export interface PromotionCard {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url?: string;
  created_at?: string;
  /** Условия акции (например, "При покупке от 2000₽") */
  conditions?: string;
  /** Пользовательское соглашение (HTML или текст) */
  terms?: string;
  /** PDF файл с подробными условиями акции */
  pdf_file_url?: string;
  /** Текст ссылки на PDF (например: "Подробнее про акцию") */
  pdf_link_text?: string;
  /** Изображение для шапки (рекомендуется 1920x600 или 16:5) */
  banner_image_url?: string;
  /** Дата окончания акции */
  end_date?: string;
}

export interface BlogPostCard {
  id: string;
  title: string;
  date: string;
  excerpt: string;
}

export interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
  subcategories?: SubcategoryCard[];
}

export interface SubcategoryCard {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  is_staff: boolean;
  /** Email подтверждён (аккаунт активирован). */
  email_verified: boolean;
}

type DjangoUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  is_staff: boolean;
  email_verified?: boolean;
  phone?: string;
};

function mapUser(u: DjangoUser): AuthUser {
  return {
    id: String(u.id),
    email: u.email || u.username,
    name: u.first_name || undefined,
    phone: typeof u.phone === 'string' ? u.phone : undefined,
    is_staff: Boolean(u.is_staff),
    email_verified: u.email_verified ?? true,
  };
}

type DjangoProduct = {
  id: number;
  slug: string;
  name_with_weight: string;
  price: string | number;
  image: string | null;
  is_available: boolean;
  composition?: string;
  category: number;
  subcategory?: number | null;
  promotion?: number | null;
  nutrition_per_100g?: (string | number)[];
};

function mapProduct(p: DjangoProduct): Product {
  const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
  // Разделяем название и вес (формат: "Название (XXX г)" или "Название XXX г")
  const nameWithWeight = p.name_with_weight;
  // Парсим вес из конца строки (формат: "Название (XXX г)" или "Название XXX г")
  // Сначала ищем вес в скобках в конце: (400 г), (500г), (1 кг)
  const bracketMatch = nameWithWeight.match(/\s*\((\d+[\s\d]*\s*(?:г|кг|мл|л))\)\s*$/i);
  // Потом ищем вес без скобок в конце: 400 г, 500г, 1 кг
  const plainMatch = nameWithWeight.match(/\s+(\d+[\s\d]*\s*(?:г|кг|мл|л))\s*$/i);
  const weightMatch = bracketMatch || plainMatch;
  let weight = weightMatch ? weightMatch[1].trim() : undefined;
  let name = weightMatch ? nameWithWeight.replace(weightMatch[0], '').trim() : nameWithWeight;
  return {
    id: String(p.id),
    slug: p.slug,
    name,
    weight,
    description: p.composition || undefined,
    price: Number.isFinite(price) ? price : 0,
    image_url: resolveMediaUrl(p.image),
    category_id: String(p.category),
    subcategory_id: p.subcategory == null ? null : String(p.subcategory),
    is_active: p.is_available,
    stock_status: p.is_available ? 'В наличии' : 'Нет в наличии',
    stock_color: p.is_available ? '#10B981' : '#9CA3AF',
    badges: p.promotion
      ? [{ id: `promo-${p.promotion}`, text: 'Акция', color: '#EF4444' }]
      : undefined,
    nutrition_per_100g: p.nutrition_per_100g?.map((x) =>
      typeof x === 'string' ? parseFloat(x) : x,
    ),
  };
}

type DjangoCategory = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  subcategories?: Array<{
    id: number;
    name: string;
    slug: string;
    category: number;
  }>;
};

function mapCategory(c: DjangoCategory): CategoryCard {
  return {
    id: String(c.id),
    name: c.name,
    slug: c.slug,
    image_url: resolveMediaUrl(c.image),
    sort_order: 0,
    is_active: true,
    subcategories: (c.subcategories ?? []).map((s) => ({
      id: String(s.id),
      name: s.name,
      slug: s.slug,
      category_id: String(s.category),
    })),
  };
}

type DjangoPromotion = {
  id: number;
  name: string;
  slug?: string;
  description: string;
  image: string | null;
  created_at?: string;
  conditions?: string;
  terms?: string;
  pdf_file?: string | null;
  pdf_link_text?: string;
  banner_image?: string | null;
  end_date?: string;
};

function mapPromotionCard(p: DjangoPromotion): PromotionCard {
  return {
    id: String(p.id),
    slug: p.slug || String(p.id),
    title: p.name,
    description: p.description,
    image_url: resolveMediaUrl(p.image),
    created_at: p.created_at,
    conditions: p.conditions,
    terms: p.terms,
    pdf_file_url: resolveMediaUrl(p.pdf_file),
    pdf_link_text: p.pdf_link_text,
    banner_image_url: resolveMediaUrl(p.banner_image),
    end_date: p.end_date,
  };
}

function mapBlogPost(p: DjangoPromotion): BlogPostCard {
  const created = p.created_at ? new Date(p.created_at) : new Date();
  return {
    id: String(p.id),
    title: p.name,
    date: created.toISOString(),
    excerpt:
      p.description.length > 220
        ? `${p.description.slice(0, 220)}…`
        : p.description,
  };
}

async function fetchList<T>(url: string, params?: Record<string, string>): Promise<T[]> {
  const { data } = await api.get<T[]>(url, { params });
  return Array.isArray(data) ? data : [];
}

export interface OrderItemRow {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  quantity: number;
  price: string;
}

export interface OrderRecord {
  id: string;
  created_at: string;
  order_type: 'delivery' | 'in_house';
  status: string;
  total_price: string;
  total_amount: string;
  delivery_address: string;
  delivery_fee: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
  payment_method: string;
  items: OrderItemRow[];
}

function mapOrder(o: Omit<OrderRecord, 'id'> & { id: string | number }): OrderRecord {
  return {
    ...o,
    id: String(o.id),
  };
}

export interface DishOfTheDay {
  id: string;
  product: Product;
  old_price?: number;
  sale_price?: number;
  active_from?: string;
  active_until?: string;
  is_active: boolean;
}

export interface CreateOrderPayload {
  items: { product_id: number; quantity: number }[];
  order_type: 'delivery' | 'in_house';
  delivery_address: string;
  delivery_fee: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  payment_method: 'cash';
}

export interface AdminProductPayload {
  name_with_weight: string;
  price: number;
  image: File;
  is_available: boolean;
  composition: string;
  nutrition_per_100g: [number, number, number, number];
  category: number;
  subcategory?: number;
  promotion?: number;
}

export const apiService = {
  getProducts: async (options?: { availableOnly?: boolean }): Promise<Product[]> => {
    const params: Record<string, string> = {};
    if (options?.availableOnly !== false) {
      params.available = '1';
    }
    const rows = await fetchList<DjangoProduct>('/products/', params);
    return rows.map(mapProduct);
  },

  getProduct: async (slug: string): Promise<Product | undefined> => {
    try {
      const { data } = await api.get<DjangoProduct>(
        `/products/${encodeURIComponent(slug)}/`,
      );
      return mapProduct(data);
    } catch {
      return undefined;
    }
  },

  getCategories: async (): Promise<CategoryCard[]> => {
    const rows = await fetchList<DjangoCategory>('/categories/');
    return rows.map(mapCategory);
  },

  getPromotions: async (): Promise<PromotionCard[]> => {
    const rows = await fetchList<DjangoPromotion>('/promotions/');
    return rows.map(mapPromotionCard);
  },

  getBlogPosts: async (): Promise<BlogPostCard[]> => {
    const rows = await fetchList<DjangoPromotion>('/promotions/');
    return rows.map(mapBlogPost);
  },

  createOrder: async (payload: CreateOrderPayload): Promise<OrderRecord> => {
    try {
      const { data } = await api.post<Omit<OrderRecord, 'id'> & { id: string | number }>('/orders/', payload);
      return mapOrder(data);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  login: async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    try {
      const { data } = await api.post<{ token: string; user: DjangoUser }>('/auth/login/', {
        email,
        password,
      });
      return { token: data.token, user: mapUser(data.user) };
    } catch (e) {
      const { message, code } = parseApiError(e);
      const err = new Error(message) as Error & { code?: string };
      if (code) err.code = code;
      throw err;
    }
  },

  /** Регистрация: токен не выдаётся, пока не подтверждён email. */
  register: async (
    email: string,
    password: string,
    firstName?: string,
  ): Promise<{ email: string }> => {
    try {
      const { data } = await api.post<{ detail: string; email: string; needs_verification?: boolean }>(
        '/auth/register/',
        {
          email,
          password,
          first_name: firstName?.trim() || '',
        },
      );
      return { email: data.email };
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  resendVerificationEmail: async (email: string): Promise<void> => {
    await api.post('/auth/resend-verification/', { email });
  },

  verifyEmail: async (uid: string, token: string): Promise<{ verified?: boolean; already_verified?: boolean }> => {
    try {
      const { data } = await api.post<{ verified?: boolean; already_verified?: boolean }>(
        '/auth/verify-email/',
        { uid, token },
      );
      return data;
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  updateProfile: async (firstName: string): Promise<AuthUser> => {
    const { data } = await api.patch<DjangoUser>('/auth/profile/', { first_name: firstName });
    return mapUser(data);
  },

  updateProfilePhone: async (phone: string): Promise<AuthUser> => {
    const { data } = await api.patch<DjangoUser>('/auth/profile/', { phone });
    return mapUser(data);
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await api.post('/auth/password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } catch {
      /* сеть / 401 — токен всё равно удалим на клиенте */
    }
  },

  getCurrentUser: async (): Promise<AuthUser | null> => {
    try {
      const { data } = await api.get<DjangoUser>('/auth/me/');
      return mapUser(data);
    } catch {
      return null;
    }
  },

  adminGetOrders: async (): Promise<OrderRecord[]> => {
    const rows = await fetchList<OrderRecord>('/orders/');
    return rows.map(mapOrder);
  },

  adminGetOrderHistory: async (date?: string): Promise<OrderRecord[]> => {
    const params: Record<string, string> = {};
    if (date) {
      params.date = date;
    }
    const rows = await fetchList<OrderRecord>('/orders/history/', params);
    return rows.map(mapOrder);
  },

  adminCompleteOrder: async (orderId: string): Promise<void> => {
    await api.patch(`/orders/${orderId}/`, { status: 'completed' });
  },

  adminUpdateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    await api.patch(`/orders/${orderId}/`, { status });
  },

  adminGetProducts: async () => apiService.getProducts({ availableOnly: false }),
  adminGetPromotions: async (): Promise<PromotionCard[]> => {
    const rows = await fetchList<DjangoPromotion>('/promotions/');
    return rows.map(mapPromotionCard);
  },

  adminCreatePromotion: async (payload: {
    name: string;
    description: string;
    image: File;
    conditions?: string;
    terms?: string;
    pdf_file?: File;
    pdf_link_text?: string;
    banner_image?: File;
    end_date?: string;
  }): Promise<void> => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('image', payload.image);
    if (payload.conditions) formData.append('conditions', payload.conditions);
    if (payload.terms) formData.append('terms', payload.terms);
    if (payload.pdf_file) formData.append('pdf_file', payload.pdf_file);
    if (payload.pdf_link_text) formData.append('pdf_link_text', payload.pdf_link_text);
    if (payload.banner_image) formData.append('banner_image', payload.banner_image);
    if (payload.end_date) formData.append('end_date', payload.end_date);
    await api.post('/promotions/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  adminUpdatePromotion: async (
    slug: string,
    payload: {
      name?: string;
      description?: string;
      image?: File | null | undefined;
      conditions?: string;
      terms?: string;
      pdf_file?: File | null | undefined;
      pdf_link_text?: string;
      banner_image?: File | null | undefined;
      end_date?: string;
    },
  ): Promise<void> => {
    const formData = new FormData();
    if (payload.name != null) formData.append('name', payload.name);
    if (payload.description != null) formData.append('description', payload.description);
    if (payload.image instanceof File) formData.append('image', payload.image);
    if (payload.conditions != null) formData.append('conditions', payload.conditions);
    if (payload.terms != null) formData.append('terms', payload.terms);
    if (payload.pdf_file instanceof File) formData.append('pdf_file', payload.pdf_file);
    if (payload.pdf_link_text != null) formData.append('pdf_link_text', payload.pdf_link_text);
    if (payload.banner_image instanceof File) formData.append('banner_image', payload.banner_image);
    if (payload.end_date != null) formData.append('end_date', payload.end_date);
    await api.patch(`/promotions/${encodeURIComponent(slug)}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  adminDeletePromotion: async (slug: string): Promise<void> => {
    await api.delete(`/promotions/${encodeURIComponent(slug)}/`);
  },

  adminCreateProduct: async (payload: AdminProductPayload) => {
    const formData = new FormData();
    formData.append('name_with_weight', payload.name_with_weight);
    formData.append('price', String(payload.price));
    formData.append('image', payload.image);
    formData.append('is_available', payload.is_available ? 'true' : 'false');
    formData.append('composition', payload.composition);
    formData.append('category', String(payload.category));
    if (payload.subcategory != null) formData.append('subcategory', String(payload.subcategory));
    if (payload.promotion != null) formData.append('promotion', String(payload.promotion));
    payload.nutrition_per_100g.forEach((item) =>
      formData.append('nutrition_per_100g', String(item)),
    );
    await api.post('/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  adminUpdateProduct: async (product: Product, body: Record<string, unknown>) => {
    // Если админ поменял картинку, отправляем multipart.
    const image = body.image;
    if (image instanceof File) {
      const formData = new FormData();
      Object.entries(body).forEach(([key, value]) => {
        if (key === 'image') return;
        if (key === 'nutrition_per_100g' && Array.isArray(value)) {
          (value as unknown[]).forEach((item) => formData.append('nutrition_per_100g', String(item)));
          return;
        }
        if (value === undefined) return;
        if (value === null) {
          // В multipart не всегда корректно парсится `null` для PK-полей.
          // Если нужно очистить значение — обновляйте без изменения изображения.
          return;
        }
        formData.append(key, String(value));
      });
      formData.append('image', image);
      await api.patch(`/products/${encodeURIComponent(product.slug)}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return;
    }

    await api.patch(`/products/${encodeURIComponent(product.slug)}/`, body);
  },

  adminDeleteProduct: async (slug: string) => {
    await api.delete(`/products/${encodeURIComponent(slug)}/`);
  },

  adminGetCategories: async () => apiService.getCategories(),
  adminCreateCategory: async (payload: { name: string; image?: File | null }): Promise<void> => {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.image instanceof File) formData.append('image', payload.image);
    await api.post('/categories/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  adminUpdateCategory: async (slug: string, payload: { name?: string; image?: File | null | undefined }): Promise<void> => {
    const hasFile = payload.image instanceof File;
    if (hasFile) {
      const formData = new FormData();
      if (payload.name != null) formData.append('name', payload.name);
      formData.append('image', payload.image as File);
      await api.patch(`/categories/${encodeURIComponent(slug)}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return;
    }
    await api.patch(`/categories/${encodeURIComponent(slug)}/`, payload);
  },

  getMyOrders: async (): Promise<OrderRecord[]> => {
    const rows = await fetchList<OrderRecord>('/orders/');
    return rows.map(mapOrder);
  },
  cancelMyOrder: async (orderId: string): Promise<OrderRecord> => {
    const { data } = await api.post<Omit<OrderRecord, 'id'> & { id: string | number }>(`/orders/${orderId}/cancel/`);
    return mapOrder(data);
  },
  adminCreateSubcategory: async (payload: { name: string; category: number }): Promise<void> => {
    await api.post('/subcategories/', payload);
  },
  adminDeleteCategory: async (slug: string): Promise<void> => {
    await api.delete(`/categories/${encodeURIComponent(slug)}/`);
  },
  adminDeleteSubcategory: async (slug: string): Promise<void> => {
    await api.delete(`/subcategories/${encodeURIComponent(slug)}/`);
  },
  dadataSuggestAddress: async (query: string): Promise<string[]> => {
    const { data } = await api.get<{ suggestions?: string[] }>('/dadata/address-suggest/', {
      params: { query },
    });
    return Array.isArray(data?.suggestions) ? data!.suggestions : [];
  },

  // Блюдо дня
  getDishOfTheDay: async (): Promise<DishOfTheDay | null> => {
    try {
      const { data } = await api.get<DishOfTheDay>('/dish-of-the-day/');
      return data;
    } catch {
      return null;
    }
  },

  adminGetDishOfTheDay: async (): Promise<DishOfTheDay | null> => {
    try {
      const { data } = await api.get<DishOfTheDay>('/admin/dish-of-the-day/');
      return data;
    } catch {
      return null;
    }
  },

  adminSetDishOfTheDay: async (payload: {
    product_id: number;
    old_price?: number;
    sale_price?: number;
    active_from?: string;
    active_until?: string;
  }): Promise<void> => {
    await api.post('/admin/dish-of-the-day/', payload);
  },

  adminUpdateDishOfTheDay: async (payload: {
    product_id?: number;
    old_price?: number;
    sale_price?: number;
    active_from?: string;
    active_until?: string;
    is_active?: boolean;
  }): Promise<void> => {
    await api.patch('/admin/dish-of-the-day/', payload);
  },

  adminDeleteDishOfTheDay: async (): Promise<void> => {
    await api.delete('/admin/dish-of-the-day/');
  },
};
