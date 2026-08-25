import {
  AuthResponse,
  AuthUser,
  Lead,
  LeadStatus,
  FollowUp,
  AdminMetrics,
  TelecallerMetrics,
  ParsedLeadRow,
  LeadHistory,
  BusinessBrand,
  BrandAccess,
} from '../types';

const TOKEN_KEY = 'telecaller_crm_jwt_token';
const USER_KEY = 'telecaller_crm_auth_user';

/**
 * API BASE URL
 *
 * Local development:
 *   VITE_API_URL is normally not required because the Express
 *   server runs on http://localhost:3000.
 *
 * Vercel production:
 *   Set VITE_API_URL to the Render backend URL, for example:
 *
 *   https://telecaller-crm-api.onrender.com
 *
 * IMPORTANT:
 * Do not add /api at the end of VITE_API_URL.
 */
const configuredApiUrl = String(import.meta.env.VITE_API_URL || '').trim();

const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');

/**
 * Build an API URL safely.
 *
 * Example:
 *   buildApiUrl('/api/auth/login')
 *
 * Local:
 *   /api/auth/login
 *
 * Production:
 *   https://your-render-backend.onrender.com/api/auth/login
 */
function buildApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalizedEndpoint}`;
  }

  return normalizedEndpoint;
}

class ApiClient {
  private token: string | null = null;
  private user: AuthUser | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);

    const storedUser = localStorage.getItem(USER_KEY);

    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch {
        this.user = null;
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUser(): AuthUser | null {
    return this.user;
  }

  public getCurrentUser(): AuthUser | null {
    return this.user;
  }

  public setAuth(token: string, user: AuthUser): void {
    this.token = token;
    this.user = user;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public clearAuth(): void {
    this.token = null;
    this.user = null;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  public isAuthenticated(): boolean {
    return Boolean(this.token && this.user);
  }

  /**
   * Central API request handler.
   *
   * Every frontend API call goes through this function.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = buildApiUrl(endpoint);

    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error: any) {
      console.error('[API] Network error:', {
        url,
        error: error?.message || error,
      });

      throw new Error(
        `Unable to connect to the server. Please check that the backend is running.`
      );
    }

    const contentType = response.headers.get('content-type') || '';

    let data: any = {};

    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => '');
      data = text ? { message: text } : {};
    }

    if (!response.ok) {
      console.error('[API] Request failed:', {
        url,
        status: response.status,
        data,
      });

      if (response.status === 401) {
        this.clearAuth();
      }

      throw new Error(
        data?.error ||
        data?.message ||
        `Request failed with status ${response.status}`
      );
    }

    return data as T;
  }

  // ============================================================
  // AUTH APIs
  // ============================================================

  public async registerAdmin(payload: {
    companyName: string;
    loginId: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    email?: string;
  }): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    this.setAuth(data.token, data.user);

    return data;
  }

  public registerOwner(payload: {
    name: string;
    loginId: string;
    email?: string;
    phone?: string;
    password: string;
    setupCode: string;
  }): Promise<{ message: string; user: AuthUser }> {
    return this.request('/api/auth/register-owner', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async login(
    loginId: string,
    password: string
  ): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          loginId,
          password,
        }),
      }
    );

    this.setAuth(data.token, data.user);

    return data;
  }

  public async getMe(): Promise<{ user: AuthUser }> {
    const data = await this.request<{ user: AuthUser }>(
      '/api/auth/me'
    );

    this.user = data.user;

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(data.user)
    );

    return data;
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return this.request('/api/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  }

  public async getDemoAccounts(): Promise<{
    admin: {
      loginId: string;
      password: string;
      name: string;
      role: string;
      brandAccess: BrandAccess;
    };
    telecallers: Array<{
      loginId: string;
      password: string;
      name: string;
      id: string;
      brandAccess: BrandAccess;
      dailyTarget: number;
    }>;
  } | null> {
    if (import.meta.env.PROD) {
      return null;
    }

    try {
      return await this.request(
        '/api/auth/demo-accounts'
      );
    } catch {
      return null;
    }
  }

  public logout(): void {
    this.clearAuth();
  }

  public async getHrs(): Promise<AuthUser[]> {
    const result = await this.request<{ hrs: AuthUser[] }>('/api/owner/hr');
    return result.hrs || [];
  }

  public createHr(payload: { name: string; loginId: string; password: string; brandAccess: BusinessBrand; phone?: string; email?: string }): Promise<{ hr: AuthUser }> {
    return this.request('/api/owner/hr', { method: 'POST', body: JSON.stringify(payload) });
  }

  public updateHr(id: string, payload: Partial<Pick<AuthUser, 'name' | 'phone' | 'email' | 'brandAccess' | 'isActive'>>): Promise<{ hr: AuthUser }> {
    return this.request(`/api/owner/hr/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  public resetHrPassword(id: string, password?: string): Promise<{ user: AuthUser; temporaryPassword: string }> {
    return this.request(`/api/owner/hr/${encodeURIComponent(id)}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) });
  }

  // ============================================================
  // MANAGEMENT APIs (OWNER / HR, server-scoped)
  // ============================================================

  public async getAdminTelecallers(
    brand?: string
  ): Promise<AuthUser[]> {
    const query =
      brand && brand !== 'ALL'
        ? `?brand=${encodeURIComponent(brand)}`
        : '';

    const res = await this.request<{
      telecallers: AuthUser[];
    }>(`/api/admin/telecallers${query}`);

    return res.telecallers || [];
  }

  public async createTelecaller(payload: {
    name: string;
    loginId?: string;
    password?: string;
    brandAccess: BrandAccess;
    phone?: string;
    email?: string;
    dailyTarget?: number;
  }): Promise<{
    message: string;
    telecaller: AuthUser;
    credentials?: {
      name: string;
      loginId: string;
      temporaryPassword: string;
      brandAccess: BrandAccess;
    };
  }> {
    return this.request('/api/admin/telecallers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateTelecaller(
    id: string,
    payload: Partial<{
      name: string;
      phone: string;
      email: string;
      brandAccess: BrandAccess;
      dailyTarget: number;
      isActive: boolean;
      password?: string;
    }>
  ): Promise<{
    message: string;
    telecaller: AuthUser;
  }> {
    return this.request(
      `/api/admin/telecallers/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  }

  public async deleteTelecaller(
    id: string
  ): Promise<{
    message: string;
    result: any;
  }> {
    return this.request(
      `/api/admin/telecallers/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );
  }

  public async resetTelecallerPassword(
    id: string
  ): Promise<{
    message: string;
    user: AuthUser;
    temporaryPassword: string;
  }> {
    return this.request(
      `/api/admin/telecallers/${encodeURIComponent(id)}/reset-password`,
      {
        method: 'POST',
      }
    );
  }

  public async getAdminLeads(params?: {
    brand?: string;
    assignedTo?: string;
    status?: string;
    search?: string;
  }): Promise<Lead[]> {
    const query = new URLSearchParams();

    if (params?.brand && params.brand !== 'ALL') {
      query.set('brand', params.brand);
    }

    if (params?.assignedTo) {
      query.set('assignedTo', params.assignedTo);
    }

    if (params?.status) {
      query.set('status', params.status);
    }

    if (params?.search) {
      query.set('search', params.search);
    }

    const qs = query.toString()
      ? `?${query.toString()}`
      : '';

    const res = await this.request<{
      leads: Lead[];
      total: number;
    }>(`/api/admin/leads${qs}`);

    return res.leads || [];
  }

  public async createLead(leadData: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    brand: BusinessBrand;
    courseInterest?: string;
    qualification?: string;
    preferredBatch?: string;
    propertyType?: string;
    budget?: string;
    preferredLocation?: string;
    siteVisitDate?: string;
    source?: string;
    assignedTo?: string | null;
    notes?: string;
  }): Promise<{
    message: string;
    lead: Lead;
  }> {
    return this.request('/api/admin/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  public async importLeads(
    rows: ParsedLeadRow[],
    assignedTelecallerId?: string | null,
    defaultBrand?: BusinessBrand
  ): Promise<{
    importedCount: number;
    failedCount: number;
    leads: Lead[];
    message: string;
  }> {
    return this.request('/api/admin/leads/import', {
      method: 'POST',
      body: JSON.stringify({
        rows,
        assignedTelecallerId,
        defaultBrand,
      }),
    });
  }

  public async assignLeads(
    leadIds: string[],
    telecallerId: string | null
  ): Promise<{
    assignedCount: number;
    leads: Lead[];
    message: string;
  }> {
    return this.request('/api/admin/leads/assign', {
      method: 'POST',
      body: JSON.stringify({
        leadIds,
        telecallerId,
      }),
    });
  }

  public async autoDistributeLeads(
    brand?: string
  ): Promise<{
    vidyaAssigned: number;
    estateAssigned: number;
    totalAssigned: number;
    message: string;
  }> {
    return this.request(
      '/api/admin/leads/auto-distribute',
      {
        method: 'POST',
        body: JSON.stringify({ brand }),
      }
    );
  }

  public async getLeadHistory(
    leadId: string
  ): Promise<{
    lead: Lead;
    history: LeadHistory[];
  }> {
    return this.request(
      `/api/admin/leads/${encodeURIComponent(leadId)}/history`
    );
  }

  public async getAdminPerformance(
    brand?: string
  ): Promise<{
    metrics: AdminMetrics;
    telecallersPerformance: TelecallerMetrics[];
  }> {
    const query =
      brand && brand !== 'ALL'
        ? `?brand=${encodeURIComponent(brand)}`
        : '';

    return this.request(
      `/api/admin/performance${query}`
    );
  }

  public async getAdminTelecallerPerformance(
    id: string
  ): Promise<{
    telecaller: any;
    metrics: TelecallerMetrics;
    assignedLeads: Lead[];
  }> {
    return this.request(
      `/api/admin/telecallers/${encodeURIComponent(id)}/performance`
    );
  }

  public async getAdminFollowUps(
    brand?: string
  ): Promise<{
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    completed: FollowUp[];
  }> {
    const query =
      brand && brand !== 'ALL'
        ? `?brand=${encodeURIComponent(brand)}`
        : '';

    return this.request(
      `/api/admin/followups${query}`
    );
  }

  // ============================================================
  // TELECALLER APIs
  // ============================================================

  public async getTelecallerLeads(params?: {
    brand?: string;
    status?: string;
    search?: string;
  }): Promise<Lead[]> {
    const query = new URLSearchParams();

    if (params?.brand && params.brand !== 'ALL') {
      query.set('brand', params.brand);
    }

    if (params?.status) {
      query.set('status', params.status);
    }

    if (params?.search) {
      query.set('search', params.search);
    }

    const qs = query.toString()
      ? `?${query.toString()}`
      : '';

    const res = await this.request<{
      leads: Lead[];
      total: number;
      brandAccess: BrandAccess;
    }>(`/api/telecaller/leads${qs}`);

    return res.leads || [];
  }

  public async getTelecallerFollowUps(
    brand?: string
  ): Promise<{
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    completed: FollowUp[];
  }> {
    const query =
      brand && brand !== 'ALL'
        ? `?brand=${encodeURIComponent(brand)}`
        : '';

    return this.request(
      `/api/telecaller/followups${query}`
    );
  }

  public async recordCall(payload: {
    leadId: string;
    status: LeadStatus;
    note?: string;
    durationSeconds?: number;
    callType?: 'CALL' | 'WHATSAPP';
    customFields?: Partial<Lead>;
    followUp?: {
      dueDate: string;
      dueTime: string;
      note?: string;
    };
  }): Promise<{
    message: string;
    lead: Lead;
    callActivity: any;
    followUp?: FollowUp;
  }> {
    return this.request('/api/telecaller/calls', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async logCall(
    leadId: string,
    durationSeconds: number,
    status: LeadStatus,
    callType: string = 'Call'
  ): Promise<{
    message: string;
    lead: Lead;
  }> {
    return this.recordCall({
      leadId,
      status: status || 'NEW',
      durationSeconds,
      callType:
        callType === 'WhatsApp'
          ? 'WHATSAPP'
          : 'CALL',
    });
  }

  public async scheduleFollowUp(payload: {
    leadId: string;
    dueDate: string;
    dueTime: string;
    note?: string;
  }): Promise<{
    message: string;
    followUp: FollowUp;
  }> {
    return this.request(
      '/api/telecaller/followups',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  public async completeFollowUp(
    followUpId: string,
    note?: string
  ): Promise<{
    message: string;
    followUp: FollowUp;
    lead: Lead;
  }> {
    return this.request(
      `/api/telecaller/followups/${encodeURIComponent(followUpId)}/complete`,
      {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      }
    );
  }

  public async getTelecallerPerformance(): Promise<{
    metrics: TelecallerMetrics;
    brandAccess: BrandAccess;
  }> {
    return this.request(
      '/api/telecaller/performance'
    );
  }
}

export const api = new ApiClient();
