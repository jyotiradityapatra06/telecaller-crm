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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuth();
      }
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // --- AUTH APIs ---
  public async registerAdmin(payload: {
    companyName: string;
    loginId: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    email?: string;
  }): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setAuth(data.token, data.user);
    return data;
  }

  public async login(loginId: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password }),
    });
    this.setAuth(data.token, data.user);
    return data;
  }

  public async getMe(): Promise<{ user: AuthUser }> {
    const data = await this.request<{ user: AuthUser }>('/api/auth/me');
    this.user = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return this.request('/api/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  public async getDemoAccounts(): Promise<{
    admin: { loginId: string; password: string; name: string; role: string; brandAccess: BrandAccess };
    telecallers: Array<{ loginId: string; password: string; name: string; id: string; brandAccess: BrandAccess; dailyTarget: number }>;
  }> {
    return this.request('/api/auth/demo-accounts');
  }

  public logout(): void {
    this.clearAuth();
  }

  // --- ADMIN APIs ---
  public async getAdminTelecallers(brand?: string): Promise<AuthUser[]> {
    const query = brand && brand !== 'ALL' ? `?brand=${brand}` : '';
    const res = await this.request<{ telecallers: AuthUser[] }>(`/api/admin/telecallers${query}`);
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
  ): Promise<{ message: string; telecaller: AuthUser }> {
    return this.request(`/api/admin/telecallers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteTelecaller(id: string): Promise<{ message: string; result: any }> {
    return this.request(`/api/admin/telecallers/${id}`, {
      method: 'DELETE',
    });
  }

  public async resetTelecallerPassword(id: string): Promise<{
    message: string;
    user: AuthUser;
    temporaryPassword: string;
  }> {
    return this.request<{
      message: string;
      user: AuthUser;
      temporaryPassword: string;
    }>(`/api/admin/telecallers/${id}/reset-password`, {
      method: 'POST',
    });
  }

  public async getAdminLeads(params?: {
    brand?: string;
    assignedTo?: string;
    status?: string;
    search?: string;
  }): Promise<Lead[]> {
    const query = new URLSearchParams();
    if (params?.brand && params.brand !== 'ALL') query.set('brand', params.brand);
    if (params?.assignedTo) query.set('assignedTo', params.assignedTo);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request<{ leads: Lead[]; total: number }>(`/api/admin/leads${qs}`);
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
  }): Promise<{ message: string; lead: Lead }> {
    return this.request('/api/admin/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  public async importLeads(
    rows: ParsedLeadRow[],
    assignedTelecallerId?: string | null,
    defaultBrand?: BusinessBrand
  ): Promise<{ importedCount: number; failedCount: number; leads: Lead[]; message: string }> {
    return this.request('/api/admin/leads/import', {
      method: 'POST',
      body: JSON.stringify({ rows, assignedTelecallerId, defaultBrand }),
    });
  }

  public async assignLeads(
    leadIds: string[],
    telecallerId: string | null
  ): Promise<{ assignedCount: number; leads: Lead[]; message: string }> {
    return this.request('/api/admin/leads/assign', {
      method: 'POST',
      body: JSON.stringify({ leadIds, telecallerId }),
    });
  }

  public async autoDistributeLeads(
    brand?: string
  ): Promise<{ vidyaAssigned: number; estateAssigned: number; totalAssigned: number; message: string }> {
    return this.request('/api/admin/leads/auto-distribute', {
      method: 'POST',
      body: JSON.stringify({ brand }),
    });
  }

  public async getLeadHistory(leadId: string): Promise<{ lead: Lead; history: LeadHistory[] }> {
    return this.request(`/api/admin/leads/${leadId}/history`);
  }

  public async getAdminPerformance(brand?: string): Promise<{
    metrics: AdminMetrics;
    telecallersPerformance: TelecallerMetrics[];
  }> {
    const query = brand && brand !== 'ALL' ? `?brand=${brand}` : '';
    return this.request(`/api/admin/performance${query}`);
  }

  public async getAdminTelecallerPerformance(id: string): Promise<{
    telecaller: any;
    metrics: TelecallerMetrics;
    assignedLeads: Lead[];
  }> {
    return this.request(`/api/admin/telecallers/${id}/performance`);
  }

  public async getAdminFollowUps(brand?: string): Promise<{
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    completed: FollowUp[];
  }> {
    const query = brand && brand !== 'ALL' ? `?brand=${brand}` : '';
    return this.request(`/api/admin/followups${query}`);
  }

  // --- TELECALLER APIs ---
  public async getTelecallerLeads(params?: {
    brand?: string;
    status?: string;
    search?: string;
  }): Promise<Lead[]> {
    const query = new URLSearchParams();
    if (params?.brand && params.brand !== 'ALL') query.set('brand', params.brand);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request<{ leads: Lead[]; total: number; brandAccess: BrandAccess }>(`/api/telecaller/leads${qs}`);
    return res.leads || [];
  }

  public async getTelecallerFollowUps(brand?: string): Promise<{
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    completed: FollowUp[];
  }> {
    const query = brand && brand !== 'ALL' ? `?brand=${brand}` : '';
    return this.request(`/api/telecaller/followups${query}`);
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
  }): Promise<{ message: string; lead: Lead; callActivity: any; followUp?: FollowUp }> {
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
  ): Promise<{ message: string; lead: Lead }> {
    return this.recordCall({
      leadId,
      status: status || 'NEW',
      durationSeconds,
      callType: callType === 'WhatsApp' ? 'WHATSAPP' : 'CALL',
    });
  }

  public async scheduleFollowUp(payload: {
    leadId: string;
    dueDate: string;
    dueTime: string;
    note?: string;
  }): Promise<{ message: string; followUp: FollowUp }> {
    return this.request('/api/telecaller/followups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async completeFollowUp(
    followUpId: string,
    note?: string
  ): Promise<{ message: string; followUp: FollowUp; lead: Lead }> {
    return this.request(`/api/telecaller/followups/${followUpId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  }

  public async getTelecallerPerformance(): Promise<{ metrics: TelecallerMetrics; brandAccess: BrandAccess }> {
    return this.request('/api/telecaller/performance');
  }
}

export const api = new ApiClient();
