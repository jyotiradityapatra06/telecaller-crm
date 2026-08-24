import { dbRepository } from './repository/dbRepository';

// Database abstraction delegating all operations to Supabase PostgreSQL repository
class DatabaseAdapter {
  public getOrganizationId() {
    return dbRepository.getOrganizationId();
  }

  public loadFromDisk(): void {
    console.log('📦 Database engine: Supabase PostgreSQL (production persistence active).');
  }

  public persistToDisk(): void {
    // No-op in production Supabase mode
  }

  public seedInitialData(): void {
    console.log('ℹ️ Database seeding managed via Supabase migration/seed files.');
  }

  public recalculateFollowUpStatuses() {
    return dbRepository.recalculateFollowUpStatuses();
  }

  public getAllUsers() {
    return dbRepository.getAllUsers();
  }

  public getTelecallers(brandFilter?: any) {
    return dbRepository.getTelecallers(brandFilter);
  }

  public findUserById(id: string) {
    return dbRepository.findUserById(id);
  }

  public findUserByLoginId(loginId: string) {
    return dbRepository.findUserByLoginId(loginId);
  }

  public createTelecaller(data: any) {
    return dbRepository.createTelecaller(data);
  }

  public updateTelecaller(id: string, updates: any) {
    return dbRepository.updateTelecaller(id, updates);
  }

  public deleteTelecaller(id: string) {
    return dbRepository.deleteTelecaller(id);
  }

  public updateUserPassword(userId: string, newHash: string) {
    return dbRepository.updateUserPassword(userId, newHash);
  }

  public getAllLeads(filter?: any, userContext?: any) {
    return dbRepository.getAllLeads(filter, userContext);
  }

  public getLeadById(id: string, userContext?: any) {
    return dbRepository.getLeadById(id, userContext);
  }

  public importLeads(rows: any[], assignedToTelecallerId?: string | null, adminUser?: any, defaultBrand?: any) {
    return dbRepository.importLeads(rows, assignedToTelecallerId, adminUser, defaultBrand);
  }

  public assignLeads(leadIds: string[], telecallerId: string | null, adminUser: any) {
    return dbRepository.assignLeads(leadIds, telecallerId, adminUser);
  }

  public autoDistributeLeads(brandFilter?: any, adminUser?: any) {
    return dbRepository.autoDistributeLeads(brandFilter, adminUser);
  }

  public recordCallActivity(data: any, userContext?: any) {
    return dbRepository.recordCallActivity(data, userContext);
  }

  public scheduleFollowUp(data: any, userContext?: any) {
    return dbRepository.scheduleFollowUp(data, userContext);
  }

  public completeFollowUp(followUpId: string, user: any, completionNote?: string) {
    return dbRepository.completeFollowUp(followUpId, user, completionNote);
  }

  public getFollowUps(telecallerId?: string, brandFilter?: any, userContext?: any) {
    return dbRepository.getFollowUps(telecallerId, brandFilter, userContext);
  }

  public getLeadHistory(leadId: string, userContext?: any) {
    return dbRepository.getLeadHistory(leadId, userContext);
  }

  public getAdminMetrics(brandFilter?: any, userContext?: any) {
    return dbRepository.getAdminMetrics(brandFilter, userContext);
  }

  public getTelecallerMetrics(telecallerId: string, userContext?: any) {
    return dbRepository.getTelecallerMetrics(telecallerId, userContext);
  }

  public getAllTelecallersPerformance(brandFilter?: any) {
    return dbRepository.getAllTelecallersPerformance(brandFilter);
  }
}

export const db = new DatabaseAdapter();
