export type Role = 'admin' | 'pharmacist';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
  pharmacy_id?: string | null;
  pharmacy_name?: string | null;
}

export interface Medicine {
  id: string;
  name: string;
  brand_name?: string | null;
  generic_name?: string | null;
  category?: string | null;
  strength: string;
  dosage_form: string;
  pack_size: number;
  purchase_price?: number;
  unit_price: number;
  reorder_level: number;
  min_stock_level?: number;
  notes: string | null;
  is_active: boolean;
  usable_stock?: number;
}

export interface Batch {
  id: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_packs: number;
  medicine_name?: string;
  strength?: string;
}

export interface Movement {
  id: string;
  batch_id: string;
  movement_type: 'receipt' | 'issue' | 'adjustment';
  quantity_packs: number;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
  batch_number?: string;
  medicine_id?: string;
  medicine_name?: string;
  strength?: string;
}

export interface AttentionSummary {
  low_stock: { count: number; items: Array<Medicine & { usable_stock: number }> };
  expiring: { count: number; items: Batch[]; window_days: number };
  expired: { count: number; items: Batch[] };
  missing_data: { count: number; items: Array<Medicine & { batch_count: number }> };
}

export interface AlertSettings {
  expiry_warning_days: number;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface ApiEnvelope<T> {
  data: T;
  error: { code?: string; message?: string } | null;
}

const rawApiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function isPlaceholder(value: string) {
  const v = value.trim().toLowerCase();
  return !v || v.includes('your_project') || v.includes('your-project') || v.includes('your_supabase') || v === 'changeme' || v === 'replace_me';
}

export const frontendConfigIssues: string[] = [];
const isProd = import.meta.env.PROD;
if (isPlaceholder(rawSupabaseUrl)) frontendConfigIssues.push('VITE_SUPABASE_URL is missing or not configured.');
if (isPlaceholder(rawSupabaseAnonKey)) frontendConfigIssues.push('VITE_SUPABASE_ANON_KEY is missing or not configured.');
if (isPlaceholder(rawApiBase)) {
  frontendConfigIssues.push(isProd ? 'VITE_API_URL is required in production (localhost default is not used).' : 'VITE_API_URL is not configured; using local development API URL.');
} else if (isProd && /localhost|127\.0\.0\.1/i.test(rawApiBase)) {
  frontendConfigIssues.push('VITE_API_URL must not point to localhost in production.');
}

const API_BASE = ((isPlaceholder(rawApiBase) ? (isProd ? '' : 'http://localhost:4000/api') : rawApiBase)).replace(/\/$/, '');
const SUPABASE_URL = rawSupabaseUrl.replace(/\/$/, '');
const SUPABASE_ANON_KEY = rawSupabaseAnonKey;
const SESSION_KEY = 'medifind.session';

export const authConfigured = !isPlaceholder(SUPABASE_URL) && !isPlaceholder(SUPABASE_ANON_KEY);
export const apiConfigured = Boolean(API_BASE);

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function readSession(): Session | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

async function supabaseAuth(path: string, body: Record<string, unknown>) {
  if (frontendConfigIssues.length) throw new ApiError(frontendConfigIssues.join(' '));
  if (!authConfigured) throw new ApiError('Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  if (!apiConfigured && import.meta.env.PROD) throw new ApiError('API connection is not configured. Set VITE_API_URL.');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(result.msg || result.message || result.error_description || 'Authentication failed.', response.status);
  return result;
}

function sessionFromAuth(data: { access_token: string; refresh_token: string; expires_in?: number }): Session {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
}

export async function signIn(email: string, password: string) {
  const data = await supabaseAuth('token?grant_type=password', { email, password });
  const session = sessionFromAuth(data);
  writeSession(session);
  return session;
}

export async function signUp(fullName: string, email: string, password: string) {
  const data = await supabaseAuth('signup', { email, password, data: { full_name: fullName } });
  if (data.access_token && data.refresh_token) writeSession(sessionFromAuth(data));
  return Boolean(data.access_token);
}

export function signOut() {
  writeSession(null);
}

async function refreshSession(session: Session): Promise<Session> {
  const data = await supabaseAuth('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
  const refreshed = sessionFromAuth(data);
  writeSession(refreshed);
  return refreshed;
}

async function validAccessToken() {
  let session = readSession();
  if (!session) throw new ApiError('Please sign in to continue.', 401);
  if (session.expires_at < Date.now() + 60_000) {
    try {
      session = await refreshSession(session);
    } catch {
      signOut();
      throw new ApiError('Your session expired. Please sign in again.', 401);
    }
  }
  return session.access_token;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!apiConfigured) throw new ApiError(import.meta.env.PROD ? 'API connection is not configured. Set VITE_API_URL.' : 'API connection is not configured.');
  let token = await validAccessToken();
  const send = (accessToken: string) => fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  let response = await send(token);
  if (response.status === 401) {
    const session = readSession();
    if (session) {
      try {
        token = (await refreshSession(session)).access_token;
        response = await send(token);
      } catch {
        signOut();
      }
    }
  }
  const envelope = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok) {
    if (response.status === 401) signOut();
    throw new ApiError(envelope.error?.message || `Request failed (${response.status}).`, response.status, envelope.error?.code);
  }
  if (envelope.error) throw new ApiError(envelope.error.message || 'The request could not be completed.', response.status, envelope.error.code);
  return envelope.data;
}

export async function getProfile() {
  return request<Profile>('/auth/me');
}

export async function getMedicines(options: { search?: string; includeInactive?: boolean; low_stock?: boolean; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams({ page: String(options.page || 1), limit: String(options.limit || 100) });
  if (options.search) params.set('search', options.search);
  if (options.includeInactive) params.set('include_inactive', 'true');
  if (options.low_stock) params.set('low_stock', 'true');
  return request<{ items: Medicine[]; total: number; page: number; limit: number }>(`/medicines?${params}`);
}

export async function getMedicine(id: string) {
  return request<Medicine & { batches: Batch[]; usable_stock: number }>(`/medicines/${id}`);
}

export async function getBatches(medicineId: string) {
  return request<Batch[]>(`/medicines/${medicineId}/batches`);
}

export async function getAllBatches() {
  return request<Batch[]>('/batches');
}

export async function onboardPharmacy(data: any) {
  return request<any>('/pharmacy/onboard', { method: 'POST', body: JSON.stringify(data) });
}

export async function createMedicine(data: any) {
  return request<Medicine>('/medicines', { method: 'POST', body: JSON.stringify(data) });
}

export async function recordSale(saleData: any) {
  return request<any>('/sales', { method: 'POST', body: JSON.stringify(saleData) });
}

export async function getInventory() {
  return request<{ items: Medicine[]; total: number }>('/medicines');
}

export async function getDashboardMetrics() {
  return request<any>('/summary');
}

export type ContactRecord = any;
export type SaleRecord = any;
export function startDemoSession() { localStorage.setItem('medifind.session', JSON.stringify({ access_token: 'demo-token', refresh_token: 'demo-token', expires_at: Date.now() + 86400000 })); }
export async function askAi(prompt: string) { return request<any>('/ai/ask', { method: 'POST', body: JSON.stringify({ prompt }) }); }
export async function createBatch(medicineId: string, data: any) { return request<any>(`/medicines/${medicineId}/batches`, { method: 'POST', body: JSON.stringify(data) }); }
export async function getAlertsSummary() { return request<any>('/alerts/summary'); }
export async function createCustomer(data: any) { return request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }); }
export async function deleteCustomer(id: string) { return request<any>(`/customers/${id}`, { method: 'DELETE' }); }
export async function getCustomers() { return request<any[]>('/customers'); }
export async function getSales() { return request<any[]>('/sales'); }
export async function archiveMedicine(id: string) { return request<any>(`/medicines/${id}/archive`, { method: 'POST' }); }
export async function updateMedicine(id: string, data: any) { return request<any>(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function completeSale(data: any) { return request<any>('/sales', { method: 'POST', body: JSON.stringify(data) }); }
export async function createSupplier(data: any) { return request<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }); }
export async function deleteSupplier(id: string) { return request<any>(`/suppliers/${id}`, { method: 'DELETE' }); }
export async function getSuppliers() { return request<any[]>('/suppliers'); }
export async function updateSupplier(id: string, data: any) { return request<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function getMovements(page = 1, limit = 100) { return request<any>(`/movements?page=${page}&limit=${limit}`); }
