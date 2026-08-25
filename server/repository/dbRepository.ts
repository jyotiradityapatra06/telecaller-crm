import bcrypt from 'bcryptjs';
import { createRequire } from 'module';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import {
  User,
  Lead,
  CallActivity,
  FollowUp,
  LeadHistory,
  LeadStatus,
  BusinessBrand,
  BrandAccess,
  AdminMetrics,
  TelecallerMetrics,
  ParsedLeadRow,
} from '../../src/types';
import {
  mapUserFromRow,
  mapUserToRow,
  mapLeadFromRow,
  mapLeadToRow,
  mapCallActivityFromRow,
  mapFollowUpFromRow,
  mapFollowUpToRow,
  mapLeadHistoryFromRow,
} from './mapper';

let cachedDevFallback: any = null;

export class DbRepository {
  private get useFallback(): boolean {
    return process.env.NODE_ENV !== 'production' && !isSupabaseConfigured();
  }

  private get fallbackRepo(): any {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: Development fallback repository is strictly disabled in production mode.');
    }
    if (!cachedDevFallback) {
      try {
        const req = typeof require !== 'undefined' ? require : createRequire(process.cwd() + '/server/repository/dbRepository.ts');
        const mod = req('./devFallbackRepository');
        cachedDevFallback = mod?.getDevFallbackRepository ? mod.getDevFallbackRepository() : (mod?.devFallbackRepository || mod?.default || mod);
      } catch (err: any) {
        throw new Error(`FATAL: Unable to resolve development fallback repository: ${err?.message || err}`);
      }
    }
    return cachedDevFallback;
  }

  public getOrganizationId(user?: User): string {
    if (this.useFallback) {
      return this.fallbackRepo.getOrganizationId(user);
    }
    if (user) {
      const userOrg = (user as any).organizationId || (user as any).organization_id;
      if (userOrg && typeof userOrg === 'string' && userOrg.trim()) {
        return userOrg.trim();
      }
      throw new Error('Unauthorized: Organization context missing from authenticated user.');
    }
    throw new Error('Unauthorized: Organization context required for CRM database operations.');
  }

  private get client() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client is not configured or unavailable in production.');
    }
    return supabase;
  }

  // --- USER METHODS ---
  public async getAllUsers(user?: User): Promise<User[]> {
    if (this.useFallback) return this.fallbackRepo.getAllUsers(user);
    if (!user) {
      throw new Error('Unauthorized: User context required to fetch users.');
    }
    const orgId = this.getOrganizationId(user);
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('organization_id', orgId);

    if (error || !data) return [];
    return data.map(mapUserFromRow).map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public async getTelecallers(brandFilter?: 'ALL' | BusinessBrand, user?: User): Promise<User[]> {
    if (this.useFallback) return this.fallbackRepo.getTelecallers(brandFilter, user);
    if (!user) {
      throw new Error('Unauthorized: User context required to fetch telecallers.');
    }
    const orgId = this.getOrganizationId(user);
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('organization_id', orgId)
      .eq('role', 'TELECALLER');

    if (error || !data) return [];

    return data
      .map(mapUserFromRow)
      .filter((u) => {
        if (!brandFilter || brandFilter === 'ALL') return true;
        return u.brandAccess === brandFilter || u.brandAccess === 'BOTH';
      })
      .map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public async findUserById(id: string, userContext?: User): Promise<(User & { passwordHash: string }) | undefined> {
    if (this.useFallback) return this.fallbackRepo.findUserById(id, userContext);
    if (!id) return undefined;
    let query = this.client.from('users').select('*').eq('id', id);
    if (userContext) {
      const orgId = this.getOrganizationId(userContext);
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await query.single();
    if (error || !data) return undefined;
    return mapUserFromRow(data);
  }

  public async findUserByLoginId(loginId: string, orgId?: string): Promise<(User & { passwordHash: string }) | undefined> {
    if (this.useFallback) return this.fallbackRepo.findUserByLoginId(loginId);
    if (!loginId) return undefined;
    const clean = loginId.trim().toLowerCase();

    let query = this.client
      .from('users')
      .select('*')
      .ilike('login_id', clean);

    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) return undefined;
    if (data.length > 1) {
      throw new Error('Ambiguous login ID: Multiple accounts found across organizations. Please contact your CRM Administrator.');
    }
    return mapUserFromRow(data[0]);
  }

  public async registerAdmin(data: {
    companyName: string;
    loginId: string;
    passwordHash: string;
    phone?: string;
    email?: string;
  }): Promise<User> {
    if (this.useFallback) return this.fallbackRepo.registerAdmin(data);

    const cleanId = data.loginId.trim().toUpperCase();
    const existing = await this.findUserByLoginId(cleanId);
    if (existing) {
      throw new Error('Login ID already exists. Please choose another.');
    }

    const now = new Date().toISOString();
    const orgId = `org_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const orgSlug = data.companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `org-${Date.now()}`;

    // 1. Create Organization in organizations table
    const { error: orgError } = await this.client.from('organizations').insert({
      id: orgId,
      name: data.companyName.trim(),
      slug: orgSlug,
      is_demo: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // 2. Create Master Admin in users table
    const newAdmin: User & { passwordHash: string } = {
      id: `usr_adm_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 5)}`,
      organizationId: orgId,
      name: data.companyName.trim(),
      loginId: cleanId,
      role: 'ADMIN',
      brandAccess: 'BOTH',
      dailyTarget: 100,
      phone: data.phone?.trim() || '+91 90000 00000',
      email: data.email?.trim() || `${cleanId.toLowerCase()}@apnicrm.com`,
      isActive: true,
      passwordHash: data.passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    const row = mapUserToRow(newAdmin, orgId);
    const { error } = await this.client.from('users').insert(row);
    if (error) {
      if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
        throw new Error('Login ID already exists. Please choose another.');
      }
      throw new Error(`Failed to create company admin account: ${error.message}`);
    }

    const { passwordHash: _, ...safeUser } = newAdmin;
    return safeUser;
  }

  private async generateNextLoginId(brandAccess: BrandAccess, adminUser: User): Promise<string> {
    const prefix =
      brandAccess === 'APNI_VIDYA'
        ? 'TC_VIDYA'
        : brandAccess === 'APNI_ESTATE'
        ? 'TC_ESTATE'
        : 'TC_DUAL';

    const users = await this.getAllUsers(adminUser);
    let maxNum = 0;
    const regex = new RegExp(`^${prefix}_(\\d+)$`, 'i');
    for (const u of users) {
      const m = u.loginId.match(regex);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }

    const nextNum = maxNum + 1;
    const formatted = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    return `${prefix}_${formatted}`;
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const num = Math.floor(1000 + Math.random() * 9000);
    return `Pass-${code}-${num}`;
  }

  public async createTelecaller(
    data: {
      name: string;
      loginId?: string;
      password?: string;
      brandAccess: BrandAccess;
      phone?: string;
      email?: string;
      dailyTarget?: number;
    },
    adminUser: User
  ): Promise<{ user: User; temporaryPassword?: string }> {
    if (this.useFallback) return this.fallbackRepo.createTelecaller(data, adminUser);
    if (!adminUser) {
      throw new Error('Unauthorized: Admin user context required to create telecaller.');
    }

    const orgId = this.getOrganizationId(adminUser);
    const brandAccess = data.brandAccess || 'APNI_VIDYA';

    const finalLoginId = data.loginId?.trim()
      ? data.loginId.trim().toUpperCase()
      : await this.generateNextLoginId(brandAccess, adminUser);

    const existing = await this.findUserByLoginId(finalLoginId, orgId);
    if (existing) {
      throw new Error(`Telecaller ID "${finalLoginId}" already exists. Please choose a unique ID.`);
    }

    const plainPassword = data.password?.trim() || this.generateTemporaryPassword();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(plainPassword, salt);
    const now = new Date().toISOString();

    const newUser: User & { passwordHash: string } = {
      id: `usr_tc_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 5)}`,
      name: data.name.trim(),
      loginId: finalLoginId,
      role: 'TELECALLER',
      brandAccess,
      dailyTarget: Number(data.dailyTarget) || 50,
      phone: data.phone?.trim() || '+91 90000 00000',
      email: data.email?.trim() || `${finalLoginId.toLowerCase()}@apnicrm.com`,
      isActive: true,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    const row = mapUserToRow(newUser, orgId);
    const { error } = await this.client.from('users').insert(row);

    if (error) {
      if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
        throw new Error(`Telecaller ID "${finalLoginId}" already exists. Please choose a unique ID.`);
      }
      throw new Error(`Failed to create telecaller in database: ${error.message}`);
    }

    const { passwordHash: _, ...safeUser } = newUser;
    return {
      user: safeUser,
      temporaryPassword: plainPassword,
    };
  }

  public async updateTelecaller(
    id: string,
    updates: Partial<{
      name: string;
      phone: string;
      email: string;
      brandAccess: BrandAccess;
      dailyTarget: number;
      isActive: boolean;
      password?: string;
    }>,
    adminUser: User
  ): Promise<User> {
    if (this.useFallback) return this.fallbackRepo.updateTelecaller(id, updates, adminUser);
    if (!adminUser) {
      throw new Error('Unauthorized: Admin user context required to update telecaller.');
    }
    const orgId = this.getOrganizationId(adminUser);
    const user = await this.findUserById(id, adminUser);
    if (!user) {
      throw new Error(`Telecaller not found with ID: ${id}`);
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updatePayload.name = updates.name.trim();
    if (updates.phone !== undefined) updatePayload.phone = updates.phone.trim();
    if (updates.email !== undefined) updatePayload.email = updates.email.trim();
    if (updates.brandAccess !== undefined) updatePayload.brand_access = updates.brandAccess;
    if (updates.dailyTarget !== undefined) updatePayload.daily_target = Number(updates.dailyTarget) || 50;
    if (updates.isActive !== undefined) updatePayload.is_active = Boolean(updates.isActive);

    if (updates.password && updates.password.trim()) {
      const salt = bcrypt.genSaltSync(10);
      updatePayload.password_hash = bcrypt.hashSync(updates.password.trim(), salt);
    }

    const { data, error } = await this.client
      .from('users')
      .update(updatePayload)
      .eq('organization_id', orgId)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update telecaller: ${error?.message || 'Record not found'}`);
    }

    const updatedUser = mapUserFromRow(data);
    const { passwordHash: _, ...safeUser } = updatedUser;
    return safeUser;
  }

  public async resetTelecallerPassword(
    id: string,
    adminUser: User
  ): Promise<{ user: User; temporaryPassword: string }> {
    if (this.useFallback) return this.fallbackRepo.resetTelecallerPassword(id, adminUser);
    if (!adminUser) {
      throw new Error('Unauthorized: Admin user context required to reset telecaller password.');
    }
    const orgId = this.getOrganizationId(adminUser);

    // Verify telecaller exists and belongs to this organization
    const { data: user, error: fetchErr } = await this.client
      .from('users')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .single();

    if (fetchErr || !user) {
      throw new Error(`Telecaller not found with ID: ${id}`);
    }

    if (user.role !== 'TELECALLER') {
      throw new Error('Forbidden: Cannot reset password for non-telecaller account.');
    }

    const plainPassword = this.generateTemporaryPassword();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(plainPassword, salt);
    const now = new Date().toISOString();

    const { data: updated, error: updateErr } = await this.client
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: now,
      })
      .eq('organization_id', orgId)
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new Error(`Failed to reset password: ${updateErr?.message || 'Update failed'}`);
    }

    const safeUser = mapUserFromRow(updated);
    const { passwordHash: _, ...sanitized } = safeUser;
    return {
      user: sanitized,
      temporaryPassword: plainPassword,
    };
  }

  public async updateUserPassword(userId: string, newHash: string, userContext: User): Promise<void> {
    if (this.useFallback) return this.fallbackRepo.updateUserPassword(userId, newHash, userContext);
    if (!userContext) {
      throw new Error('Unauthorized: User context required to update user password.');
    }
    const orgId = this.getOrganizationId(userContext);

    // Strict boundary: Users can only update their own password unless they are ADMIN
    if (userContext.role !== 'ADMIN' && userContext.id !== userId) {
      throw new Error('Forbidden: You can only update your own password.');
    }

    const { error } = await this.client
      .from('users')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user password: ${error.message}`);
    }
  }

  // --- ATOMIC TELECALLER DELETION (RPC - FAILS CLOSED) ---
  public async deleteTelecaller(id: string, adminUser: User): Promise<{ success: boolean; unassignedLeadsCount: number }> {
    if (this.useFallback) return this.fallbackRepo.deleteTelecaller(id, adminUser);
    if (!adminUser) {
      throw new Error('Unauthorized: Admin user context required to delete telecaller.');
    }
    const orgId = this.getOrganizationId(adminUser);
    const adminId = adminUser.id;

    // Call Atomic RPC - Must fail closed without sequential fallback in production
    const { data, error } = await this.client.rpc('delete_telecaller_atomic', {
      p_org_id: orgId,
      p_telecaller_id: id,
      p_admin_id: adminId,
    });

    if (error) {
      throw new Error(`Failed to delete telecaller: ${error.message}`);
    }

    return {
      success: Boolean(data?.success),
      unassignedLeadsCount: Number(data?.unassignedLeadsCount) || 0,
    };
  }

  // --- LEAD METHODS ---
  public async getAllLeads(filter?: {
    brand?: 'ALL' | BusinessBrand;
    assignedTo?: string | null;
    status?: LeadStatus;
    search?: string;
  }, userContext?: User): Promise<Lead[]> {
    if (this.useFallback) return this.fallbackRepo.getAllLeads(filter, userContext);
    if (!userContext) {
      throw new Error('Unauthorized: User context required to retrieve leads.');
    }
    const orgId = this.getOrganizationId(userContext);
    await this.recalculateFollowUpStatuses(orgId);

    let query = this.client.from('leads').select('*').eq('organization_id', orgId);

    if (filter?.brand && filter.brand !== 'ALL') {
      query = query.eq('brand', filter.brand);
    }

    if (filter?.assignedTo !== undefined) {
      if (filter.assignedTo === 'UNASSIGNED') {
        query = query.is('assigned_to', null);
      } else if (filter.assignedTo !== 'ALL') {
        query = query.eq('assigned_to', filter.assignedTo);
      }
    }

    if (filter?.status && filter.status !== ('ALL' as unknown as LeadStatus)) {
      query = query.eq('status', filter.status);
    }

    const { data: leadRows, error } = await query.order('created_at', { ascending: false });

    if (error || !leadRows || leadRows.length === 0) return [];

    let filteredRows = leadRows;
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      const qDigits = q.replace(/[\s+-]/g, '');

      filteredRows = leadRows.filter((l) => {
        const matchName = l.name.toLowerCase().includes(q);
        const matchPhone = l.phone ? l.phone.replace(/[\s+-]/g, '').includes(qDigits) : false;
        const matchCity = l.city?.toLowerCase().includes(q);
        const matchCourse = l.course_interest?.toLowerCase().includes(q);
        const matchProperty = l.property_type?.toLowerCase().includes(q);
        const matchLocation = l.preferred_location?.toLowerCase().includes(q);
        return matchName || matchPhone || matchCity || matchCourse || matchProperty || matchLocation;
      });
    }

    if (filteredRows.length === 0) return [];

    const users = await this.getAllUsers(userContext);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leadIds = filteredRows.map((l) => l.id);

    const [{ data: historyRows }, { data: callRows }, { data: fuRows }] = await Promise.all([
      this.client
        .from('lead_history')
        .select('*')
        .eq('organization_id', orgId)
        .in('lead_id', leadIds)
        .order('timestamp', { ascending: false }),
      this.client
        .from('call_activities')
        .select('*')
        .eq('organization_id', orgId)
        .in('lead_id', leadIds)
        .order('called_at', { ascending: false }),
      this.client
        .from('follow_ups')
        .select('*')
        .eq('organization_id', orgId)
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false }),
    ]);

    const historyMap = new Map<string, LeadHistory[]>();
    (historyRows || []).forEach((h) => {
      const item = mapLeadHistoryFromRow(h, userMap);
      const list = historyMap.get(item.leadId) || [];
      list.push(item);
      historyMap.set(item.leadId, list);
    });

    const callMap = new Map<string, CallActivity[]>();
    (callRows || []).forEach((c) => {
      const item = mapCallActivityFromRow(c, userMap);
      const list = callMap.get(item.leadId) || [];
      list.push(item);
      callMap.set(item.leadId, list);
    });

    const leadBaseMap = new Map<string, Lead>();
    filteredRows.forEach((r) => {
      leadBaseMap.set(r.id, mapLeadFromRow(r, userMap));
    });

    const fuMap = new Map<string, FollowUp[]>();
    (fuRows || []).forEach((f) => {
      const item = mapFollowUpFromRow(f, leadBaseMap, userMap);
      const list = fuMap.get(item.leadId) || [];
      list.push(item);
      fuMap.set(item.leadId, list);
    });

    return filteredRows.map((r) => {
      const lead = leadBaseMap.get(r.id)!;
      const history = historyMap.get(lead.id) || [];
      const callLogs = callMap.get(lead.id) || [];
      const followUps = fuMap.get(lead.id) || [];
      const activeFollowUp = followUps.find((f) => f.status === 'PENDING' || f.status === 'OVERDUE');
      const tc = lead.assignedTo ? userMap.get(lead.assignedTo) : undefined;

      return {
        ...lead,
        assignedTelecallerName: tc ? tc.name : undefined,
        history,
        callLogs,
        followUps,
        activeFollowUp,
      };
    });
  }

  public async getLeadById(id: string, userContext?: User): Promise<Lead | undefined> {
    if (this.useFallback) return this.fallbackRepo.getLeadById(id, userContext);
    if (!userContext) {
      throw new Error('Unauthorized: User context required to retrieve lead.');
    }
    const orgId = this.getOrganizationId(userContext);
    const { data, error } = await this.client
      .from('leads')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    const users = await this.getAllUsers(userContext);
    const userMap = new Map(users.map((u) => [u.id, u]));
    const lead = mapLeadFromRow(data, userMap);

    return this.enrichLead(lead, userMap, orgId);
  }

  private async enrichLead(lead: Lead, userMap: Map<string, User>, orgId: string): Promise<Lead> {
    const [{ data: historyRows }, { data: callRows }, { data: fuRows }] = await Promise.all([
      this.client
        .from('lead_history')
        .select('*')
        .eq('organization_id', orgId)
        .eq('lead_id', lead.id)
        .order('timestamp', { ascending: false }),
      this.client
        .from('call_activities')
        .select('*')
        .eq('organization_id', orgId)
        .eq('lead_id', lead.id)
        .order('called_at', { ascending: false }),
      this.client
        .from('follow_ups')
        .select('*')
        .eq('organization_id', orgId)
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false }),
    ]);

    const history = (historyRows || []).map((h) => mapLeadHistoryFromRow(h, userMap));
    const callLogs = (callRows || []).map((c) => mapCallActivityFromRow(c, userMap));
    const followUps = (fuRows || []).map((f) => mapFollowUpFromRow(f, new Map([[lead.id, lead]]), userMap));
    const activeFollowUp = followUps.find((f) => f.status === 'PENDING' || f.status === 'OVERDUE');

    const tc = lead.assignedTo ? userMap.get(lead.assignedTo) : undefined;

    return {
      ...lead,
      assignedTelecallerName: tc ? tc.name : undefined,
      history,
      callLogs,
      followUps,
      activeFollowUp,
    };
  }

  // --- BATCH IMPORT LEADS ---
  public async importLeads(
    rows: ParsedLeadRow[],
    assignedToTelecallerId?: string | null,
    adminUser?: User,
    defaultBrand?: BusinessBrand
  ): Promise<{ importedCount: number; failedCount: number; leads: Lead[] }> {
    if (this.useFallback) return this.fallbackRepo.importLeads(rows, assignedToTelecallerId, adminUser, defaultBrand);
    if (!adminUser) {
      throw new Error('Unauthorized: Admin user context required for lead import.');
    }
    const orgId = this.getOrganizationId(adminUser);
    const now = new Date();
    const importedLeads: Lead[] = [];
    let importedCount = 0;
    let failedCount = 0;

    const users = await this.getAllUsers(adminUser);
    const tc = assignedToTelecallerId ? users.find((u) => u.id === assignedToTelecallerId) : null;
    const admin = adminUser;

    const leadRowsToInsert: any[] = [];
    const historyRowsToInsert: any[] = [];
    const assignmentRowsToInsert: any[] = [];

    rows.forEach((row, i) => {
      if (!row.name || !row.phone) {
        failedCount++;
        return;
      }

      const brand: BusinessBrand = row.brand || defaultBrand || (row.courseInterest ? 'APNI_VIDYA' : 'APNI_ESTATE');
      const leadId = `lead_${brand.toLowerCase()}_imp_${Date.now()}_${i}`;

      const newLead: Lead = {
        id: leadId,
        name: row.name.trim(),
        phone: row.phone.trim(),
        email: row.email?.trim() || undefined,
        city: row.city?.trim() || undefined,
        source: row.source?.trim() || 'Excel/CSV Import',
        brand,
        courseInterest: row.courseInterest?.trim() || undefined,
        qualification: row.qualification?.trim() || undefined,
        preferredBatch: row.preferredBatch?.trim() || undefined,
        propertyType: row.propertyType?.trim() || undefined,
        budget: row.budget?.trim() || undefined,
        preferredLocation: row.preferredLocation?.trim() || undefined,
        siteVisitDate: row.siteVisitDate?.trim() || undefined,
        productInterest: row.productInterest?.trim() || row.courseInterest || row.propertyType || undefined,
        notes: row.notes?.trim() || undefined,
        assignedTo: tc ? tc.id : null,
        assignedTelecallerName: tc ? tc.name : undefined,
        status: 'NEW',
        totalCallsCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      importedLeads.push(newLead);
      importedCount++;
      leadRowsToInsert.push(mapLeadToRow(newLead, orgId));

      historyRowsToInsert.push({
        id: `hist_${leadId}_create`,
        organization_id: orgId,
        lead_id: leadId,
        user_id: admin.id,
        action: 'CREATED',
        description: `Lead imported for [${brand === 'APNI_VIDYA' ? 'Apni Vidya' : 'Apni Estate'}] via spreadsheet batch.`,
        timestamp: now.toISOString(),
      });

      if (tc) {
        historyRowsToInsert.push({
          id: `hist_${leadId}_assign`,
          organization_id: orgId,
          lead_id: leadId,
          user_id: admin.id,
          action: 'ASSIGNED',
          description: `Auto-assigned to ${tc.name} (${tc.loginId}).`,
          timestamp: now.toISOString(),
        });

        assignmentRowsToInsert.push({
          id: `asgn_${leadId}_${Date.now()}`,
          organization_id: orgId,
          lead_id: leadId,
          assigned_to: tc.id,
          assigned_by: admin.id,
          assignment_type: 'ASSIGNED',
          created_at: now.toISOString(),
        });
      }
    });

    if (leadRowsToInsert.length > 0) {
      const { error: err1 } = await this.client.from('leads').insert(leadRowsToInsert);
      if (err1) throw new Error(`Lead import transaction failed: ${err1.message}`);

      await this.client.from('lead_history').insert(historyRowsToInsert);
      if (assignmentRowsToInsert.length > 0) {
        await this.client.from('lead_assignments').insert(assignmentRowsToInsert);
      }
    }

    return { importedCount, failedCount, leads: importedLeads };
  }

  // --- ATOMIC LEAD ASSIGNMENT (RPC - FAILS CLOSED) ---
  public async assignLeads(
    leadIds: string[],
    telecallerId: string | null,
    adminUser: User
  ): Promise<{ assignedCount: number; leads: Lead[] }> {
    if (this.useFallback) return this.fallbackRepo.assignLeads(leadIds, telecallerId, adminUser);
    if (!adminUser) {
      throw new Error('Unauthorized: Admin user context required to assign leads.');
    }
    const orgId = this.getOrganizationId(adminUser);

    // Call Atomic RPC - Fail closed
    const { data, error } = await this.client.rpc('assign_leads_atomic', {
      p_org_id: orgId,
      p_lead_ids: leadIds,
      p_telecaller_id: telecallerId,
      p_admin_id: adminUser.id,
    });

    if (error) {
      throw new Error(`Lead assignment failed: ${error.message}`);
    }

    const assignedCount = Number(data?.assignedCount) || 0;
    const modifiedLeads = await Promise.all(leadIds.map((id) => this.getLeadById(id, adminUser)));
    return { assignedCount, leads: modifiedLeads.filter(Boolean) as Lead[] };
  }

  // --- ATOMIC AUTO-DISTRIBUTION (RPC - FAILS CLOSED) ---
  public async autoDistributeLeads(
    brandFilter?: 'ALL' | BusinessBrand,
    adminUser?: User
  ): Promise<{ vidyaAssigned: number; estateAssigned: number; totalAssigned: number; message: string }> {
    if (this.useFallback) return this.fallbackRepo.autoDistributeLeads(brandFilter, adminUser);
    if (!adminUser) {
      throw new Error('Unauthorized: Admin user context required for auto-distribution.');
    }
    const orgId = this.getOrganizationId(adminUser);
    const adminId = adminUser.id;

    const { data, error } = await this.client.rpc('auto_distribute_leads_atomic', {
      p_org_id: orgId,
      p_brand_filter: brandFilter || 'ALL',
      p_admin_id: adminId,
    });

    if (error) {
      throw new Error(`Auto-distribution failed: ${error.message}`);
    }

    return {
      vidyaAssigned: Number(data?.vidyaAssigned) || 0,
      estateAssigned: Number(data?.estateAssigned) || 0,
      totalAssigned: Number(data?.totalAssigned) || 0,
      message: String(data?.message || 'Automated distribution completed via PostgreSQL transaction.'),
    };
  }

  // --- ATOMIC CALL LOGGING (RPC - FAILS CLOSED) ---
  public async recordCallActivity(data: {
    leadId: string;
    telecallerId: string;
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
  }, userContext?: User): Promise<{ callActivity: CallActivity; lead: Lead; followUp?: FollowUp }> {
    if (this.useFallback) {
      const res = await this.fallbackRepo.recordCallActivity(data, userContext);
      return { callActivity: res.callActivity, lead: res.lead, followUp: res.followUp };
    }
    if (!userContext) {
      throw new Error('Unauthorized: User context required to record call activity.');
    }
    const orgId = this.getOrganizationId(userContext);

    const { data: rpcData, error } = await this.client.rpc('record_call_activity_atomic', {
      p_org_id: orgId,
      p_lead_id: data.leadId,
      p_telecaller_id: data.telecallerId,
      p_status: data.status,
      p_note: data.note || null,
      p_duration_seconds: data.durationSeconds || 0,
      p_call_type: data.callType || 'CALL',
      p_custom_fields_json: data.customFields ? JSON.parse(JSON.stringify(data.customFields)) : null,
      p_follow_up_json: data.followUp ? JSON.parse(JSON.stringify(data.followUp)) : null,
    });

    if (error) {
      throw new Error(`Recording call activity failed: ${error.message}`);
    }

    const updatedLead = await this.getLeadById(data.leadId, userContext);
    const { data: callRow, error: callErr } = await this.client
      .from('call_activities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', rpcData.callActivityId)
      .single();

    if (callErr || !callRow) {
      throw new Error(`Failed to load recorded call activity: ${callErr?.message || 'Not found'}`);
    }

    const users = await this.getAllUsers(userContext);
    const userMap = new Map(users.map((u) => [u.id, u]));
    const callActivity = mapCallActivityFromRow(callRow, userMap);

    let createdFollowUp: FollowUp | undefined = undefined;
    if (rpcData.followUpId) {
      const { data: fuRow } = await this.client
        .from('follow_ups')
        .select('*')
        .eq('organization_id', orgId)
        .eq('id', rpcData.followUpId)
        .single();
      if (fuRow) {
        createdFollowUp = mapFollowUpFromRow(fuRow, new Map([[updatedLead!.id, updatedLead!]]), userMap);
      }
    }

    return {
      callActivity,
      lead: updatedLead!,
      followUp: createdFollowUp,
    };
  }

  // --- ATOMIC FOLLOW-UP CREATION (RPC - FAILS CLOSED) ---
  public async scheduleFollowUp(data: {
    leadId: string;
    telecallerId: string;
    dueDate: string;
    dueTime: string;
    note?: string;
  }, userContext?: User): Promise<FollowUp> {
    if (this.useFallback) {
      const res = await this.fallbackRepo.scheduleFollowUp(data, userContext);
      return res.followUp;
    }
    if (!userContext) {
      throw new Error('Unauthorized: User context required to schedule follow-up.');
    }
    const orgId = this.getOrganizationId(userContext);

    const { data: rpcData, error } = await this.client.rpc('schedule_follow_up_atomic', {
      p_org_id: orgId,
      p_lead_id: data.leadId,
      p_telecaller_id: data.telecallerId,
      p_due_date: data.dueDate,
      p_due_time: data.dueTime || '04:00 PM',
      p_note: data.note || null,
    });

    if (error) {
      throw new Error(`Scheduling follow-up failed: ${error.message}`);
    }

    const { data: fuRow, error: fuErr } = await this.client
      .from('follow_ups')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', rpcData.followUpId)
      .single();

    if (fuErr || !fuRow) {
      throw new Error(`Failed to load scheduled follow-up: ${fuErr?.message || 'Not found'}`);
    }

    const lead = await this.getLeadById(data.leadId, userContext);
    const users = await this.getAllUsers(userContext);
    const userMap = new Map(users.map((u) => [u.id, u]));

    return mapFollowUpFromRow(fuRow, new Map([[lead!.id, lead!]]), userMap);
  }

  // --- ATOMIC FOLLOW-UP COMPLETION (RPC - FAILS CLOSED) ---
  public async completeFollowUp(
    followUpId: string,
    user: User,
    completionNote?: string
  ): Promise<{ followUp: FollowUp; lead: Lead }> {
    if (this.useFallback) return this.fallbackRepo.completeFollowUp(followUpId, user, completionNote);
    if (!user) {
      throw new Error('Unauthorized: User context required to complete follow-up.');
    }
    const orgId = this.getOrganizationId(user);

    const { data: rpcData, error } = await this.client.rpc('complete_follow_up_atomic', {
      p_org_id: orgId,
      p_follow_up_id: followUpId,
      p_user_id: user.id,
      p_user_role: user.role,
      p_completion_note: completionNote || null,
    });

    if (error) {
      throw new Error(`Completing follow-up failed: ${error.message}`);
    }

    const { data: fuRow, error: fuErr } = await this.client
      .from('follow_ups')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', followUpId)
      .single();

    if (fuErr || !fuRow) {
      throw new Error(`Failed to load completed follow-up: ${fuErr?.message || 'Not found'}`);
    }

    const lead = await this.getLeadById(rpcData.leadId, user);
    const users = await this.getAllUsers(user);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const fu = mapFollowUpFromRow(fuRow, new Map([[lead!.id, lead!]]), userMap);
    return { followUp: fu, lead: lead! };
  }

  // --- GET FOLLOW UPS ---
  public async getFollowUps(
    telecallerId?: string,
    brandFilter?: 'ALL' | BusinessBrand,
    userContext?: User
  ): Promise<{ overdue: FollowUp[]; today: FollowUp[]; upcoming: FollowUp[]; completed: FollowUp[] }> {
    if (this.useFallback) return this.fallbackRepo.getFollowUps(telecallerId, brandFilter, userContext);
    if (!userContext) {
      throw new Error('Unauthorized: User context required to fetch follow-ups.');
    }
    const orgId = this.getOrganizationId(userContext);
    await this.recalculateFollowUpStatuses(orgId);

    const todayStr = new Date().toISOString().split('T')[0];
    let query = this.client.from('follow_ups').select('*').eq('organization_id', orgId);

    if (telecallerId) {
      query = query.eq('telecaller_id', telecallerId);
    }

    const { data: fuRows, error } = await query;
    if (error || !fuRows) return { overdue: [], today: [], upcoming: [], completed: [] };

    const leads = await this.getAllLeads(undefined, userContext);
    const leadMap = new Map(leads.map((l) => [l.id, l]));
    const users = await this.getAllUsers(userContext);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const filtered = fuRows
      .map((r) => mapFollowUpFromRow(r, leadMap, userMap))
      .filter((f) => {
        if (brandFilter && brandFilter !== 'ALL' && f.brand && f.brand !== brandFilter) return false;
        return true;
      });

    const overdue: FollowUp[] = [];
    const today: FollowUp[] = [];
    const upcoming: FollowUp[] = [];
    const completed: FollowUp[] = [];

    filtered.forEach((f) => {
      if (f.status === 'COMPLETED' || f.status === 'CANCELLED') {
        completed.push(f);
      } else if (f.dueDate < todayStr || f.status === 'OVERDUE') {
        overdue.push(f);
      } else if (f.dueDate === todayStr) {
        today.push(f);
      } else {
        upcoming.push(f);
      }
    });

    overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    today.sort((a, b) => a.dueTime.localeCompare(b.dueTime));
    upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    completed.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

    return { overdue, today, upcoming, completed };
  }

  // --- RECALCULATE FOLLOW UP STATUSES ---
  public async recalculateFollowUpStatuses(orgId: string): Promise<void> {
    if (this.useFallback) {
      this.fallbackRepo.recalculateFollowUpStatuses();
      return;
    }
    if (!orgId || typeof orgId !== 'string') {
      throw new Error('Unauthorized: Valid organization ID required to recalculate follow-up statuses.');
    }
    const todayStr = new Date().toISOString().split('T')[0];

    await this.client
      .from('follow_ups')
      .update({ status: 'OVERDUE', updated_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .eq('status', 'PENDING')
      .lt('due_date', todayStr);
  }

  // --- LEAD HISTORY ---
  public async getLeadHistory(leadId: string, userContext?: User): Promise<LeadHistory[]> {
    if (this.useFallback) {
      const res = await this.fallbackRepo.getLeadHistory(leadId, userContext);
      return res.history;
    }
    if (!userContext) {
      throw new Error('Unauthorized: User context required to fetch lead history.');
    }
    const orgId = this.getOrganizationId(userContext);
    const { data: rows } = await this.client
      .from('lead_history')
      .select('*')
      .eq('organization_id', orgId)
      .eq('lead_id', leadId)
      .order('timestamp', { ascending: false });

    if (!rows) return [];
    const users = await this.getAllUsers(userContext);
    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows.map((r) => mapLeadHistoryFromRow(r, userMap));
  }

  // --- ADMIN METRICS ---
  public async getAdminMetrics(brandFilter?: 'ALL' | BusinessBrand, userContext?: User): Promise<AdminMetrics> {
    if (this.useFallback) return this.fallbackRepo.getAdminMetrics(brandFilter, userContext);
    if (!userContext) {
      throw new Error('Unauthorized: User context required to fetch admin metrics.');
    }
    const orgId = this.getOrganizationId(userContext);
    await this.recalculateFollowUpStatuses(orgId);
    const todayStr = new Date().toISOString().split('T')[0];

    const allLeads = await this.getAllLeads(undefined, userContext);
    const filteredLeads = brandFilter && brandFilter !== 'ALL' ? allLeads.filter((l) => l.brand === brandFilter) : allLeads;

    const totalLeads = filteredLeads.length;
    const vidyaLeads = allLeads.filter((l) => l.brand === 'APNI_VIDYA').length;
    const estateLeads = allLeads.filter((l) => l.brand === 'APNI_ESTATE').length;
    const assignedLeads = filteredLeads.filter((l) => l.assignedTo !== null).length;
    const unassignedLeads = totalLeads - assignedLeads;

    const { data: allCalls } = await this.client
      .from('call_activities')
      .select('*')
      .eq('organization_id', orgId);

    const callsList = allCalls || [];
    const callsMade = callsList.length;

    const callsToday = callsList.filter((c) => {
      const calledAtStr = c.called_at || c.created_at || '';
      if (!calledAtStr.startsWith(todayStr)) return false;
      if (brandFilter && brandFilter !== 'ALL') {
        const l = allLeads.find((x) => x.id === c.lead_id);
        return l?.brand === brandFilter;
      }
      return true;
    }).length;

    const activeCallers = (await this.getTelecallers(brandFilter, userContext)).filter((t) => t.isActive);
    const todayTarget = activeCallers.reduce((acc, t) => acc + (t.dailyTarget || 50), 0);
    const targetCompletion = todayTarget > 0 ? Math.min(100, Math.round((callsToday / todayTarget) * 100)) : 0;

    let interested = 0;
    let callbacks = 0;
    let followUps = 0;
    let demos = 0;
    let enrolled = 0;
    let siteVisits = 0;
    let negotiating = 0;
    let closed = 0;
    let notInterested = 0;
    let noAnswer = 0;
    let busy = 0;

    filteredLeads.forEach((l) => {
      if (l.status === 'INTERESTED') interested++;
      else if (l.status === 'CALLBACK' || l.status === 'FOLLOW_UP') {
        callbacks++;
        followUps++;
      } else if (l.status === 'DEMO') demos++;
      else if (l.status === 'ENROLLED') enrolled++;
      else if (l.status === 'SITE_VISIT_SCHEDULED') siteVisits++;
      else if (l.status === 'NEGOTIATING') negotiating++;
      else if (l.status === 'CLOSED' || l.status === 'BOOKING' || l.status === 'SALE') closed++;
      else if (l.status === 'NOT_INTERESTED') notInterested++;
      else if (l.status === 'NO_ANSWER' || l.status === 'RINGING') noAnswer++;
      else if (l.status === 'BUSY') busy++;
    });

    const vidyaAll = allLeads.filter((l) => l.brand === 'APNI_VIDYA');
    const vidyaEnrolled = vidyaAll.filter((l) => l.status === 'ENROLLED').length;
    const vidyaInterested = vidyaAll.filter((l) => l.status === 'INTERESTED').length;
    const vidyaCallbacks = vidyaAll.filter((l) => l.status === 'CALLBACK' || l.status === 'FOLLOW_UP').length;
    const vidyaDemos = vidyaAll.filter((l) => l.status === 'DEMO').length;
    const vidyaNotInterested = vidyaAll.filter((l) => l.status === 'NOT_INTERESTED').length;
    const vidyaConversionRate = vidyaAll.length > 0 ? Math.round((vidyaEnrolled / vidyaAll.length) * 100) : 0;

    const estateAll = allLeads.filter((l) => l.brand === 'APNI_ESTATE');
    const estateClosed = estateAll.filter((l) => l.status === 'CLOSED' || l.status === 'BOOKING' || l.status === 'SALE').length;
    const estateInterested = estateAll.filter((l) => l.status === 'INTERESTED').length;
    const estateSiteVisits = estateAll.filter((l) => l.status === 'SITE_VISIT_SCHEDULED').length;
    const estateNegotiating = estateAll.filter((l) => l.status === 'NEGOTIATING').length;
    const estateNotInterested = estateAll.filter((l) => l.status === 'NOT_INTERESTED').length;
    const estateConversionRate = estateAll.length > 0 ? Math.round((estateClosed / estateAll.length) * 100) : 0;

    const followUpsObj = await this.getFollowUps(undefined, brandFilter, userContext);
    const overdueFollowUps = followUpsObj.overdue.length;
    const todayFollowUps = followUpsObj.today.length;
    const upcomingFollowUps = followUpsObj.upcoming.length;

    return {
      totalLeads,
      vidyaLeads,
      estateLeads,
      assignedLeads,
      unassignedLeads,
      callsMade,
      callsToday,
      todayTarget,
      targetCompletion,
      activeTelecallers: activeCallers.length,
      vidyaMetrics: {
        total: vidyaAll.length,
        interested: vidyaInterested,
        callbacks: vidyaCallbacks,
        demos: vidyaDemos,
        enrolled: vidyaEnrolled,
        notInterested: vidyaNotInterested,
        conversionRate: vidyaConversionRate,
      },
      estateMetrics: {
        total: estateAll.length,
        interested: estateInterested,
        siteVisits: estateSiteVisits,
        negotiating: estateNegotiating,
        closed: estateClosed,
        notInterested: estateNotInterested,
        conversionRate: estateConversionRate,
      },
      interested,
      callbacks,
      followUps,
      overdueFollowUps,
      todayFollowUps,
      upcomingFollowUps,
      demos,
      enrolled,
      siteVisits,
      negotiating,
      closed,
      notInterested,
      noAnswer,
      busy,
    };
  }

  // --- TELECALLER METRICS ---
  public async getTelecallerMetrics(telecallerId: string, userContext?: User): Promise<TelecallerMetrics> {
    if (this.useFallback) return this.fallbackRepo.getTelecallerMetrics(telecallerId, userContext);
    if (!userContext) {
      throw new Error('Unauthorized: User context required to fetch telecaller metrics.');
    }
    const orgId = this.getOrganizationId(userContext);
    const tc = await this.findUserById(telecallerId, userContext);
    const todayStr = new Date().toISOString().split('T')[0];

    const assignedLeadsList = await this.getAllLeads({ assignedTo: telecallerId }, userContext);

    const { data: callsData } = await this.client
      .from('call_activities')
      .select('called_at, created_at')
      .eq('organization_id', orgId)
      .eq('telecaller_id', telecallerId);

    const callsMadeToday = (callsData || []).filter((c) => {
      const ts = c.called_at || c.created_at || '';
      return ts.startsWith(todayStr);
    }).length;

    const dailyTarget = tc?.dailyTarget || 50;
    const targetProgress = dailyTarget > 0 ? Math.min(100, Math.round((callsMadeToday / dailyTarget) * 100)) : 0;

    let interested = 0;
    let callbacks = 0;
    let notInterested = 0;
    let followUps = 0;
    let noAnswer = 0;
    let busy = 0;
    let demos = 0;
    let enrolled = 0;
    let siteVisits = 0;
    let negotiating = 0;
    let closed = 0;

    assignedLeadsList.forEach((l) => {
      if (l.status === 'INTERESTED') interested++;
      else if (l.status === 'CALLBACK') {
        callbacks++;
        followUps++;
      } else if (l.status === 'FOLLOW_UP') followUps++;
      else if (l.status === 'DEMO') demos++;
      else if (l.status === 'ENROLLED') enrolled++;
      else if (l.status === 'SITE_VISIT_SCHEDULED') siteVisits++;
      else if (l.status === 'NEGOTIATING') negotiating++;
      else if (l.status === 'CLOSED' || l.status === 'BOOKING' || l.status === 'SALE') closed++;
      else if (l.status === 'NOT_INTERESTED') notInterested++;
      else if (l.status === 'NO_ANSWER' || l.status === 'RINGING') noAnswer++;
      else if (l.status === 'BUSY') busy++;
    });

    return {
      telecallerId: tc ? tc.id : telecallerId,
      telecallerName: tc ? tc.name : 'Unknown',
      loginId: tc ? tc.loginId : '',
      brandAccess: tc ? tc.brandAccess : 'APNI_VIDYA',
      dailyTarget,
      assignedLeads: assignedLeadsList.length,
      callsMade: callsMadeToday,
      targetProgress,
      interested,
      callbacks,
      notInterested,
      followUps,
      noAnswer,
      busy,
      demos,
      enrolled,
      siteVisits,
      negotiating,
      closed,
      bookings: closed,
      sales: closed + enrolled,
    };
  }

  // --- ALL TELECALLERS PERFORMANCE ---
  public async getAllTelecallersPerformance(brandFilter?: 'ALL' | BusinessBrand, user?: User): Promise<TelecallerMetrics[]> {
    if (this.useFallback) return this.fallbackRepo.getAllTelecallersPerformance(brandFilter, user);
    if (!user) {
      throw new Error('Unauthorized: User context required to fetch telecaller performance.');
    }
    const telecallers = await this.getTelecallers(brandFilter, user);
    return Promise.all(telecallers.map((tc) => this.getTelecallerMetrics(tc.id, user)));
  }
}

export const dbRepository = new DbRepository();
