export type UserRole = 'ADMIN' | 'TELECALLER';
export type AppRole = 'admin' | 'telecaller';

export type BusinessBrand = 'APNI_VIDYA' | 'APNI_ESTATE';
export type BrandAccess = 'APNI_VIDYA' | 'APNI_ESTATE' | 'BOTH';

export type LeadStatus =
  | 'NEW'
  | 'INTERESTED'
  | 'CALLBACK'
  | 'FOLLOW_UP'
  | 'NO_ANSWER'
  | 'RINGING'
  | 'BUSY'
  | 'NOT_INTERESTED'
  // Apni Vidya statuses
  | 'DEMO'
  | 'ENROLLED'
  // Apni Estate statuses
  | 'SITE_VISIT_SCHEDULED'
  | 'NEGOTIATING'
  | 'CLOSED'
  // Legacy compatibility
  | 'BOOKING'
  | 'SALE';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  loginId: string; // e.g. "admin", "TC_VIDYA_1", "TC_ESTATE_1"
  role: UserRole;
  brandAccess: BrandAccess; // 'APNI_VIDYA' | 'APNI_ESTATE' | 'BOTH'
  dailyTarget: number;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadHistory {
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  action:
    | 'CREATED'
    | 'ASSIGNED'
    | 'REASSIGNED'
    | 'CALL_MADE'
    | 'STATUS_CHANGED'
    | 'NOTE_ADDED'
    | 'FOLLOW_UP_CREATED'
    | 'FOLLOW_UP_COMPLETED'
    | 'DEMO_SCHEDULED'
    | 'SITE_VISIT_SCHEDULED'
    | 'ENROLLED'
    | 'CLOSED_DEAL'
    | 'BOOKING_RECORDED'
    | 'SALE_CLOSED';
  description: string;
  timestamp: string;
}

export interface CallActivity {
  id: string;
  leadId: string;
  telecallerId: string;
  telecallerName: string;
  status: LeadStatus;
  note?: string;
  calledAt: string; // ISO string
  durationSeconds?: number;
  callType: 'CALL' | 'WHATSAPP';
}

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  brand?: BusinessBrand;
  telecallerId: string;
  telecallerName: string;
  dateTime: string; // ISO string or YYYY-MM-DDTHH:mm
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // e.g. "04:30 PM"
  note?: string;
  status: FollowUpStatus;
  completedAt?: string;
  isCompleted?: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  source?: string;
  brand: BusinessBrand; // 'APNI_VIDYA' | 'APNI_ESTATE'

  // Apni Vidya Custom Fields
  courseInterest?: string; // e.g. "Full Stack Web Dev", "Data Science & AI", "Digital Marketing", "UPSC Prep"
  qualification?: string; // e.g. "12th Pass", "Graduate", "Post Graduate", "Working Professional"
  preferredBatch?: string; // e.g. "Morning (8-10 AM)", "Evening (7-9 PM)", "Weekend Intensive"

  // Apni Estate Custom Fields
  propertyType?: string; // e.g. "2 BHK Apartment", "3 BHK Luxury High-rise", "Commercial Plot", "Villa"
  budget?: string; // e.g. "₹45L - ₹65L", "₹80L - ₹1.2 Cr", "₹2 Cr+"
  preferredLocation?: string; // e.g. "Whitefield, Bengaluru", "Sector 62, Noida", "Bandra, Mumbai"
  siteVisitDate?: string; // e.g. "2026-08-26 11:00 AM"

  productInterest?: string; // Fallback / legacy
  assignedTo: string | null; // User id or loginId (null if unassigned)
  assignedTelecallerName?: string;
  status: LeadStatus;
  notes?: string;
  lastCallAt?: string;
  lastCallTimestamp?: string;
  nextFollowUpAt?: string;
  totalCallsCount: number;
  createdAt: string;
  updatedAt: string;

  // Included relations
  history?: LeadHistory[];
  callLogs?: CallActivity[];
  followUps?: FollowUp[];
  activeFollowUp?: FollowUp;
}

export interface TelecallerMetrics {
  telecallerId: string;
  telecallerName: string;
  loginId: string;
  brandAccess: BrandAccess;
  dailyTarget: number;
  assignedLeads: number;
  callsMade: number;
  targetProgress: number; // percentage
  interested: number;
  callbacks: number;
  notInterested: number;
  followUps: number;
  noAnswer: number;
  busy: number;
  demos: number;
  enrolled: number;
  siteVisits: number;
  negotiating: number;
  closed: number;
  bookings?: number;
  sales?: number;
}

export interface AdminMetrics {
  totalLeads: number;
  vidyaLeads: number;
  estateLeads: number;
  assignedLeads: number;
  unassignedLeads: number;
  callsMade: number;
  callsToday: number;
  todayTarget: number;
  targetCompletion: number; // percentage
  activeTelecallers: number;
  
  // Apni Vidya Breakdown
  vidyaMetrics: {
    total: number;
    interested: number;
    callbacks: number;
    demos: number;
    enrolled: number;
    notInterested: number;
    conversionRate: number; // %
  };

  // Apni Estate Breakdown
  estateMetrics: {
    total: number;
    interested: number;
    siteVisits: number;
    negotiating: number;
    closed: number;
    notInterested: number;
    conversionRate: number; // %
  };

  // Aggregate Statuses
  interested: number;
  callbacks: number;
  followUps: number;
  overdueFollowUps: number;
  todayFollowUps: number;
  upcomingFollowUps: number;
  demos: number;
  enrolled: number;
  siteVisits: number;
  negotiating: number;
  closed: number;
  notInterested: number;
  noAnswer: number;
  busy: number;

  telecallerPerformance?: TelecallerMetrics[];
}

export interface AuthUser {
  id: string;
  name: string;
  loginId: string;
  role: UserRole;
  brandAccess: BrandAccess;
  dailyTarget: number;
  phone?: string;
  email?: string;
  isActive: boolean;
  avatar?: string;
}

export type Telecaller = AuthUser;

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ParsedLeadRow {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  source?: string;
  brand: BusinessBrand;
  courseInterest?: string;
  qualification?: string;
  preferredBatch?: string;
  propertyType?: string;
  budget?: string;
  preferredLocation?: string;
  siteVisitDate?: string;
  productInterest?: string;
  notes?: string;
  isValid?: boolean;
  errorReason?: string;
  assignedTo?: string;
}
