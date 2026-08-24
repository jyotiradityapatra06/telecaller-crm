import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Organization,
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

// ============================================================================
// DEVELOPMENT-ONLY LOCAL REPOSITORY FALLBACK
// STRICT SECURITY GUARD: NEVER RUN IN PRODUCTION
// ============================================================================
if (process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: Development fallback repository cannot be initialized in production environment.');
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'crm_db.json');

export class DevFallbackRepository {
  private defaultOrgId = 'org_demo_001';
  private organizations: Organization[] = [];
  private users: (User & { passwordHash: string })[] = [];
  private leads: Lead[] = [];
  private callActivities: CallActivity[] = [];
  private followUps: FollowUp[] = [];
  private leadHistories: LeadHistory[] = [];
  private initialized = false;

  constructor() {
    this.ensureLoaded();
  }

  private ensureLoaded(): void {
    if (this.initialized) return;
    this.loadFromDisk();
    this.initialized = true;
  }

  public getOrganizationId(user?: User): string {
    if (user) {
      const userOrg = user.organizationId || (user as any).organization_id;
      if (userOrg) return userOrg;
    }
    throw new Error('Unauthorized: Organization tenant context required for authenticated requests.');
  }

  // --- DISK STORAGE PERSISTENCE ENGINE ---
  public loadFromDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.users) && data.users.length > 0) {
          this.organizations = Array.isArray(data.organizations) && data.organizations.length > 0
            ? data.organizations
            : [{
                id: 'org_demo_001',
                name: 'Apni CRM Demo',
                slug: 'demo',
                isDemo: true,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }];

          this.users = data.users.map((u: any) => ({
            ...u,
            organizationId: u.organizationId || 'org_demo_001',
          }));

          this.leads = (data.leads || []).map((l: any) => ({
            ...l,
            organizationId: l.organizationId || 'org_demo_001',
          }));

          this.callActivities = (data.callActivities || []).map((c: any) => ({
            ...c,
            organizationId: c.organizationId || 'org_demo_001',
          }));

          this.followUps = (data.followUps || []).map((f: any) => ({
            ...f,
            organizationId: f.organizationId || 'org_demo_001',
          }));

          this.leadHistories = (data.leadHistories || []).map((h: any) => ({
            ...h,
            organizationId: h.organizationId || 'org_demo_001',
          }));

          this.recalculateFollowUpStatuses();
          console.log(`📦 [DevFallback] Loaded local development database: ${this.leads.length} leads, ${this.users.length} users, ${this.organizations.length} organizations.`);
          return;
        }
      }
    } catch (err) {
      console.error('⚠️ [DevFallback] Failed to load crm_db.json from disk, seeding in-memory demo data:', err);
    }

    this.seedInitialData();
  }

  public persistToDisk(): void {
    try {
      if (process.env.NODE_ENV === 'production') return;
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const payload = {
        organizations: this.organizations,
        users: this.users,
        leads: this.leads,
        callActivities: this.callActivities,
        followUps: this.followUps,
        leadHistories: this.leadHistories,
        lastSaved: new Date().toISOString(),
      };

      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('⚠️ [DevFallback] Failed to persist database to disk:', err);
    }
  }

  // --- SEED INITIAL DEMO DATA ---
  public seedInitialData(): void {
    this.users = [];
    this.leads = [];
    this.callActivities = [];
    this.followUps = [];
    this.leadHistories = [];

    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);
    const telecallerPasswordHash = bcrypt.hashSync('password123', salt);

    const now = new Date().toISOString();

    this.users = [
      {
        id: 'usr_admin_001',
        name: 'Master Admin HQ',
        loginId: 'admin',
        role: 'ADMIN',
        brandAccess: 'BOTH',
        dailyTarget: 50,
        phone: '+91 98765 43210',
        email: 'admin@apnicrm.com',
        isActive: true,
        passwordHash: adminPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_tc_vidya_1',
        name: 'Rahul Sharma',
        loginId: 'TC_VIDYA_1',
        role: 'TELECALLER',
        brandAccess: 'APNI_VIDYA',
        dailyTarget: 45,
        phone: '+91 98111 22334',
        email: 'rahul.vidya@apnicrm.com',
        isActive: true,
        passwordHash: telecallerPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_tc_vidya_2',
        name: 'Pooja Patel',
        loginId: 'TC_VIDYA_2',
        role: 'TELECALLER',
        brandAccess: 'APNI_VIDYA',
        dailyTarget: 40,
        phone: '+91 98222 33445',
        email: 'pooja.vidya@apnicrm.com',
        isActive: true,
        passwordHash: telecallerPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_tc_estate_1',
        name: 'Amit Kumar',
        loginId: 'TC_ESTATE_1',
        role: 'TELECALLER',
        brandAccess: 'APNI_ESTATE',
        dailyTarget: 35,
        phone: '+91 98333 44556',
        email: 'amit.estate@apnicrm.com',
        isActive: true,
        passwordHash: telecallerPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_tc_estate_2',
        name: 'Neha Singh',
        loginId: 'TC_ESTATE_2',
        role: 'TELECALLER',
        brandAccess: 'APNI_ESTATE',
        dailyTarget: 30,
        phone: '+91 98444 55667',
        email: 'neha.estate@apnicrm.com',
        isActive: true,
        passwordHash: telecallerPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_tc_dual_1',
        name: 'Vikram Malhotra',
        loginId: 'TC_DUAL_1',
        role: 'TELECALLER',
        brandAccess: 'BOTH',
        dailyTarget: 50,
        phone: '+91 98555 66778',
        email: 'vikram.dual@apnicrm.com',
        isActive: true,
        passwordHash: telecallerPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.persistToDisk();
    console.log('✅ [DevFallback] Seeded default demo accounts.');
  }

  // --- USER METHODS ---
  public async getAllUsers(user?: User): Promise<User[]> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(user);
    return this.users
      .filter((u) => u.organizationId === orgId)
      .map(({ passwordHash: _, ...safeUser }) => safeUser);
  }

  public async getTelecallers(brandFilter?: 'ALL' | BusinessBrand, user?: User): Promise<User[]> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(user);
    return this.users
      .filter((u) => u.organizationId === orgId && u.role === 'TELECALLER')
      .filter((u) => {
        if (!brandFilter || brandFilter === 'ALL') return true;
        return u.brandAccess === brandFilter || u.brandAccess === 'BOTH';
      })
      .map(({ passwordHash: _, ...safeUser }) => safeUser);
  }

  public async findUserById(id: string, userContext?: User): Promise<(User & { passwordHash: string }) | undefined> {
    this.ensureLoaded();
    const clean = id.trim().toLowerCase();
    const user = this.users.find((u) => u.id.toLowerCase() === clean);
    if (!user) return undefined;
    if (userContext && user.organizationId !== userContext.organizationId) {
      return undefined;
    }
    return user;
  }

  public async findUserByLoginId(loginId: string): Promise<(User & { passwordHash: string }) | undefined> {
    this.ensureLoaded();
    if (!loginId) return undefined;
    const clean = loginId.trim().toLowerCase();

    const directUser = this.users.find((u) => u.loginId.toLowerCase() === clean);
    if (directUser) return directUser;

    const idUser = this.users.find((u) => u.id.toLowerCase() === clean);
    if (idUser) return idUser;

    const aliasMap: Record<string, string> = {
      tc001: 'tc_vidya_1',
      tc1: 'tc_vidya_1',
      tc_vidya_1: 'tc_vidya_1',
      tcvidya1: 'tc_vidya_1',
      tc002: 'tc_estate_1',
      tc2: 'tc_estate_1',
      tc_estate_1: 'tc_estate_1',
      tcestate1: 'tc_estate_1',
      tc003: 'tc_dual_1',
      tc3: 'tc_dual_1',
      tc_dual_1: 'tc_dual_1',
      tcdual1: 'tc_dual_1',
    };

    const targetLoginId = aliasMap[clean];
    if (targetLoginId) {
      return this.users.find((u) => u.loginId.toLowerCase() === targetLoginId);
    }

    return undefined;
  }

  public async registerAdmin(data: {
    companyName: string;
    loginId: string;
    passwordHash: string;
    phone?: string;
    email?: string;
  }): Promise<User> {
    this.ensureLoaded();
    const cleanId = data.loginId.trim().toUpperCase();
    const existing = await this.findUserByLoginId(cleanId);
    if (existing) {
      throw new Error('Login ID already exists. Please choose another.');
    }

    const now = new Date().toISOString();
    const orgId = `org_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newOrg: Organization = {
      id: orgId,
      name: data.companyName.trim(),
      slug: data.companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `org-${Date.now()}`,
      isDemo: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

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

    this.organizations.push(newOrg);
    this.users.push(newAdmin);
    this.persistToDisk();

    const { passwordHash: _, ...safeUser } = newAdmin;
    return safeUser;
  }

  private generateNextLoginId(brandAccess: BrandAccess, _adminUser?: User): string {
    const prefix =
      brandAccess === 'APNI_VIDYA'
        ? 'TC_VIDYA'
        : brandAccess === 'APNI_ESTATE'
        ? 'TC_ESTATE'
        : 'TC_DUAL';

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}_(\\d+)$`, 'i');
    for (const u of this.users) {
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
    this.ensureLoaded();
    const orgId = this.getOrganizationId(adminUser);

    const brandAccess = data.brandAccess || 'APNI_VIDYA';
    const finalLoginId = data.loginId?.trim()
      ? data.loginId.trim().toUpperCase()
      : this.generateNextLoginId(brandAccess, adminUser);

    const existing = this.users.find(
      (u) => u.loginId.toLowerCase() === finalLoginId.toLowerCase()
    );
    if (existing) {
      throw new Error(`Login ID "${finalLoginId}" already exists. Please choose a unique Login ID.`);
    }

    const plainPassword = data.password?.trim() || this.generateTemporaryPassword();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(plainPassword, salt);
    const now = new Date().toISOString();

    const newUser: User & { passwordHash: string } = {
      id: `usr_tc_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 5)}`,
      organizationId: orgId,
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

    this.users.push(newUser);
    this.persistToDisk();

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
    this.ensureLoaded();
    const orgId = this.getOrganizationId(adminUser);
    const user = this.users.find((u) => u.id === id && u.organizationId === orgId);
    if (!user) {
      throw new Error(`Telecaller not found with ID: ${id}`);
    }

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.phone !== undefined) user.phone = updates.phone.trim();
    if (updates.email !== undefined) user.email = updates.email.trim();
    if (updates.brandAccess !== undefined) user.brandAccess = updates.brandAccess;
    if (updates.dailyTarget !== undefined) user.dailyTarget = Number(updates.dailyTarget) || 50;
    if (updates.isActive !== undefined) user.isActive = Boolean(updates.isActive);

    if (updates.password && updates.password.trim()) {
      const salt = bcrypt.genSaltSync(10);
      user.passwordHash = bcrypt.hashSync(updates.password.trim(), salt);
    }

    user.updatedAt = new Date().toISOString();
    this.persistToDisk();

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public async deleteTelecaller(id: string, adminUser?: User): Promise<{ success: boolean; unassignedLeadsCount: number }> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(adminUser);
    const idx = this.users.findIndex((u) => u.id === id && u.organizationId === orgId);
    if (idx === -1) {
      return { success: false, unassignedLeadsCount: 0 };
    }

    this.users.splice(idx, 1);

    let unassignedCount = 0;
    this.leads.forEach((l) => {
      if (l.organizationId === orgId && l.assignedTo === id) {
        l.assignedTo = null;
        l.assignedTelecallerName = undefined;
        unassignedCount++;
      }
    });

    this.persistToDisk();
    return { success: true, unassignedLeadsCount: unassignedCount };
  }

  public async resetTelecallerPassword(
    id: string,
    adminUser?: User
  ): Promise<{ user: User; temporaryPassword: string }> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(adminUser);
    const user = this.users.find((u) => u.id === id && u.organizationId === orgId);
    if (!user) {
      throw new Error(`Telecaller not found with ID: ${id}`);
    }

    if (user.role !== 'TELECALLER') {
      throw new Error('Forbidden: Cannot reset password for non-telecaller account.');
    }

    const plainPassword = this.generateTemporaryPassword();
    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(plainPassword, salt);
    user.updatedAt = new Date().toISOString();

    const adminName = adminUser?.name || 'Master Admin';
    const adminId = adminUser?.id || 'usr_admin_001';
    const now = new Date().toISOString();

    this.leadHistories.unshift({
      id: `lh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      leadId: 'SYSTEM_AUDIT',
      userId: adminId,
      userName: adminName,
      action: 'REASSIGNED',
      description: `Admin ${adminName} reset password for telecaller ${user.loginId}.`,
      timestamp: now,
    });

    this.persistToDisk();

    const { passwordHash: _, ...safeUser } = user;
    return {
      user: safeUser,
      temporaryPassword: plainPassword,
    };
  }

  public async updateUserPassword(userId: string, newHash: string, userContext?: User): Promise<void> {
    this.ensureLoaded();
    const orgId = userContext ? this.getOrganizationId(userContext) : undefined;
    const user = this.users.find((u) => u.id === userId && (!orgId || u.organizationId === orgId));
    if (!user) throw new Error('User not found.');
    user.passwordHash = newHash;
    user.updatedAt = new Date().toISOString();
    this.persistToDisk();
  }

  // --- LEADS METHODS ---
  public async getAllLeads(
    filter?: { brand?: 'ALL' | BusinessBrand; assignedTo?: string; status?: LeadStatus; search?: string },
    userContext?: User
  ): Promise<Lead[]> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(userContext);
    let result = this.leads.filter((l) => l.organizationId === orgId);

    if (userContext && userContext.role === 'TELECALLER') {
      result = result.filter((l) => l.assignedTo === userContext.id || l.assignedTo === userContext.loginId);
      if (userContext.brandAccess && userContext.brandAccess !== 'BOTH') {
        result = result.filter((l) => l.brand === userContext.brandAccess);
      }
    }

    if (filter) {
      if (filter.brand && filter.brand !== 'ALL') {
        result = result.filter((l) => l.brand === filter.brand);
      }
      if (filter.assignedTo) {
        if (filter.assignedTo === 'UNASSIGNED') {
          result = result.filter((l) => !l.assignedTo);
        } else {
          result = result.filter((l) => l.assignedTo === filter.assignedTo);
        }
      }
      if (filter.status) {
        result = result.filter((l) => l.status === filter.status);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        result = result.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.phone.includes(q) ||
            (l.email && l.email.toLowerCase().includes(q)) ||
            (l.city && l.city.toLowerCase().includes(q)) ||
            (l.courseInterest && l.courseInterest.toLowerCase().includes(q)) ||
            (l.propertyType && l.propertyType.toLowerCase().includes(q))
        );
      }
    }

    // Attach activeFollowUp
    return result.map((lead) => {
      const activeFu = this.followUps
        .filter((f) => f.organizationId === orgId && f.leadId === lead.id && !f.isCompleted && f.status !== 'COMPLETED' && f.status !== 'CANCELLED')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

      return {
        ...lead,
        activeFollowUp: activeFu,
      };
    });
  }

  public async getLeadById(id: string, userContext?: User): Promise<Lead | undefined> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(userContext);
    const lead = this.leads.find((l) => l.id === id && l.organizationId === orgId);
    if (!lead) return undefined;

    const callLogs = this.callActivities.filter((c) => c.leadId === id && c.organizationId === orgId);
    const followUps = this.followUps.filter((f) => f.leadId === id && f.organizationId === orgId);
    const history = this.leadHistories.filter((h) => h.leadId === id && (!h.organizationId || h.organizationId === orgId));

    const activeFollowUp = followUps
      .filter((f) => !f.isCompleted && f.status !== 'COMPLETED' && f.status !== 'CANCELLED')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

    return {
      ...lead,
      callLogs,
      followUps,
      history,
      activeFollowUp,
    };
  }

  public async importLeads(
    rows: ParsedLeadRow[],
    assignedToTelecallerId?: string | null,
    adminUser?: User,
    defaultBrand?: BusinessBrand
  ): Promise<{ importedCount: number; failedCount: number; leads: Lead[]; message: string }> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(adminUser);
    const adminName = adminUser?.name || 'Master Admin HQ';
    const adminId = adminUser?.id || 'usr_admin_001';

    let assignedTc: User | undefined;
    if (assignedToTelecallerId) {
      assignedTc = this.users.find((u) => u.id === assignedToTelecallerId && u.organizationId === orgId);
      if (!assignedTc) {
        throw new Error('Assigned telecaller does not exist in your organization.');
      }
    }

    let importedCount = 0;
    let failedCount = 0;
    const newLeads: Lead[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.name || !r.phone) {
        failedCount++;
        continue;
      }

      const brand = r.brand || defaultBrand || 'APNI_VIDYA';
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newLead: Lead = {
        id: leadId,
        organizationId: orgId,
        name: r.name.trim(),
        phone: r.phone.trim(),
        email: r.email?.trim(),
        city: r.city?.trim() || 'New Delhi',
        source: r.source?.trim() || 'Batch Excel Import',
        brand,
        courseInterest: r.courseInterest || r.productInterest,
        qualification: r.qualification,
        preferredBatch: r.preferredBatch,
        propertyType: r.propertyType,
        budget: r.budget,
        preferredLocation: r.preferredLocation,
        siteVisitDate: r.siteVisitDate,
        productInterest: r.productInterest || r.courseInterest || r.propertyType,
        assignedTo: assignedTc ? assignedTc.id : null,
        assignedTelecallerName: assignedTc ? assignedTc.name : undefined,
        status: 'NEW',
        notes: r.notes || 'Imported via bulk lead upload.',
        totalCallsCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      this.leads.unshift(newLead);
      newLeads.push(newLead);
      importedCount++;

      this.leadHistories.unshift({
        id: `lh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        organizationId: orgId,
        leadId,
        userId: adminId,
        userName: adminName,
        action: 'CREATED',
        description: `Lead imported by ${adminName}${assignedTc ? ` and assigned to ${assignedTc.name}` : ''}.`,
        timestamp: now,
      });
    }

    this.persistToDisk();
    return {
      importedCount,
      failedCount,
      leads: newLeads,
      message: `Successfully imported ${importedCount} leads${failedCount > 0 ? ` (${failedCount} skipped due to missing name/phone)` : ''}.`,
    };
  }

  public async assignLeads(
    leadIds: string[],
    telecallerId: string | null,
    adminUser: User
  ): Promise<{ assignedCount: number; leads: Lead[]; message: string }> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(adminUser);
    const adminName = adminUser?.name || 'Master Admin HQ';
    const adminId = adminUser?.id || 'usr_admin_001';

    let targetTc: User | undefined;
    if (telecallerId) {
      targetTc = this.users.find((u) => u.id === telecallerId && u.organizationId === orgId);
      if (!targetTc) {
        throw new Error('Forbidden: Target telecaller does not belong to your organization.');
      }
    }

    let count = 0;
    const updatedLeads: Lead[] = [];
    const now = new Date().toISOString();

    for (const id of leadIds) {
      const lead = this.leads.find((l) => l.id === id && l.organizationId === orgId);
      if (!lead) continue;

      lead.assignedTo = targetTc ? targetTc.id : null;
      lead.assignedTelecallerName = targetTc ? targetTc.name : undefined;
      lead.updatedAt = now;

      this.leadHistories.unshift({
        id: `lh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        organizationId: orgId,
        leadId: lead.id,
        userId: adminId,
        userName: adminName,
        action: targetTc ? 'ASSIGNED' : 'REASSIGNED',
        description: targetTc
          ? `Lead assigned to ${targetTc.name} by ${adminName}.`
          : `Lead unassigned by ${adminName}.`,
        timestamp: now,
      });

      updatedLeads.push(lead);
      count++;
    }

    this.persistToDisk();
    return {
      assignedCount: count,
      leads: updatedLeads,
      message: `Assigned ${count} leads${targetTc ? ` to ${targetTc.name}` : ' (unassigned)'}.`,
    };
  }

  public async autoDistributeLeads(
    brandFilter?: 'ALL' | BusinessBrand,
    adminUser?: User
  ): Promise<{ vidyaAssigned: number; estateAssigned: number; totalAssigned: number; message: string }> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(adminUser);
    const adminName = adminUser?.name || 'Master Admin HQ';
    const adminId = adminUser?.id || 'usr_admin_001';

    const vidyaTelecallers = this.users.filter(
      (u) => u.organizationId === orgId && u.role === 'TELECALLER' && u.isActive && (u.brandAccess === 'APNI_VIDYA' || u.brandAccess === 'BOTH')
    );
    const estateTelecallers = this.users.filter(
      (u) => u.organizationId === orgId && u.role === 'TELECALLER' && u.isActive && (u.brandAccess === 'APNI_ESTATE' || u.brandAccess === 'BOTH')
    );

    let vidyaAssigned = 0;
    let estateAssigned = 0;
    const now = new Date().toISOString();

    const unassignedLeads = this.leads.filter((l) => l.organizationId === orgId && !l.assignedTo);

    for (const lead of unassignedLeads) {
      if (brandFilter && brandFilter !== 'ALL' && lead.brand !== brandFilter) {
        continue;
      }

      let selectedTc: User | undefined;
      if (lead.brand === 'APNI_VIDYA' && vidyaTelecallers.length > 0) {
        selectedTc = vidyaTelecallers[vidyaAssigned % vidyaTelecallers.length];
        vidyaAssigned++;
      } else if (lead.brand === 'APNI_ESTATE' && estateTelecallers.length > 0) {
        selectedTc = estateTelecallers[estateAssigned % estateTelecallers.length];
        estateAssigned++;
      }

      if (selectedTc) {
        lead.assignedTo = selectedTc.id;
        lead.assignedTelecallerName = selectedTc.name;
        lead.updatedAt = now;

        this.leadHistories.unshift({
          id: `lh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          organizationId: orgId,
          leadId: lead.id,
          userId: adminId,
          userName: adminName,
          action: 'ASSIGNED',
          description: `Auto-distributed to ${selectedTc.name} by ${adminName}.`,
          timestamp: now,
        });
      }
    }

    this.persistToDisk();
    const total = vidyaAssigned + estateAssigned;
    return {
      vidyaAssigned,
      estateAssigned,
      totalAssigned: total,
      message: `Auto-distributed ${total} leads (${vidyaAssigned} EdTech, ${estateAssigned} Real Estate).`,
    };
  }

  // --- CALL & ACTIVITY METHODS ---
  public async recordCallActivity(
    data: {
      leadId: string;
      status: LeadStatus;
      note?: string;
      durationSeconds?: number;
      callType?: 'CALL' | 'WHATSAPP';
      customFields?: Partial<Lead>;
      followUp?: {
        dueDate: string;
        dueTime?: string;
        note?: string;
      };
    },
    userContext?: User
  ): Promise<{ message: string; lead: Lead; callActivity: CallActivity; followUp?: FollowUp }> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(userContext);
    const lead = this.leads.find((l) => l.id === data.leadId && l.organizationId === orgId);
    if (!lead) throw new Error(`Lead not found with ID: ${data.leadId}`);

    const tcId = userContext?.id || lead.assignedTo || 'usr_tc_vidya_1';
    const tcUser = this.users.find((u) => u.id === tcId && u.organizationId === orgId);
    const tcName = tcUser?.name || userContext?.name || 'Telecaller';

    const now = new Date().toISOString();

    const activity: CallActivity = {
      id: `ca_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      leadId: lead.id,
      telecallerId: tcId,
      telecallerName: tcName,
      status: data.status,
      note: data.note,
      calledAt: now,
      durationSeconds: data.durationSeconds || 0,
      callType: data.callType || 'CALL',
    };

    this.callActivities.unshift(activity);

    // Update lead
    lead.status = data.status;
    lead.lastCallAt = now;
    lead.lastCallTimestamp = now;
    lead.totalCallsCount = (lead.totalCallsCount || 0) + 1;
    lead.updatedAt = now;

    if (data.note) {
      lead.notes = lead.notes ? `${lead.notes}\n[${new Date().toLocaleDateString()}] ${data.note}` : data.note;
    }

    if (data.customFields) {
      Object.assign(lead, data.customFields);
    }

    // Schedule Follow-Up if requested
    let createdFollowUp: FollowUp | undefined;
    if (data.followUp && data.followUp.dueDate) {
      createdFollowUp = {
        id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        organizationId: orgId,
        leadId: lead.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        brand: lead.brand,
        telecallerId: tcId,
        telecallerName: tcName,
        dateTime: `${data.followUp.dueDate}T${data.followUp.dueTime || '16:30:00'}`,
        dueDate: data.followUp.dueDate,
        dueTime: data.followUp.dueTime || '04:30 PM',
        note: data.followUp.note,
        status: 'PENDING',
        isCompleted: false,
        createdAt: now,
      };

      this.followUps.unshift(createdFollowUp);
      lead.nextFollowUpAt = createdFollowUp.dateTime;
    }

    // History Log
    this.leadHistories.unshift({
      id: `lh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      leadId: lead.id,
      userId: tcId,
      userName: tcName,
      action: 'CALL_MADE',
      description: `${data.callType === 'WHATSAPP' ? 'WhatsApp outreach' : 'Phone call'} logged (${data.durationSeconds || 0}s). Status changed to ${data.status}.${data.note ? ` Note: "${data.note}"` : ''}`,
      timestamp: now,
    });

    this.persistToDisk();
    return {
      message: 'Call activity successfully recorded.',
      lead,
      callActivity: activity,
      followUp: createdFollowUp,
    };
  }

  public async scheduleFollowUp(
    data: {
      leadId: string;
      dueDate: string;
      dueTime?: string;
      note?: string;
    },
    userContext?: User
  ): Promise<{ message: string; followUp: FollowUp }> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(userContext);
    const lead = this.leads.find((l) => l.id === data.leadId && l.organizationId === orgId);
    if (!lead) throw new Error(`Lead not found with ID: ${data.leadId}`);

    const tcId = userContext?.id || lead.assignedTo || 'usr_tc_vidya_1';
    const tcUser = this.users.find((u) => u.id === tcId && u.organizationId === orgId);
    const tcName = tcUser?.name || userContext?.name || 'Telecaller';
    const now = new Date().toISOString();

    const fu: FollowUp = {
      id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      brand: lead.brand,
      telecallerId: tcId,
      telecallerName: tcName,
      dateTime: `${data.dueDate}T${data.dueTime || '16:30:00'}`,
      dueDate: data.dueDate,
      dueTime: data.dueTime || '04:30 PM',
      note: data.note,
      status: 'PENDING',
      isCompleted: false,
      createdAt: now,
    };

    this.followUps.unshift(fu);
    lead.nextFollowUpAt = fu.dateTime;
    lead.updatedAt = now;

    this.leadHistories.unshift({
      id: `lh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      leadId: lead.id,
      userId: tcId,
      userName: tcName,
      action: 'FOLLOW_UP_CREATED',
      description: `Follow-up scheduled for ${data.dueDate} at ${fu.dueTime}.${data.note ? ` Note: "${data.note}"` : ''}`,
      timestamp: now,
    });

    this.persistToDisk();
    return { message: 'Follow-up scheduled successfully', followUp: fu };
  }

  public async completeFollowUp(
    followUpId: string,
    user: User,
    completionNote?: string
  ): Promise<{ message: string; followUp: FollowUp; lead: Lead }> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(user);
    const fu = this.followUps.find((f) => f.id === followUpId && f.organizationId === orgId);
    if (!fu) throw new Error(`Follow-up not found with ID: ${followUpId}`);

    const lead = this.leads.find((l) => l.id === fu.leadId && l.organizationId === orgId);
    if (!lead) throw new Error(`Lead not found for follow-up ID: ${followUpId}`);

    const now = new Date().toISOString();
    fu.status = 'COMPLETED';
    fu.isCompleted = true;
    fu.completedAt = now;
    if (completionNote) {
      fu.note = fu.note ? `${fu.note} | Completed: ${completionNote}` : completionNote;
    }

    lead.nextFollowUpAt = undefined;
    lead.updatedAt = now;

    this.leadHistories.unshift({
      id: `lh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      leadId: lead.id,
      userId: user.id,
      userName: user.name,
      action: 'FOLLOW_UP_COMPLETED',
      description: `Follow-up completed by ${user.name}.${completionNote ? ` Note: "${completionNote}"` : ''}`,
      timestamp: now,
    });

    this.persistToDisk();
    return { message: 'Follow-up marked as completed', followUp: fu, lead };
  }

  public async getFollowUps(
    telecallerId?: string,
    brandFilter?: 'ALL' | BusinessBrand,
    userContext?: User
  ): Promise<{ overdue: FollowUp[]; today: FollowUp[]; upcoming: FollowUp[]; completed: FollowUp[] }> {
    this.ensureLoaded();
    this.recalculateFollowUpStatuses();
    const orgId = this.getOrganizationId(userContext);

    let list = this.followUps.filter((f) => f.organizationId === orgId);

    if (userContext && userContext.role === 'TELECALLER') {
      list = list.filter((f) => f.telecallerId === userContext.id);
      if (userContext.brandAccess && userContext.brandAccess !== 'BOTH') {
        list = list.filter((f) => f.brand === userContext.brandAccess);
      }
    } else if (telecallerId && telecallerId !== 'ALL') {
      list = list.filter((f) => f.telecallerId === telecallerId);
    }

    if (brandFilter && brandFilter !== 'ALL') {
      list = list.filter((f) => f.brand === brandFilter);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const completed = list.filter((f) => f.status === 'COMPLETED' || f.isCompleted);
    const pending = list.filter((f) => f.status !== 'COMPLETED' && !f.isCompleted);

    const overdue = pending.filter((f) => f.dueDate < todayStr);
    const today = pending.filter((f) => f.dueDate === todayStr);
    const upcoming = pending.filter((f) => f.dueDate > todayStr);

    return { overdue, today, upcoming, completed };
  }

  public async getLeadHistory(leadId: string, userContext?: User): Promise<{ lead: Lead; history: LeadHistory[] }> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(userContext);
    const lead = this.leads.find((l) => l.id === leadId && l.organizationId === orgId);
    if (!lead) throw new Error(`Lead not found with ID: ${leadId}`);
    const history = this.leadHistories.filter((h) => h.leadId === leadId && (!h.organizationId || h.organizationId === orgId));
    return { lead, history };
  }

  public recalculateFollowUpStatuses(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.followUps.forEach((fu) => {
      if (fu.status === 'COMPLETED' || fu.isCompleted) return;
      if (fu.dueDate < todayStr) {
        fu.status = 'OVERDUE';
      } else {
        fu.status = 'PENDING';
      }
    });
  }

  // --- PERFORMANCE METRICS ---
  public async getAdminMetrics(brandFilter?: 'ALL' | BusinessBrand, userContext?: User): Promise<AdminMetrics> {
    this.ensureLoaded();
    this.recalculateFollowUpStatuses();
    const orgId = this.getOrganizationId(userContext);

    let filteredLeads = this.leads.filter((l) => l.organizationId === orgId);
    let filteredCalls = this.callActivities.filter((c) => c.organizationId === orgId);
    let filteredFollowUps = this.followUps.filter((f) => f.organizationId === orgId);

    if (brandFilter && brandFilter !== 'ALL') {
      filteredLeads = filteredLeads.filter((l) => l.brand === brandFilter);
      filteredCalls = filteredCalls.filter((c) => {
        const lead = this.leads.find((l) => l.id === c.leadId && l.organizationId === orgId);
        return lead?.brand === brandFilter;
      });
      filteredFollowUps = filteredFollowUps.filter((f) => f.brand === brandFilter);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const vidyaLeads = filteredLeads.filter((l) => l.brand === 'APNI_VIDYA');
    const estateLeads = filteredLeads.filter((l) => l.brand === 'APNI_ESTATE');

    const totalLeads = filteredLeads.length;
    const assignedLeads = filteredLeads.filter((l) => l.assignedTo).length;
    const unassignedLeads = totalLeads - assignedLeads;

    const callsMade = filteredCalls.length;
    const callsToday = filteredCalls.filter((c) => c.calledAt && c.calledAt.startsWith(todayStr)).length;

    const activeTelecallers = this.users.filter((u) => u.organizationId === orgId && u.role === 'TELECALLER' && u.isActive).length;
    const todayTarget = this.users
      .filter((u) => u.organizationId === orgId && u.role === 'TELECALLER' && u.isActive)
      .reduce((sum, u) => sum + (u.dailyTarget || 50), 0);

    const targetCompletion = todayTarget > 0 ? Math.min(100, Math.round((callsToday / todayTarget) * 100)) : 0;

    const vidyaConverted = vidyaLeads.filter((l) => l.status === 'ENROLLED' || l.status === 'DEMO').length;
    const vidyaConversionRate = vidyaLeads.length > 0 ? Math.round((vidyaConverted / vidyaLeads.length) * 100) : 0;

    const estateConverted = estateLeads.filter((l) => l.status === 'CLOSED' || l.status === 'SITE_VISIT_SCHEDULED').length;
    const estateConversionRate = estateLeads.length > 0 ? Math.round((estateConverted / estateLeads.length) * 100) : 0;

    const pendingFollowUps = filteredFollowUps.filter((f) => !f.isCompleted && f.status !== 'COMPLETED');

    return {
      totalLeads,
      vidyaLeads: vidyaLeads.length,
      estateLeads: estateLeads.length,
      assignedLeads,
      unassignedLeads,
      callsMade,
      callsToday,
      todayTarget,
      targetCompletion,
      activeTelecallers,
      vidyaMetrics: {
        total: vidyaLeads.length,
        interested: vidyaLeads.filter((l) => l.status === 'INTERESTED').length,
        callbacks: vidyaLeads.filter((l) => l.status === 'CALLBACK').length,
        demos: vidyaLeads.filter((l) => l.status === 'DEMO').length,
        enrolled: vidyaLeads.filter((l) => l.status === 'ENROLLED').length,
        notInterested: vidyaLeads.filter((l) => l.status === 'NOT_INTERESTED').length,
        conversionRate: vidyaConversionRate,
      },
      estateMetrics: {
        total: estateLeads.length,
        interested: estateLeads.filter((l) => l.status === 'INTERESTED').length,
        siteVisits: estateLeads.filter((l) => l.status === 'SITE_VISIT_SCHEDULED').length,
        negotiating: estateLeads.filter((l) => l.status === 'NEGOTIATING').length,
        closed: estateLeads.filter((l) => l.status === 'CLOSED').length,
        notInterested: estateLeads.filter((l) => l.status === 'NOT_INTERESTED').length,
        conversionRate: estateConversionRate,
      },
      interested: filteredLeads.filter((l) => l.status === 'INTERESTED').length,
      callbacks: filteredLeads.filter((l) => l.status === 'CALLBACK').length,
      followUps: pendingFollowUps.length,
      overdueFollowUps: pendingFollowUps.filter((f) => f.dueDate < todayStr).length,
      todayFollowUps: pendingFollowUps.filter((f) => f.dueDate === todayStr).length,
      upcomingFollowUps: pendingFollowUps.filter((f) => f.dueDate > todayStr).length,
      demos: filteredLeads.filter((l) => l.status === 'DEMO').length,
      enrolled: filteredLeads.filter((l) => l.status === 'ENROLLED').length,
      siteVisits: filteredLeads.filter((l) => l.status === 'SITE_VISIT_SCHEDULED').length,
      negotiating: filteredLeads.filter((l) => l.status === 'NEGOTIATING').length,
      closed: filteredLeads.filter((l) => l.status === 'CLOSED').length,
      notInterested: filteredLeads.filter((l) => l.status === 'NOT_INTERESTED').length,
      noAnswer: filteredLeads.filter((l) => l.status === 'NO_ANSWER' || l.status === 'RINGING').length,
      busy: filteredLeads.filter((l) => l.status === 'BUSY').length,
    };
  }

  public async getTelecallerMetrics(telecallerId: string, userContext?: User): Promise<TelecallerMetrics> {
    this.ensureLoaded();
    const orgId = this.getOrganizationId(userContext);
    const tc = this.users.find((u) => u.organizationId === orgId && (u.id === telecallerId || u.loginId === telecallerId));
    const assignedLeadsList = this.leads.filter((l) => l.organizationId === orgId && (l.assignedTo === telecallerId || l.assignedTo === tc?.id));
    const calls = this.callActivities.filter((c) => c.organizationId === orgId && (c.telecallerId === telecallerId || c.telecallerId === tc?.id));

    const todayStr = new Date().toISOString().split('T')[0];
    const callsMadeToday = calls.filter((c) => c.calledAt && c.calledAt.startsWith(todayStr)).length;
    const dailyTarget = tc?.dailyTarget || 50;
    const targetProgress = dailyTarget > 0 ? Math.min(100, Math.round((callsMadeToday / dailyTarget) * 100)) : 0;

    return {
      telecallerId: tc?.id || telecallerId,
      telecallerName: tc?.name || 'Telecaller',
      loginId: tc?.loginId || telecallerId,
      brandAccess: tc?.brandAccess || 'APNI_VIDYA',
      dailyTarget,
      assignedLeads: assignedLeadsList.length,
      callsMade: callsMadeToday,
      targetProgress,
      interested: assignedLeadsList.filter((l) => l.status === 'INTERESTED').length,
      callbacks: assignedLeadsList.filter((l) => l.status === 'CALLBACK').length,
      notInterested: assignedLeadsList.filter((l) => l.status === 'NOT_INTERESTED').length,
      followUps: assignedLeadsList.filter((l) => l.status === 'FOLLOW_UP').length,
      noAnswer: assignedLeadsList.filter((l) => l.status === 'NO_ANSWER' || l.status === 'RINGING').length,
      busy: assignedLeadsList.filter((l) => l.status === 'BUSY').length,
      demos: assignedLeadsList.filter((l) => l.status === 'DEMO').length,
      enrolled: assignedLeadsList.filter((l) => l.status === 'ENROLLED').length,
      siteVisits: assignedLeadsList.filter((l) => l.status === 'SITE_VISIT_SCHEDULED').length,
      negotiating: assignedLeadsList.filter((l) => l.status === 'NEGOTIATING').length,
      closed: assignedLeadsList.filter((l) => l.status === 'CLOSED').length,
      bookings: assignedLeadsList.filter((l) => l.status === 'CLOSED').length,
      sales: assignedLeadsList.filter((l) => l.status === 'CLOSED' || l.status === 'ENROLLED').length,
    };
  }

  public async getAllTelecallersPerformance(brandFilter?: 'ALL' | BusinessBrand, userContext?: User): Promise<TelecallerMetrics[]> {
    const telecallers = await this.getTelecallers(brandFilter, userContext);
    return Promise.all(telecallers.map((tc) => this.getTelecallerMetrics(tc.id, userContext)));
  }
}

export const devFallbackRepository = process.env.NODE_ENV !== 'production' ? new DevFallbackRepository() : null;
