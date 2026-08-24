import bcrypt from 'bcryptjs';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import { devFallbackRepository } from './devFallbackRepository';
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

export class DbRepository {
  private defaultOrgId = 'org_demo_001';

  private get useFallback(): boolean {
    return !isSupabaseConfigured() && process.env.NODE_ENV !== 'production';
  }

  public getOrganizationId(user?: User): string {
    if (this.useFallback) {
      return devFallbackRepository!.getOrganizationId(user);
    }
    if (user) {
      const userOrg = (user as any).organizationId || (user as any).organization_id;
      if (userOrg) return userOrg;
      throw new Error('Unauthorized: Organization context required for authenticated requests.');
    }
    return this.defaultOrgId;
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
    if (this.useFallback) return devFallbackRepository!.getAllUsers(user);
    const orgId = this.getOrganizationId(user);
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('organization_id', orgId);

    if (error || !data) return [];
    return data.map(mapUserFromRow).map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public async getTelecallers(brandFilter?: 'ALL' | BusinessBrand, user?: User): Promise<User[]> {
    if (this.useFallback) return devFallbackRepository!.getTelecallers(brandFilter, user);
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
    if (this.useFallback) return devFallbackRepository!.findUserById(id, userContext);
    let query = this.client.from('users').select('*').eq('id', id);
    if (userContext) {
      const orgId = this.getOrganizationId(userContext);
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await query.single();
    if (error || !data) return undefined;
    return mapUserFromRow(data);
  }

  public async findUserByLoginId(loginId: string): Promise<(User & { passwordHash: string }) | undefined> {
    if (this.useFallback) return devFallbackRepository!.findUserByLoginId(loginId);
    if (!loginId) return undefined;
    const clean = loginId.trim().toLowerCase();

    const { data, error } = await this.client
      .from('users')
      .select('*')
      .ilike('login_id', clean);

    if (error || !data || data.length === 0) return undefined;
    return mapUserFromRow(data[0]);
  }

  public async registerAdmin(data: {
    companyName: string;
    loginId: string;
    passwordHash: string;
    phone?: string;
    email?: string;
  }): Promise<User> {
    if (this.useFallback) return devFallbackRepository!.registerAdmin(data);

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

  private async generateNextLoginId(brandAccess: BrandAccess, adminUser?: User): Promise<string> {
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
    adminUser?: User
  ): Promise<{ user: User; temporaryPassword?: string }> {
    if (this.useFallback) return devFallbackRepository!.createTelecaller(data, adminUser);

    const orgId = this.getOrganizationId(adminUser);
    const brandAccess = data.brandAccess || 'APNI_VIDYA';

    const finalLoginId = data.loginId?.trim()
      ? data.loginId.trim().toUpperCase()
      : await this.generateNextLoginId(brandAccess, adminUser);

    const existing = await this.findUserByLoginId(finalLoginId);
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
    adminUser?: User
  ): Promise<User> {
    if (this.useFallback) return devFallbackRepository!.updateTelecaller(id, updates, adminUser);
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
    adminUser?: User
  ): Promise<{ user: User; temporaryPassword: string }> {
    if (this.useFallback) return devFallbackRepository!.resetTelecallerPassword(id, adminUser);
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

  public async updateUserPassword(userId: string, newHash: string, userContext?: User): Promise<void> {
    if (this.useFallback) return devFallbackRepository!.updateUserPassword(userId, newHash, userContext);
    const orgId = userContext ? this.getOrganizationId(userContext) : undefined;
    let query = this.client
      .from('users')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { error } = await query;
    if (error) {
      throw new Error(`Failed to update user password: ${error.message}`);
    }
  }

  // --- ATOMIC TELECALLER DELETION (RPC) ---
  public async deleteTelecaller(id: string, adminUser?: User): Promise<{ success: boolean; unassignedLeadsCount: number }> {
    if (this.useFallback) return devFallbackRepository!.deleteTelecaller(id, adminUser);
    const orgId = this.getOrganizationId(adminUser);
    const adminId = adminUser?.id || 'usr_admin_001';

    // Call Atomic RPC
    const { data, error } = await this.client.rpc('delete_telecaller_atomic', {
      p_org_id: orgId,
      p_telecaller_id: id,
      p_admin_id: adminId,
    });

    if (error) {
      // Fallback if RPC not yet created in remote DB
      return this.deleteTelecallerSequential(id, orgId, adminId);
    }

    return {
      success: Boolean(data?.success),
      unassignedLeadsCount: Number(data?.unassignedLeadsCount) || 0,
    };
  }

  private async deleteTelecallerSequential(id: string, orgId: string, adminId: string) {
    const user = await this.findUserById(id);
    if (!user) throw new Error(`Telecaller not found with ID: ${id}`);

    const { data: assignedLeads } = await this.client
      .from('leads')
      .select('id')
      .eq('organization_id', orgId)
      .eq('assigned_to', id);

    const unassignedLeadsCount = assignedLeads?.length || 0;
    const nowIso = new Date().toISOString();

    if (unassignedLeadsCount > 0) {
      await this.client
        .from('leads')
        .update({ assigned_to: null, updated_at: nowIso })
        .eq('organization_id', orgId)
        .eq('assigned_to', id);

      const historyRows = assignedLeads!.map((l) => ({
        id: `hist_${l.id}_del_tc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        organization_id: orgId,
        lead_id: l.id,
        user_id: adminId,
        action: 'REASSIGNED',
        description: `Telecaller ${user.name} (${user.loginId}) was removed. Lead returned to Unassigned Pool.`,
        timestamp: nowIso,
      }));

      await this.client.from('lead_history').insert(historyRows);
    }

    const { error: delError } = await this.client
      .from('users')
      .delete()
      .eq('organization_id', orgId)
      .eq('id', id);

    if (delError) throw new Error(`Failed to delete telecaller user: ${delError.message}`);
    return { success: true, unassignedLeadsCount };
  }

  // --- LEAD METHODS ---
  public async getAllLeads(filter?: {
    brand?: 'ALL' | BusinessBrand;
    assignedTo?: string | null;
    status?: LeadStatus;
    search?: string;
  }, userContext?: User): Promise<Lead[]> {
    if (this.useFallback) return devFallbackRepository!.getAllLeads(filter, userContext);
    const orgId = userContext ? this.getOrganizationId(userContext) : this.defaultOrgId;
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
    if (this.useFallback) return devFallbackRepository!.getLeadById(id, userContext);
    const orgId = userContext ? this.getOrganizationId(userContext) : this.defaultOrgId;
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

  private async enrichLead(lead: Lead, userMap?: Map<string, User>, orgId?: string): Promise<Lead> {
    const resolvedOrgId = orgId || this.defaultOrgId;
    if (!userMap) {
      const users = await this.getAllUsers();
      userMap = new Map(users.map((u) => [u.id, u]));
    }

    const [{ data: historyRows }, { data: callRows }, { data: fuRows }] = await Promise.all([
      this.client
        .from('lead_history')
        .select('*')
        .eq('organization_id', resolvedOrgId)
        .eq('lead_id', lead.id)
        .order('timestamp', { ascending: false }),
      this.client
        .from('call_activities')
        .select('*')
        .eq('organization_id', resolvedOrgId)
        .eq('lead_id', lead.id)
        .order('called_at', { ascending: false }),
      this.client
        .from('follow_ups')
        .select('*')
        .eq('organization_id', resolvedOrgId)
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
    if (this.useFallback) return devFallbackRepository!.importLeads(rows, assignedToTelecallerId, adminUser, defaultBrand);
    const orgId = this.getOrganizationId(adminUser);
    const now = new Date();
    const importedLeads: Lead[] = [];
    let importedCount = 0;
    let failedCount = 0;

    const users = await this.getAllUsers(adminUser);
    const tc = assignedToTelecallerId ? users.find((u) => u.id === assignedToTelecallerId) : null;
    const admin = adminUser || { id: 'usr_admin_001', name: 'Master Admin HQ' } as any;

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

  // --- ATOMIC LEAD ASSIGNMENT (RPC) ---
  public async assignLeads(
    leadIds: string[],
    telecallerId: string | null,
    adminUser: User
  ): Promise<{ assignedCount: number; leads: Lead[] }> {
    if (this.useFallback) return devFallbackRepository!.assignLeads(leadIds, telecallerId, adminUser);
    const orgId = this.getOrganizationId(adminUser);

    // Call Atomic RPC
    const { data, error } = await this.client.rpc('assign_leads_atomic', {
      p_org_id: orgId,
      p_lead_ids: leadIds,
      p_telecaller_id: telecallerId,
      p_admin_id: adminUser.id,
    });

    if (error) {
      return this.assignLeadsSequential(leadIds, telecallerId, adminUser, orgId);
    }

    const assignedCount = Number(data?.assignedCount) || 0;
    const modifiedLeads = await Promise.all(leadIds.map((id) => this.getLeadById(id, adminUser)));
    return { assignedCount, leads: modifiedLeads.filter(Boolean) as Lead[] };
  }

  private async assignLeadsSequential(leadIds: string[], telecallerId: string | null, adminUser: User, orgId: string) {
    const nowIso = new Date().toISOString();
    const users = await this.getAllUsers(adminUser);
    const tc = telecallerId ? users.find((u) => u.id === telecallerId) : null;

    let assignedCount = 0;
    const modifiedLeads: Lead[] = [];

    for (const id of leadIds) {
      const lead = await this.getLeadById(id, adminUser);
      if (!lead) continue;

      const previousTcName = lead.assignedTelecallerName || 'Unassigned';
      const updatedAssignedTo = tc ? tc.id : null;

      await this.client
        .from('leads')
        .update({ assigned_to: updatedAssignedTo, updated_at: nowIso })
        .eq('organization_id', orgId)
        .eq('id', id);

      const historyId = `hist_${id}_assign_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      await this.client.from('lead_history').insert({
        id: historyId,
        organization_id: orgId,
        lead_id: id,
        user_id: adminUser.id,
        action: tc ? 'ASSIGNED' : 'REASSIGNED',
        description: tc
          ? `Lead assigned to ${tc.name} (${tc.loginId}) [Brand Access: ${tc.brandAccess}] by ${adminUser.name}. Previous: ${previousTcName}.`
          : `Lead returned to Unassigned Pool by ${adminUser.name}.`,
        timestamp: nowIso,
      });

      const asgnId = `asgn_${id}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      await this.client.from('lead_assignments').insert({
        id: asgnId,
        organization_id: orgId,
        lead_id: id,
        assigned_to: updatedAssignedTo,
        assigned_by: adminUser.id,
        assignment_type: tc ? 'ASSIGNED' : 'UNASSIGNED',
        created_at: nowIso,
      });

      assignedCount++;
      const updatedLead = await this.getLeadById(id, adminUser);
      if (updatedLead) modifiedLeads.push(updatedLead);
    }

    return { assignedCount, leads: modifiedLeads };
  }

  // --- ATOMIC AUTO-DISTRIBUTION (RPC) ---
  public async autoDistributeLeads(
    brandFilter?: 'ALL' | BusinessBrand,
    adminUser?: User
  ): Promise<{ vidyaAssigned: number; estateAssigned: number; totalAssigned: number; message: string }> {
    if (this.useFallback) return devFallbackRepository!.autoDistributeLeads(brandFilter, adminUser);
    const orgId = this.getOrganizationId(adminUser);
    const adminId = adminUser?.id || 'usr_admin_001';

    const { data, error } = await this.client.rpc('auto_distribute_leads_atomic', {
      p_org_id: orgId,
      p_brand_filter: brandFilter || 'ALL',
      p_admin_id: adminId,
    });

    if (error) {
      return this.autoDistributeLeadsSequential(brandFilter, adminUser, orgId, adminId);
    }

    return {
      vidyaAssigned: Number(data?.vidyaAssigned) || 0,
      estateAssigned: Number(data?.estateAssigned) || 0,
      totalAssigned: Number(data?.totalAssigned) || 0,
      message: String(data?.message || 'Automated distribution completed via PostgreSQL transaction.'),
    };
  }

  private async autoDistributeLeadsSequential(brandFilter: any, adminUser: any, orgId: string, adminId: string) {
    const nowIso = new Date().toISOString();
    const admin = adminUser || { id: 'usr_admin_001', name: 'Master Admin' } as any;

    let vidyaAssigned = 0;
    let estateAssigned = 0;

    const allUsers = await this.getAllUsers(adminUser);
    const vidyaCallers = allUsers.filter((u) => u.role === 'TELECALLER' && u.isActive && (u.brandAccess === 'APNI_VIDYA' || u.brandAccess === 'BOTH'));
    const estateCallers = allUsers.filter((u) => u.role === 'TELECALLER' && u.isActive && (u.brandAccess === 'APNI_ESTATE' || u.brandAccess === 'BOTH'));

    if (!brandFilter || brandFilter === 'ALL' || brandFilter === 'APNI_VIDYA') {
      if (vidyaCallers.length > 0) {
        const { data: unassignedVidya } = await this.client
          .from('leads')
          .select('id')
          .eq('organization_id', orgId)
          .eq('brand', 'APNI_VIDYA')
          .is('assigned_to', null);

        if (unassignedVidya && unassignedVidya.length > 0) {
          for (let index = 0; index < unassignedVidya.length; index++) {
            const lead = unassignedVidya[index];
            const targetCaller = vidyaCallers[index % vidyaCallers.length];

            await this.client.from('leads').update({ assigned_to: targetCaller.id, updated_at: nowIso }).eq('id', lead.id);
            await this.client.from('lead_history').insert({
              id: `hist_${lead.id}_auto_${Date.now()}_${index}`,
              organization_id: orgId,
              lead_id: lead.id,
              user_id: admin.id,
              action: 'ASSIGNED',
              description: `Auto-routed to ${targetCaller.name} via Apni Vidya Distribution Engine.`,
              timestamp: nowIso,
            });
            await this.client.from('lead_assignments').insert({
              id: `asgn_${lead.id}_auto_${Date.now()}_${index}`,
              organization_id: orgId,
              lead_id: lead.id,
              assigned_to: targetCaller.id,
              assigned_by: admin.id,
              assignment_type: 'ASSIGNED',
              created_at: nowIso,
            });
            vidyaAssigned++;
          }
        }
      }
    }

    if (!brandFilter || brandFilter === 'ALL' || brandFilter === 'APNI_ESTATE') {
      if (estateCallers.length > 0) {
        const { data: unassignedEstate } = await this.client
          .from('leads')
          .select('id')
          .eq('organization_id', orgId)
          .eq('brand', 'APNI_ESTATE')
          .is('assigned_to', null);

        if (unassignedEstate && unassignedEstate.length > 0) {
          for (let index = 0; index < unassignedEstate.length; index++) {
            const lead = unassignedEstate[index];
            const targetCaller = estateCallers[index % estateCallers.length];

            await this.client.from('leads').update({ assigned_to: targetCaller.id, updated_at: nowIso }).eq('id', lead.id);
            await this.client.from('lead_history').insert({
              id: `hist_${lead.id}_auto_${Date.now()}_${index}`,
              organization_id: orgId,
              lead_id: lead.id,
              user_id: admin.id,
              action: 'ASSIGNED',
              description: `Auto-routed to ${targetCaller.name} via Apni Estate Distribution Engine.`,
              timestamp: nowIso,
            });
            await this.client.from('lead_assignments').insert({
              id: `asgn_${lead.id}_auto_${Date.now()}_${index}`,
              organization_id: orgId,
              lead_id: lead.id,
              assigned_to: targetCaller.id,
              assigned_by: admin.id,
              assignment_type: 'ASSIGNED',
              created_at: nowIso,
            });
            estateAssigned++;
          }
        }
      }
    }

    return {
      vidyaAssigned,
      estateAssigned,
      totalAssigned: vidyaAssigned + estateAssigned,
      message: `Automated distribution complete: ${vidyaAssigned} Vidya leads and ${estateAssigned} Estate leads routed.`,
    };
  }

  // --- ATOMIC CALL LOGGING (RPC) ---
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
      const res = await devFallbackRepository!.recordCallActivity(data, userContext);
      return { callActivity: res.callActivity, lead: res.lead, followUp: res.followUp };
    }
    const orgId = userContext ? this.getOrganizationId(userContext) : this.defaultOrgId;

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
      return this.recordCallActivitySequential(data, orgId, userContext);
    }

    const updatedLead = await this.getLeadById(data.leadId, userContext);
    const { data: callRow } = await this.client
      .from('call_activities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', rpcData.callActivityId)
      .single();

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

  private async recordCallActivitySequential(data: any, orgId: string, userContext?: User) {
    const lead = await this.getLeadById(data.leadId, userContext);
    if (!lead) throw new Error(`Lead with ID ${data.leadId} was not found.`);

    const tc = await this.findUserById(data.telecallerId, userContext);
    if (!tc) throw new Error(`Telecaller with ID ${data.telecallerId} was not found.`);

    const nowIso = new Date().toISOString();
    const prevStatus = lead.status;

    const callActivityId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const callActivity: CallActivity = {
      id: callActivityId,
      leadId: lead.id,
      telecallerId: tc.id,
      telecallerName: tc.name,
      status: data.status,
      note: data.note?.trim(),
      calledAt: nowIso,
      durationSeconds: data.durationSeconds || 0,
      callType: data.callType || 'CALL',
    };

    await this.client.from('call_activities').insert({
      id: callActivity.id,
      organization_id: orgId,
      lead_id: callActivity.leadId,
      telecaller_id: callActivity.telecallerId,
      status: callActivity.status,
      note: callActivity.note || null,
      called_at: callActivity.calledAt,
      duration_seconds: callActivity.durationSeconds || 0,
      call_type: callActivity.callType,
    });

    const leadUpdatePayload: any = {
      status: data.status,
      last_call_at: nowIso,
      total_calls_count: (lead.totalCallsCount || 0) + 1,
      updated_at: nowIso,
    };

    if (data.note) leadUpdatePayload.notes = data.note.trim();
    if (data.customFields) {
      if (data.customFields.courseInterest) leadUpdatePayload.course_interest = data.customFields.courseInterest;
      if (data.customFields.qualification) leadUpdatePayload.qualification = data.customFields.qualification;
      if (data.customFields.preferredBatch) leadUpdatePayload.preferred_batch = data.customFields.preferredBatch;
      if (data.customFields.propertyType) leadUpdatePayload.property_type = data.customFields.propertyType;
      if (data.customFields.budget) leadUpdatePayload.budget = data.customFields.budget;
      if (data.customFields.preferredLocation) leadUpdatePayload.preferred_location = data.customFields.preferredLocation;
      if (data.customFields.siteVisitDate) leadUpdatePayload.site_visit_date = data.customFields.siteVisitDate;
    }

    await this.client.from('lead_history').insert({
      id: `hist_${lead.id}_call_${Date.now()}`,
      organization_id: orgId,
      lead_id: lead.id,
      user_id: tc.id,
      action: 'CALL_MADE',
      description: `${data.callType === 'WHATSAPP' ? 'WhatsApp outreach' : 'Phone call'} by ${tc.name}. Status: [${data.status}] (Previous: [${prevStatus}]). ${data.note ? `Note: "${data.note}"` : ''}`,
      timestamp: nowIso,
    });

    let createdFollowUp: FollowUp | undefined = undefined;
    if (data.followUp && data.followUp.dueDate) {
      createdFollowUp = await this.scheduleFollowUp({
        leadId: lead.id,
        telecallerId: tc.id,
        dueDate: data.followUp.dueDate,
        dueTime: data.followUp.dueTime || '04:00 PM',
        note: data.followUp.note || data.note,
      }, userContext);

      leadUpdatePayload.next_follow_up_at = `${data.followUp.dueDate} ${data.followUp.dueTime || '04:00 PM'}`;
    }

    await this.client.from('leads').update(leadUpdatePayload).eq('organization_id', orgId).eq('id', lead.id);
    const updatedLead = await this.getLeadById(lead.id, userContext);

    return { callActivity, lead: updatedLead!, followUp: createdFollowUp };
  }

  // --- ATOMIC FOLLOW-UP CREATION (RPC) ---
  public async scheduleFollowUp(data: {
    leadId: string;
    telecallerId: string;
    dueDate: string;
    dueTime: string;
    note?: string;
  }, userContext?: User): Promise<FollowUp> {
    if (this.useFallback) {
      const res = await devFallbackRepository!.scheduleFollowUp(data, userContext);
      return res.followUp;
    }
    const orgId = userContext ? this.getOrganizationId(userContext) : this.defaultOrgId;

    const { data: rpcData, error } = await this.client.rpc('schedule_follow_up_atomic', {
      p_org_id: orgId,
      p_lead_id: data.leadId,
      p_telecaller_id: data.telecallerId,
      p_due_date: data.dueDate,
      p_due_time: data.dueTime || '04:00 PM',
      p_note: data.note || null,
    });

    if (error) {
      return this.scheduleFollowUpSequential(data, orgId, userContext);
    }

    const { data: fuRow } = await this.client
      .from('follow_ups')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', rpcData.followUpId)
      .single();

    const lead = await this.getLeadById(data.leadId, userContext);
    const users = await this.getAllUsers(userContext);
    const userMap = new Map(users.map((u) => [u.id, u]));

    return mapFollowUpFromRow(fuRow, new Map([[lead!.id, lead!]]), userMap);
  }

  private async scheduleFollowUpSequential(data: any, orgId: string, userContext?: User) {
    const lead = await this.getLeadById(data.leadId, userContext);
    if (!lead) throw new Error(`Lead with ID ${data.leadId} not found.`);

    const tc = await this.findUserById(data.telecallerId, userContext);
    if (!tc) throw new Error(`Telecaller with ID ${data.telecallerId} not found.`);

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    let status: 'PENDING' | 'OVERDUE' = 'PENDING';
    if (data.dueDate < todayStr) status = 'OVERDUE';

    const fu: FollowUp = {
      id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      brand: lead.brand,
      telecallerId: tc.id,
      telecallerName: tc.name,
      dateTime: `${data.dueDate}T${data.dueTime || '12:00'}`,
      dueDate: data.dueDate,
      dueTime: data.dueTime || '04:00 PM',
      note: data.note,
      status,
      createdAt: nowIso,
    };

    await this.client.from('follow_ups').insert(mapFollowUpToRow(fu, orgId));
    await this.client.from('leads').update({ next_follow_up_at: `${data.dueDate} ${data.dueTime || '04:00 PM'}`, updated_at: nowIso }).eq('organization_id', orgId).eq('id', lead.id);
    await this.client.from('lead_history').insert({
      id: `hist_${lead.id}_fu_sched_${Date.now()}`,
      organization_id: orgId,
      lead_id: lead.id,
      user_id: tc.id,
      action: 'FOLLOW_UP_CREATED',
      description: `Follow-up scheduled for ${fu.dueDate} at ${fu.dueTime} by ${tc.name}.`,
      timestamp: nowIso,
    });

    return fu;
  }

  // --- ATOMIC FOLLOW-UP COMPLETION (RPC) ---
  public async completeFollowUp(
    followUpId: string,
    user: User,
    completionNote?: string
  ): Promise<{ followUp: FollowUp; lead: Lead }> {
    if (this.useFallback) return devFallbackRepository!.completeFollowUp(followUpId, user, completionNote);
    const orgId = this.getOrganizationId(user);

    const { data: rpcData, error } = await this.client.rpc('complete_follow_up_atomic', {
      p_org_id: orgId,
      p_follow_up_id: followUpId,
      p_user_id: user.id,
      p_user_role: user.role,
      p_completion_note: completionNote || null,
    });

    if (error) {
      return this.completeFollowUpSequential(followUpId, user, completionNote, orgId);
    }

    const { data: fuRow } = await this.client
      .from('follow_ups')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', followUpId)
      .single();

    const lead = await this.getLeadById(rpcData.leadId, user);
    const users = await this.getAllUsers(user);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const fu = mapFollowUpFromRow(fuRow, new Map([[lead!.id, lead!]]), userMap);
    return { followUp: fu, lead: lead! };
  }

  private async completeFollowUpSequential(followUpId: string, user: User, completionNote: string | undefined, orgId: string) {
    const { data: fuRow } = await this.client
      .from('follow_ups')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', followUpId)
      .single();

    if (!fuRow) throw new Error(`Follow-up not found with ID: ${followUpId}`);

    const nowIso = new Date().toISOString();
    const updatedNote = completionNote ? `${fuRow.note ? fuRow.note + ' | ' : ''}Completion Note: ${completionNote}` : fuRow.note;

    const { data: updatedFuRow } = await this.client
      .from('follow_ups')
      .update({ status: 'COMPLETED', completed_at: nowIso, note: updatedNote, updated_at: nowIso })
      .eq('organization_id', orgId)
      .eq('id', followUpId)
      .select()
      .single();

    const fu = mapFollowUpFromRow(updatedFuRow);
    await this.client.from('leads').update({ next_follow_up_at: null, updated_at: nowIso }).eq('organization_id', orgId).eq('id', fu.leadId);
    await this.client.from('lead_history').insert({
      id: `hist_${fu.leadId}_fu_done_${Date.now()}`,
      organization_id: orgId,
      lead_id: fu.leadId,
      user_id: user.id,
      action: 'FOLLOW_UP_COMPLETED',
      description: `Follow-up marked as COMPLETED by ${user.name}.`,
      timestamp: nowIso,
    });

    const lead = await this.getLeadById(fu.leadId, user);
    return { followUp: fu, lead: lead! };
  }

  // --- GET FOLLOW UPS ---
  public async getFollowUps(
    telecallerId?: string,
    brandFilter?: 'ALL' | BusinessBrand,
    userContext?: User
  ): Promise<{ overdue: FollowUp[]; today: FollowUp[]; upcoming: FollowUp[]; completed: FollowUp[] }> {
    if (this.useFallback) return devFallbackRepository!.getFollowUps(telecallerId, brandFilter, userContext);
    const orgId = userContext ? this.getOrganizationId(userContext) : this.defaultOrgId;
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
  public async recalculateFollowUpStatuses(orgId?: string): Promise<void> {
    if (this.useFallback) {
      devFallbackRepository!.recalculateFollowUpStatuses();
      return;
    }
    const resolvedOrgId = orgId || this.defaultOrgId;
    const todayStr = new Date().toISOString().split('T')[0];

    await this.client
      .from('follow_ups')
      .update({ status: 'OVERDUE', updated_at: new Date().toISOString() })
      .eq('organization_id', resolvedOrgId)
      .eq('status', 'PENDING')
      .lt('due_date', todayStr);
  }

  // --- LEAD HISTORY ---
  public async getLeadHistory(leadId: string, userContext?: User): Promise<LeadHistory[]> {
    if (this.useFallback) {
      const res = await devFallbackRepository!.getLeadHistory(leadId, userContext);
      return res.history;
    }
    const orgId = userContext ? this.getOrganizationId(userContext) : this.defaultOrgId;
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
    if (this.useFallback) return devFallbackRepository!.getAdminMetrics(brandFilter, userContext);
    const orgId = userContext ? this.getOrganizationId(userContext) : this.defaultOrgId;
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
    if (this.useFallback) return devFallbackRepository!.getTelecallerMetrics(telecallerId, userContext);
    const orgId = userContext ? this.getOrganizationId(userContext) : this.defaultOrgId;
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
  public async getAllTelecallersPerformance(brandFilter?: 'ALL' | BusinessBrand, userContext?: User): Promise<TelecallerMetrics[]> {
    if (this.useFallback) return devFallbackRepository!.getAllTelecallersPerformance(brandFilter, userContext);
    const telecallers = await this.getTelecallers(brandFilter, userContext);
    return Promise.all(telecallers.map((tc) => this.getTelecallerMetrics(tc.id, userContext)));
  }
}

export const dbRepository = new DbRepository();
