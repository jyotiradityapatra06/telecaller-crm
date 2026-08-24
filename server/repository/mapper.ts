import { User, Lead, CallActivity, FollowUp, LeadHistory } from '../../src/types';

export function mapUserFromRow(row: any): User & { passwordHash: string } {
  return {
    id: row.id,
    name: row.name,
    loginId: row.login_id,
    role: row.role,
    brandAccess: row.brand_access || 'BOTH',
    dailyTarget: Number(row.daily_target) || 50,
    phone: row.phone || '',
    email: row.email || '',
    isActive: Boolean(row.is_active),
    passwordHash: row.password_hash || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapUserToRow(user: User & { passwordHash?: string }, orgId: string): any {
  return {
    id: user.id,
    organization_id: orgId,
    name: user.name,
    login_id: user.loginId,
    role: user.role,
    brand_access: user.brandAccess,
    daily_target: user.dailyTarget,
    phone: user.phone,
    email: user.email,
    password_hash: user.passwordHash,
    is_active: user.isActive,
    updated_at: new Date().toISOString(),
  };
}

export function mapLeadFromRow(row: any, userMap?: Map<string, User>): Lead {
  const tcName = row.assigned_to && userMap?.get(row.assigned_to)?.name;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    city: row.city || undefined,
    source: row.source || undefined,
    brand: row.brand,
    courseInterest: row.course_interest || undefined,
    qualification: row.qualification || undefined,
    preferredBatch: row.preferred_batch || undefined,
    propertyType: row.property_type || undefined,
    budget: row.budget || undefined,
    preferredLocation: row.preferred_location || undefined,
    siteVisitDate: row.site_visit_date || undefined,
    productInterest: row.product_interest || row.course_interest || row.property_type || undefined,
    assignedTo: row.assigned_to || null,
    assignedTelecallerName: tcName || undefined,
    status: row.status,
    notes: row.notes || undefined,
    lastCallAt: row.last_call_at || undefined,
    lastCallTimestamp: row.last_call_at || undefined,
    nextFollowUpAt: row.next_follow_up_at || undefined,
    totalCallsCount: Number(row.total_calls_count) || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapLeadToRow(lead: Lead, orgId: string): any {
  return {
    id: lead.id,
    organization_id: orgId,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || null,
    city: lead.city || null,
    source: lead.source || null,
    brand: lead.brand,
    course_interest: lead.courseInterest || null,
    qualification: lead.qualification || null,
    preferred_batch: lead.preferredBatch || null,
    property_type: lead.propertyType || null,
    budget: lead.budget || null,
    preferred_location: lead.preferredLocation || null,
    site_visit_date: lead.siteVisitDate || null,
    product_interest: lead.productInterest || lead.courseInterest || lead.propertyType || null,
    assigned_to: lead.assignedTo || null,
    status: lead.status,
    notes: lead.notes || null,
    last_call_at: lead.lastCallAt || lead.lastCallTimestamp || null,
    total_calls_count: lead.totalCallsCount || 0,
    next_follow_up_at: lead.nextFollowUpAt || null,
    updated_at: new Date().toISOString(),
  };
}

export function mapCallActivityFromRow(row: any, userMap?: Map<string, User>): CallActivity {
  const tcName = row.telecaller_id && userMap?.get(row.telecaller_id)?.name;

  return {
    id: row.id,
    leadId: row.lead_id,
    telecallerId: row.telecaller_id,
    telecallerName: tcName || 'Unknown',
    status: row.status,
    note: row.note || undefined,
    calledAt: row.called_at || row.created_at || new Date().toISOString(),
    durationSeconds: Number(row.duration_seconds) || 0,
    callType: row.call_type || 'CALL',
  };
}

export function mapCallActivityToRow(activity: CallActivity, orgId: string): any {
  return {
    id: activity.id,
    organization_id: orgId,
    lead_id: activity.leadId,
    telecaller_id: activity.telecallerId,
    status: activity.status,
    note: activity.note || null,
    called_at: activity.calledAt,
    duration_seconds: activity.durationSeconds || 0,
    call_type: activity.callType,
  };
}

export function mapFollowUpFromRow(row: any, leadMap?: Map<string, Lead>, userMap?: Map<string, User>): FollowUp {
  const lead = row.lead_id && leadMap?.get(row.lead_id);
  const tcName = row.telecaller_id && userMap?.get(row.telecaller_id)?.name;

  return {
    id: row.id,
    leadId: row.lead_id,
    leadName: lead?.name || row.lead_name || 'Unknown Lead',
    leadPhone: lead?.phone || row.lead_phone || '',
    brand: lead?.brand || row.brand || 'APNI_VIDYA',
    telecallerId: row.telecaller_id,
    telecallerName: tcName || 'Unknown',
    dateTime: row.scheduled_at || row.legacy_datetime || `${row.due_date}T${row.due_time || '16:30:00'}`,
    dueDate: row.due_date,
    dueTime: row.due_time || '04:30 PM',
    note: row.note || undefined,
    status: row.status,
    completedAt: row.completed_at || undefined,
    isCompleted: row.status === 'COMPLETED',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapFollowUpToRow(fu: FollowUp, orgId: string): any {
  return {
    id: fu.id,
    organization_id: orgId,
    lead_id: fu.leadId,
    telecaller_id: fu.telecallerId,
    scheduled_at: fu.dateTime || `${fu.dueDate}T${fu.dueTime}`,
    due_date: fu.dueDate,
    due_time: fu.dueTime,
    legacy_datetime: fu.dateTime,
    note: fu.note || null,
    status: fu.status,
    completed_at: fu.completedAt || null,
  };
}

export function mapLeadHistoryFromRow(row: any, userMap?: Map<string, User>): LeadHistory {
  const uName = row.user_id && userMap?.get(row.user_id)?.name;

  return {
    id: row.id,
    leadId: row.lead_id,
    userId: row.user_id || 'usr_admin_001',
    userName: uName || 'Master Admin HQ',
    action: row.action,
    description: row.description,
    timestamp: row.timestamp || row.created_at || new Date().toISOString(),
  };
}

export function mapLeadHistoryToRow(history: LeadHistory, orgId: string): any {
  return {
    id: history.id,
    organization_id: orgId,
    lead_id: history.leadId,
    user_id: history.userId,
    action: history.action,
    description: history.description,
    timestamp: history.timestamp,
  };
}
