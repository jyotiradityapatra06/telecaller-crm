import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
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
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'crm_db.json');

// Relational database with automatic JSON file persistence across server restarts
class Database {
  private users: (User & { passwordHash: string })[] = [];
  private leads: Lead[] = [];
  private callActivities: CallActivity[] = [];
  private followUps: FollowUp[] = [];
  private leadHistories: LeadHistory[] = [];

  constructor() {
    this.loadFromDisk();
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
          this.users = data.users;
          this.leads = data.leads || [];
          this.callActivities = data.callActivities || [];
          this.followUps = data.followUps || [];
          this.leadHistories = data.leadHistories || [];
          this.recalculateFollowUpStatuses();
          console.log(`📦 Loaded persistent database: ${this.leads.length} leads, ${this.users.length} users from disk.`);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load database from disk, seeding initial demo data:', err);
    }

    this.seedInitialData();
  }

  public persistToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const payload = {
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
      console.error('Failed to persist database to disk:', err);
    }
  }

  // --- SEED INITIAL DATA ---
  public seedInitialData() {
    this.users = [];
    this.leads = [];
    this.callActivities = [];
    this.followUps = [];
    this.leadHistories = [];

    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);
    const telecallerPasswordHash = bcrypt.hashSync('password123', salt);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterdayStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const inTwoDaysStr = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Seed Master Users (1 Master Admin, 2 Apni Vidya Callers, 2 Apni Estate Callers, 1 Dual Caller)
    const adminUser: User & { passwordHash: string } = {
      id: 'usr_admin_001',
      name: 'Master Admin HQ',
      loginId: 'admin',
      role: 'ADMIN',
      brandAccess: 'BOTH',
      dailyTarget: 0,
      phone: '+91 99000 00000',
      email: 'admin@apnicrm.com',
      isActive: true,
      passwordHash: adminPasswordHash,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };

    // Apni Vidya Telecallers
    const tcVidya1: User & { passwordHash: string } = {
      id: 'usr_tc_vidya_001',
      name: 'Rahul Sharma',
      loginId: 'TC_VIDYA_1',
      role: 'TELECALLER',
      brandAccess: 'APNI_VIDYA',
      dailyTarget: 50,
      phone: '+91 98765 43210',
      email: 'rahul.vidya@apnicrm.com',
      isActive: true,
      passwordHash: telecallerPasswordHash,
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };

    const tcVidya2: User & { passwordHash: string } = {
      id: 'usr_tc_vidya_002',
      name: 'Priya Patel',
      loginId: 'TC_VIDYA_2',
      role: 'TELECALLER',
      brandAccess: 'APNI_VIDYA',
      dailyTarget: 45,
      phone: '+91 97123 45678',
      email: 'priya.vidya@apnicrm.com',
      isActive: true,
      passwordHash: telecallerPasswordHash,
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };

    // Apni Estate Telecallers
    const tcEstate1: User & { passwordHash: string } = {
      id: 'usr_tc_estate_001',
      name: 'Amit Kumar',
      loginId: 'TC_ESTATE_1',
      role: 'TELECALLER',
      brandAccess: 'APNI_ESTATE',
      dailyTarget: 40,
      phone: '+91 98234 56789',
      email: 'amit.estate@apnicrm.com',
      isActive: true,
      passwordHash: telecallerPasswordHash,
      createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };

    const tcEstate2: User & { passwordHash: string } = {
      id: 'usr_tc_estate_002',
      name: 'Sneha Rao',
      loginId: 'TC_ESTATE_2',
      role: 'TELECALLER',
      brandAccess: 'APNI_ESTATE',
      dailyTarget: 45,
      phone: '+91 96543 21098',
      email: 'sneha.estate@apnicrm.com',
      isActive: true,
      passwordHash: telecallerPasswordHash,
      createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };

    // Dual-Brand Telecaller
    const tcDual1: User & { passwordHash: string } = {
      id: 'usr_tc_dual_001',
      name: 'Vikram Malhotra',
      loginId: 'TC_DUAL_1',
      role: 'TELECALLER',
      brandAccess: 'BOTH',
      dailyTarget: 55,
      phone: '+91 95432 10987',
      email: 'vikram.both@apnicrm.com',
      isActive: true,
      passwordHash: telecallerPasswordHash,
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };

    this.users.push(adminUser, tcVidya1, tcVidya2, tcEstate1, tcEstate2, tcDual1);

    // 2. Realistic Apni Vidya Leads (Education & Student Follow-ups)
    const vidyaLeadsRaw: Array<{
      name: string;
      phone: string;
      email: string;
      city: string;
      source: string;
      courseInterest: string;
      qualification: string;
      preferredBatch: string;
      assignedTo: string | null;
      status: LeadStatus;
      notes: string;
    }> = [
      {
        name: 'Aarav Sharma',
        phone: '+91 98111 22334',
        email: 'aarav.sharma@gmail.com',
        city: 'Delhi NCR',
        source: 'Instagram Ad Campaign',
        courseInterest: 'Full Stack Web Development',
        qualification: 'Graduate (B.Tech CSE)',
        preferredBatch: 'Weekday Morning (8-10 AM)',
        assignedTo: 'usr_tc_vidya_001',
        status: 'INTERESTED',
        notes: 'Highly motivated. Wants placement assistance in MERN stack. Sent brochure.',
      },
      {
        name: 'Ananya Deshmukh',
        phone: '+91 99456 78901',
        email: 'ananya.d@outlook.com',
        city: 'Pune',
        source: 'Website Inquiry Form',
        courseInterest: 'Data Science & Generative AI',
        qualification: 'Working Professional (2 yrs exp)',
        preferredBatch: 'Weekend Intensive (Sat-Sun)',
        assignedTo: 'usr_tc_vidya_001',
        status: 'DEMO',
        notes: 'Attending Live AI/ML Demo Class this Saturday at 11 AM.',
      },
      {
        name: 'Rohan Joshi',
        phone: '+91 97123 45678',
        email: 'rohan.j@techstartup.io',
        city: 'Hyderabad',
        source: 'Google Search Ads',
        courseInterest: 'UI/UX & Product Design',
        qualification: 'Final Year College Student',
        preferredBatch: 'Weekday Evening (7-9 PM)',
        assignedTo: 'usr_tc_vidya_001',
        status: 'ENROLLED',
        notes: 'Admission token paid! Onboarded to Batch #42 starting Monday.',
      },
      {
        name: 'Kavita Sundaram',
        phone: '+91 98450 12345',
        email: 'kavita.s@yahoo.com',
        city: 'Chennai',
        source: 'LinkedIn Education Lead',
        courseInterest: 'Digital Marketing & Growth',
        qualification: 'Graduate (B.Com)',
        preferredBatch: 'Weekday Morning (8-10 AM)',
        assignedTo: 'usr_tc_vidya_001',
        status: 'CALLBACK',
        notes: 'In college lectures right now. Requested callback at 4:30 PM today.',
      },
      {
        name: 'Deepak Saxena',
        phone: '+91 98777 66554',
        email: 'deepak.saxena@gmail.com',
        city: 'Jaipur',
        source: 'YouTube Masterclass',
        courseInterest: 'UPSC & Civil Services Prep',
        qualification: 'Graduate (BA History)',
        preferredBatch: 'Fast-track Bootcamp',
        assignedTo: 'usr_tc_vidya_001',
        status: 'NOT_INTERESTED',
        notes: 'Opted for offline coaching institute in Delhi instead.',
      },
      {
        name: 'Meera Nambiar',
        phone: '+91 98222 33445',
        email: 'meera.n@keralaedu.in',
        city: 'Kochi',
        source: 'Referral by Alumnus',
        courseInterest: 'Python & Cloud DevOps',
        qualification: 'Working Professional (SysAdmin)',
        preferredBatch: 'Weekend Intensive (Sat-Sun)',
        assignedTo: 'usr_tc_vidya_002',
        status: 'INTERESTED',
        notes: 'Looking for AWS + Docker modules. Syllabus PDF sent on WhatsApp.',
      },
      {
        name: 'Siddharth Varma',
        phone: '+91 98333 44556',
        email: 'siddharth.v@gmail.com',
        city: 'Mumbai',
        source: 'Facebook Ad',
        courseInterest: 'Banking & Financial Analysis',
        qualification: 'Graduate (BBA Finance)',
        preferredBatch: 'Weekday Evening (7-9 PM)',
        assignedTo: 'usr_tc_vidya_002',
        status: 'DEMO',
        notes: 'Free trial demo session link shared. Very interested in mock interview prep.',
      },
      {
        name: 'Tanya Kapoor',
        phone: '+91 99111 88776',
        email: 'tanya.k@chandigarh.org',
        city: 'Chandigarh',
        source: 'Website Form',
        courseInterest: 'Data Science & Generative AI',
        qualification: 'Post Graduate (M.Sc Stats)',
        preferredBatch: 'Weekday Morning (8-10 AM)',
        assignedTo: 'usr_tc_vidya_002',
        status: 'ENROLLED',
        notes: 'Full course fee paid. Enrolled in GenAI Advanced Cohort.',
      },
      {
        name: 'Gaurav Mehta',
        phone: '+91 96555 44332',
        email: 'gaurav.m@rediffmail.com',
        city: 'Ahmedabad',
        source: 'Meta Ad Campaign',
        courseInterest: 'Full Stack Web Development',
        qualification: '12th Pass (PCM)',
        preferredBatch: 'Fast-track Bootcamp',
        assignedTo: 'usr_tc_vidya_002',
        status: 'RINGING',
        notes: 'Called 2 times, phone was ringing with no answer. Scheduled retry.',
      },
      {
        name: 'Pooja Hegde',
        phone: '+91 99222 33445',
        email: 'pooja.hegde@outlook.com',
        city: 'Bengaluru',
        source: 'Google Search Ads',
        courseInterest: 'UI/UX & Product Design',
        qualification: 'Graduate (B.Des)',
        preferredBatch: 'Weekend Intensive (Sat-Sun)',
        assignedTo: null,
        status: 'NEW',
        notes: 'Fresh web inquiry seeking Figma & Portfolio acceleration batch.',
      },
      {
        name: 'Nikhil Rathi',
        phone: '+91 97888 11223',
        email: 'nikhil.rathi@gmail.com',
        city: 'Indore',
        source: 'Instagram Ad',
        courseInterest: 'Full Stack Web Development',
        qualification: 'Final Year College Student',
        preferredBatch: 'Weekday Evening (7-9 PM)',
        assignedTo: null,
        status: 'NEW',
        notes: 'Inquired about internship guarantee and scholarship test.',
      },
      {
        name: 'Divya Iyer',
        phone: '+91 99333 77889',
        email: 'divya.iyer@gmail.com',
        city: 'Bengaluru',
        source: 'College Campus Drive',
        courseInterest: 'Data Science & Generative AI',
        qualification: 'Graduate (B.E. EEE)',
        preferredBatch: 'Weekday Morning (8-10 AM)',
        assignedTo: 'usr_tc_dual_001',
        status: 'INTERESTED',
        notes: 'Interested in Python + SQL foundation with AI capstone project.',
      },
    ];

    // 3. Realistic Apni Estate Leads (Property Inquiries & Buyer Requirements)
    const estateLeadsRaw: Array<{
      name: string;
      phone: string;
      email: string;
      city: string;
      source: string;
      propertyType: string;
      budget: string;
      preferredLocation: string;
      siteVisitDate: string;
      assignedTo: string | null;
      status: LeadStatus;
      notes: string;
    }> = [
      {
        name: 'Rajesh Verma',
        phone: '+91 98234 56789',
        email: 'rajesh.v@gmail.com',
        city: 'Mumbai',
        source: 'Meta Real Estate Ad',
        propertyType: '3 BHK Luxury High-rise',
        budget: '₹1.8 Cr - ₹2.5 Cr',
        preferredLocation: 'Bandra West, Mumbai',
        siteVisitDate: `${tomorrowStr} 11:30 AM`,
        assignedTo: 'usr_tc_estate_001',
        status: 'SITE_VISIT_SCHEDULED',
        notes: 'Looking for sea-facing tower. Confirmed physical site visit with family tomorrow at 11:30 AM.',
      },
      {
        name: 'Sunita Mehra',
        phone: '+91 98111 55443',
        email: 'sunita.m@yahoo.com',
        city: 'Delhi NCR',
        source: '99acres Portal',
        propertyType: 'Commercial Retail Shop',
        budget: '₹85 Lakhs - ₹1.2 Cr',
        preferredLocation: 'Sector 62, Noida',
        siteVisitDate: `${todayStr} 04:30 PM`,
        assignedTo: 'usr_tc_estate_001',
        status: 'NEGOTIATING',
        notes: 'Inspected ground floor shop unit. Currently negotiating 5% developer discount on spot booking.',
      },
      {
        name: 'Vikram Malhotra Group',
        phone: '+91 97654 32109',
        email: 'vikram.m@corporatemail.com',
        city: 'Bengaluru',
        source: 'Housing.com Platinum Lead',
        propertyType: 'Independent Luxury Villa',
        budget: '₹3.5 Cr - ₹5 Cr',
        preferredLocation: 'Whitefield, Bengaluru',
        siteVisitDate: `${yesterdayStr} 02:00 PM`,
        assignedTo: 'usr_tc_estate_001',
        status: 'CLOSED',
        notes: 'Token advance of ₹10 Lakhs received! Sale agreement draft dispatched to legal.',
      },
      {
        name: 'Manish Agarwal',
        phone: '+91 98999 11223',
        email: 'manish.agarwal@gmail.com',
        city: 'Gurugram',
        source: 'Google Search Ads',
        propertyType: '2 BHK Premium Apartment',
        budget: '₹65 Lakhs - ₹85 Lakhs',
        preferredLocation: 'Cyber City, Gurugram',
        siteVisitDate: `${inTwoDaysStr} 10:00 AM`,
        assignedTo: 'usr_tc_estate_001',
        status: 'INTERESTED',
        notes: 'Wants gated society near metro station. Floor plans sent on WhatsApp.',
      },
      {
        name: 'Harish Ranganathan',
        phone: '+91 98888 77665',
        email: 'harish.r@chennaiport.in',
        city: 'Chennai',
        source: 'MagicBricks Verified',
        propertyType: 'Residential Plot / Land',
        budget: '₹45 Lakhs - ₹60 Lakhs',
        preferredLocation: 'OMR Road, Chennai',
        siteVisitDate: '',
        assignedTo: 'usr_tc_estate_001',
        status: 'NOT_INTERESTED',
        notes: 'Looking for DTCP approved layout inside city center. Current plots too far.',
      },
      {
        name: 'Karan Johar Group',
        phone: '+91 98333 88990',
        email: 'karan@investorgroup.in',
        city: 'Mumbai',
        source: 'Direct Builder Referral',
        propertyType: 'Commercial Office Space (3000 sq.ft)',
        budget: '₹4.5 Cr - ₹6 Cr',
        preferredLocation: 'BKC / Kurla, Mumbai',
        siteVisitDate: `${todayStr} 05:00 PM`,
        assignedTo: 'usr_tc_estate_002',
        status: 'SITE_VISIT_SCHEDULED',
        notes: 'Corporate site visit with architect scheduled for today 5:00 PM.',
      },
      {
        name: 'Sneha Kulkarni',
        phone: '+91 98450 99887',
        email: 'sneha.k@rediffmail.com',
        city: 'Pune',
        source: 'Meta Lead Ad',
        propertyType: '2 BHK Smart Home',
        budget: '₹55 Lakhs - ₹70 Lakhs',
        preferredLocation: 'Hinjewadi Phase 1, Pune',
        siteVisitDate: `${tomorrowStr} 03:00 PM`,
        assignedTo: 'usr_tc_estate_002',
        status: 'NEGOTIATING',
        notes: 'Liked Tower B East-facing unit. Reviewing payment milestone plan with bank loan officer.',
      },
      {
        name: 'Arjun Singhania',
        phone: '+91 99000 44556',
        email: 'arjun.singhania@luxury.in',
        city: 'Hyderabad',
        source: 'High Net Worth Referral',
        propertyType: 'Studio Penthouse / Villa',
        budget: '₹2.8 Cr - ₹3.5 Cr',
        preferredLocation: 'Gachibowli Financial District, Hyderabad',
        siteVisitDate: `${yesterdayStr} 11:00 AM`,
        assignedTo: 'usr_tc_estate_002',
        status: 'CLOSED',
        notes: 'Unit #1802 Penthouse booked! Bank sanction letter received.',
      },
      {
        name: 'Prakash Rao',
        phone: '+91 97555 66778',
        email: 'prakash.rao@gmail.com',
        city: 'Bengaluru',
        source: 'Facebook Ad',
        propertyType: '3 BHK High-rise Tower',
        budget: '₹1.2 Cr - ₹1.6 Cr',
        preferredLocation: 'Sarjapur Road, Bengaluru',
        siteVisitDate: '',
        assignedTo: 'usr_tc_estate_002',
        status: 'RINGING',
        notes: 'Phone rang with no response on morning call. Sent WhatsApp summary.',
      },
      {
        name: 'Deepa Narang',
        phone: '+91 98112 33445',
        email: 'deepa.narang@gmail.com',
        city: 'Noida',
        source: 'Website Property Form',
        propertyType: '3 BHK Luxury Apartment',
        budget: '₹1.1 Cr - ₹1.4 Cr',
        preferredLocation: 'Sector 150, Noida Expressway',
        siteVisitDate: '',
        assignedTo: null,
        status: 'NEW',
        notes: 'Inquired about golf-view premium towers with clubhouse amenities.',
      },
      {
        name: 'Tarun Chawla',
        phone: '+91 98765 00998',
        email: 'tarun.c@investments.in',
        city: 'Gurugram',
        source: 'Google Search Ads',
        propertyType: 'Commercial Retail / Food Court',
        budget: '₹75 Lakhs - ₹1 Cr',
        preferredLocation: 'Golf Course Extension, Gurugram',
        siteVisitDate: '',
        assignedTo: null,
        status: 'NEW',
        notes: 'Seeking pre-leased commercial property with guaranteed rental returns.',
      },
      {
        name: 'Rashmi Sen',
        phone: '+91 99887 76655',
        email: 'rashmi.sen@gmail.com',
        city: 'Kolkata',
        source: 'Meta Ad Campaign',
        propertyType: '2 BHK Apartment',
        budget: '₹45 Lakhs - ₹60 Lakhs',
        preferredLocation: 'New Town, Kolkata',
        siteVisitDate: `${tomorrowStr} 12:00 PM`,
        assignedTo: 'usr_tc_dual_001',
        status: 'SITE_VISIT_SCHEDULED',
        notes: 'Site visit confirmed with sales executive for tomorrow noon.',
      },
    ];

    // Seed Apni Vidya Leads into DB
    vidyaLeadsRaw.forEach((item, idx) => {
      const leadId = `lead_vidya_${idx + 1}`;
      const tc = item.assignedTo ? this.users.find((u) => u.id === item.assignedTo) : null;
      const calledAt = new Date(now.getTime() - (idx + 1) * 3 * 60 * 60 * 1000).toISOString();

      const lead: Lead = {
        id: leadId,
        name: item.name,
        phone: item.phone,
        email: item.email,
        city: item.city,
        source: item.source,
        brand: 'APNI_VIDYA',
        courseInterest: item.courseInterest,
        qualification: item.qualification,
        preferredBatch: item.preferredBatch,
        productInterest: item.courseInterest,
        assignedTo: item.assignedTo,
        assignedTelecallerName: tc ? tc.name : undefined,
        status: item.status,
        notes: item.notes,
        lastCallAt: item.status !== 'NEW' ? calledAt : undefined,
        lastCallTimestamp: item.status !== 'NEW' ? calledAt : undefined,
        nextFollowUpAt: item.status === 'CALLBACK' ? `${todayStr} 04:30 PM` : undefined,
        totalCallsCount: item.status !== 'NEW' ? 1 + (idx % 3) : 0,
        createdAt: new Date(now.getTime() - (idx + 3) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: calledAt,
      };

      this.leads.push(lead);

      // Lead Created History
      this.leadHistories.push({
        id: `hist_${leadId}_create`,
        leadId,
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'CREATED',
        description: `Lead created for [Apni Vidya] inquiring about "${item.courseInterest}" (${item.qualification}).`,
        timestamp: lead.createdAt,
      });

      if (tc) {
        this.leadHistories.push({
          id: `hist_${leadId}_assign`,
          leadId,
          userId: adminUser.id,
          userName: adminUser.name,
          action: 'ASSIGNED',
          description: `Assigned to ${tc.name} (${tc.loginId}) [Apni Vidya Team].`,
          timestamp: new Date(new Date(lead.createdAt).getTime() + 1000 * 60).toISOString(),
        });
      }

      if (item.status !== 'NEW' && tc) {
        this.callActivities.push({
          id: `call_${leadId}_1`,
          leadId,
          telecallerId: tc.id,
          telecallerName: tc.name,
          status: item.status,
          note: item.notes,
          calledAt,
          durationSeconds: 45 + (idx * 15) % 180,
          callType: idx % 4 === 0 ? 'WHATSAPP' : 'CALL',
        });

        this.leadHistories.push({
          id: `hist_${leadId}_call_1`,
          leadId,
          userId: tc.id,
          userName: tc.name,
          action: 'CALL_MADE',
          description: `Call completed by ${tc.name}. Status marked: ${item.status}. Note: "${item.notes}"`,
          timestamp: calledAt,
        });

        if (item.status === 'CALLBACK') {
          const fu: FollowUp = {
            id: `fu_${leadId}_1`,
            leadId,
            leadName: item.name,
            leadPhone: item.phone,
            brand: 'APNI_VIDYA',
            telecallerId: tc.id,
            telecallerName: tc.name,
            dateTime: `${todayStr}T16:30:00`,
            dueDate: todayStr,
            dueTime: '04:30 PM',
            note: item.notes,
            status: 'PENDING',
            createdAt: calledAt,
          };
          this.followUps.push(fu);
        }

        if (item.status === 'DEMO') {
          this.leadHistories.push({
            id: `hist_${leadId}_demo`,
            leadId,
            userId: tc.id,
            userName: tc.name,
            action: 'DEMO_SCHEDULED',
            description: `Live Academic Demo class scheduled with senior mentor.`,
            timestamp: calledAt,
          });
        } else if (item.status === 'ENROLLED') {
          this.leadHistories.push({
            id: `hist_${leadId}_enroll`,
            leadId,
            userId: tc.id,
            userName: tc.name,
            action: 'ENROLLED',
            description: `Student enrollment completed! Seat confirmed for ${item.courseInterest}.`,
            timestamp: calledAt,
          });
        }
      }
    });

    // Seed Apni Estate Leads into DB
    estateLeadsRaw.forEach((item, idx) => {
      const leadId = `lead_estate_${idx + 1}`;
      const tc = item.assignedTo ? this.users.find((u) => u.id === item.assignedTo) : null;
      const calledAt = new Date(now.getTime() - (idx + 1) * 4 * 60 * 60 * 1000).toISOString();

      const lead: Lead = {
        id: leadId,
        name: item.name,
        phone: item.phone,
        email: item.email,
        city: item.city,
        source: item.source,
        brand: 'APNI_ESTATE',
        propertyType: item.propertyType,
        budget: item.budget,
        preferredLocation: item.preferredLocation,
        siteVisitDate: item.siteVisitDate,
        productInterest: `${item.propertyType} (${item.budget})`,
        assignedTo: item.assignedTo,
        assignedTelecallerName: tc ? tc.name : undefined,
        status: item.status,
        notes: item.notes,
        lastCallAt: item.status !== 'NEW' ? calledAt : undefined,
        lastCallTimestamp: item.status !== 'NEW' ? calledAt : undefined,
        nextFollowUpAt: item.siteVisitDate || undefined,
        totalCallsCount: item.status !== 'NEW' ? 1 + (idx % 3) : 0,
        createdAt: new Date(now.getTime() - (idx + 2) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: calledAt,
      };

      this.leads.push(lead);

      // Lead Created History
      this.leadHistories.push({
        id: `hist_${leadId}_create`,
        leadId,
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'CREATED',
        description: `Lead created for [Apni Estate] inquiring for "${item.propertyType}" at "${item.preferredLocation}" (Budget: ${item.budget}).`,
        timestamp: lead.createdAt,
      });

      if (tc) {
        this.leadHistories.push({
          id: `hist_${leadId}_assign`,
          leadId,
          userId: adminUser.id,
          userName: adminUser.name,
          action: 'ASSIGNED',
          description: `Assigned to ${tc.name} (${tc.loginId}) [Apni Estate Team].`,
          timestamp: new Date(new Date(lead.createdAt).getTime() + 1000 * 60).toISOString(),
        });
      }

      if (item.status !== 'NEW' && tc) {
        this.callActivities.push({
          id: `call_${leadId}_1`,
          leadId,
          telecallerId: tc.id,
          telecallerName: tc.name,
          status: item.status,
          note: item.notes,
          calledAt,
          durationSeconds: 60 + (idx * 20) % 240,
          callType: idx % 3 === 0 ? 'WHATSAPP' : 'CALL',
        });

        this.leadHistories.push({
          id: `hist_${leadId}_call_1`,
          leadId,
          userId: tc.id,
          userName: tc.name,
          action: 'CALL_MADE',
          description: `Call completed by ${tc.name}. Status marked: ${item.status}. Note: "${item.notes}"`,
          timestamp: calledAt,
        });

        if (item.status === 'SITE_VISIT_SCHEDULED') {
          const fu: FollowUp = {
            id: `fu_${leadId}_1`,
            leadId,
            leadName: item.name,
            leadPhone: item.phone,
            brand: 'APNI_ESTATE',
            telecallerId: tc.id,
            telecallerName: tc.name,
            dateTime: item.siteVisitDate ? `${tomorrowStr}T11:30:00` : `${todayStr}T16:00:00`,
            dueDate: item.siteVisitDate ? tomorrowStr : todayStr,
            dueTime: '11:30 AM',
            note: `Site visit scheduled at ${item.preferredLocation}. ${item.notes}`,
            status: 'PENDING',
            createdAt: calledAt,
          };
          this.followUps.push(fu);

          this.leadHistories.push({
            id: `hist_${leadId}_site_visit`,
            leadId,
            userId: tc.id,
            userName: tc.name,
            action: 'SITE_VISIT_SCHEDULED',
            description: `Physical site visit scheduled for ${item.siteVisitDate || tomorrowStr} at ${item.preferredLocation}.`,
            timestamp: calledAt,
          });
        } else if (item.status === 'CLOSED') {
          this.leadHistories.push({
            id: `hist_${leadId}_closed`,
            leadId,
            userId: tc.id,
            userName: tc.name,
            action: 'CLOSED_DEAL',
            description: `Real estate booking closed successfully with token advance!`,
            timestamp: calledAt,
          });
        }
      }
    });

    this.recalculateFollowUpStatuses();
    this.persistToDisk();
  }

  // --- AUTOMATIC STATUS SYNC FOR FOLLOW-UPS ---
  public recalculateFollowUpStatuses() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    this.followUps.forEach((fu) => {
      if (fu.status === 'COMPLETED' || fu.status === 'CANCELLED') return;

      if (fu.dueDate < todayStr) {
        fu.status = 'OVERDUE';
      } else if (fu.dueDate === todayStr) {
        fu.status = 'PENDING';
      } else {
        fu.status = 'PENDING';
      }
    });
  }

  // --- USER METHODS ---
  public getAllUsers(): User[] {
    return this.users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public getTelecallers(brandFilter?: 'ALL' | BusinessBrand): User[] {
    return this.users
      .filter((u) => {
        if (u.role !== 'TELECALLER') return false;
        if (!brandFilter || brandFilter === 'ALL') return true;
        return u.brandAccess === brandFilter || u.brandAccess === 'BOTH';
      })
      .map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public findUserById(id: string): (User & { passwordHash: string }) | undefined {
    return this.users.find((u) => u.id === id);
  }

  public findUserByLoginId(loginId: string): (User & { passwordHash: string }) | undefined {
    if (!loginId) return undefined;
    const clean = loginId.trim().toLowerCase();

    // 1. Direct case-insensitive match on loginId
    const directUser = this.users.find((u) => u.loginId.toLowerCase() === clean);
    if (directUser) return directUser;

    // 2. Direct case-insensitive match on user id (e.g. usr_admin_001, usr_tc_vidya_001)
    const idUser = this.users.find((u) => u.id.toLowerCase() === clean);
    if (idUser) return idUser;

    // 3. User-friendly alias mapping (e.g. TC001 -> TC_VIDYA_1, TC002 -> TC_ESTATE_1, TC003 -> TC_DUAL_1)
    const aliasMap: Record<string, string> = {
      'tc001': 'tc_vidya_1',
      'tc1': 'tc_vidya_1',
      'tc_vidya_1': 'tc_vidya_1',
      'tcvidya1': 'tc_vidya_1',
      'tc002': 'tc_estate_1',
      'tc2': 'tc_estate_1',
      'tc_estate_1': 'tc_estate_1',
      'tcestate1': 'tc_estate_1',
      'tc003': 'tc_dual_1',
      'tc3': 'tc_dual_1',
      'tc_dual_1': 'tc_dual_1',
      'tcdual1': 'tc_dual_1',
    };

    const targetLoginId = aliasMap[clean];
    if (targetLoginId) {
      return this.users.find((u) => u.loginId.toLowerCase() === targetLoginId);
    }

    return undefined;
  }

  public createTelecaller(data: {
    name: string;
    loginId: string;
    password: string;
    brandAccess: BrandAccess;
    phone?: string;
    email?: string;
    dailyTarget?: number;
  }): User {
    const existing = this.findUserByLoginId(data.loginId);
    if (existing) {
      throw new Error(`Telecaller ID "${data.loginId}" already exists. Please choose a unique ID.`);
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password.trim(), salt);
    const now = new Date().toISOString();

    const newUser: User & { passwordHash: string } = {
      id: `usr_tc_${Date.now().toString().slice(-6)}`,
      name: data.name.trim(),
      loginId: data.loginId.trim().toUpperCase(),
      role: 'TELECALLER',
      brandAccess: data.brandAccess || 'APNI_VIDYA',
      dailyTarget: Number(data.dailyTarget) || 50,
      phone: data.phone?.trim() || '+91 90000 00000',
      email: data.email?.trim() || `${data.loginId.toLowerCase()}@apnicrm.com`,
      isActive: true,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(newUser);
    this.persistToDisk();
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  public updateTelecaller(
    id: string,
    updates: Partial<{
      name: string;
      phone: string;
      email: string;
      brandAccess: BrandAccess;
      dailyTarget: number;
      isActive: boolean;
      password?: string;
    }>
  ): User {
    const user = this.findUserById(id);
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

  public deleteTelecaller(id: string): { success: boolean; unassignedLeadsCount: number } {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error(`Telecaller not found with ID: ${id}`);
    }

    const tc = this.users[userIndex];
    this.users.splice(userIndex, 1);

    // Unassign leads previously assigned to this telecaller
    let unassignedLeadsCount = 0;
    this.leads.forEach((l) => {
      if (l.assignedTo === id) {
        l.assignedTo = null;
        l.assignedTelecallerName = undefined;
        l.updatedAt = new Date().toISOString();
        unassignedLeadsCount++;

        this.leadHistories.push({
          id: `hist_${l.id}_del_tc_${Date.now()}`,
          leadId: l.id,
          userId: 'usr_admin_001',
          userName: 'Master Admin HQ',
          action: 'REASSIGNED',
          description: `Telecaller ${tc.name} (${tc.loginId}) was removed. Lead returned to Unassigned Pool.`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    this.persistToDisk();
    return { success: true, unassignedLeadsCount };
  }

  public updateUserPassword(userId: string, newPasswordHash: string): boolean {
    const user = this.findUserById(userId);
    if (!user) return false;
    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return true;
  }

  // --- LEAD METHODS ---
  public getAllLeads(filter?: {
    brand?: 'ALL' | BusinessBrand;
    assignedTo?: string | null;
    status?: LeadStatus;
    search?: string;
  }): Lead[] {
    this.recalculateFollowUpStatuses();

    return this.leads
      .filter((l) => {
        // Brand isolation filter
        if (filter?.brand && filter.brand !== 'ALL') {
          if (l.brand !== filter.brand) return false;
        }

        // Assigned caller filter
        if (filter?.assignedTo !== undefined) {
          if (filter.assignedTo === 'UNASSIGNED') {
            if (l.assignedTo !== null) return false;
          } else if (filter.assignedTo !== 'ALL' && l.assignedTo !== filter.assignedTo) {
            return false;
          }
        }

        // Status filter
        if (filter?.status && filter.status !== ('ALL' as unknown as LeadStatus) && l.status !== filter.status) {
          return false;
        }

        // Search filter
        if (filter?.search) {
          const q = filter.search.toLowerCase().trim();
          const matchName = l.name.toLowerCase().includes(q);
          const matchPhone = l.phone.replace(/[\s+-]/g, '').includes(q.replace(/[\s+-]/g, ''));
          const matchCity = l.city?.toLowerCase().includes(q);
          const matchCourse = l.courseInterest?.toLowerCase().includes(q);
          const matchProperty = l.propertyType?.toLowerCase().includes(q);
          const matchLocation = l.preferredLocation?.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchCity && !matchCourse && !matchProperty && !matchLocation) {
            return false;
          }
        }

        return true;
      })
      .map((l) => this.enrichLead(l));
  }

  public getLeadById(id: string): Lead | undefined {
    const lead = this.leads.find((l) => l.id === id);
    if (!lead) return undefined;
    return this.enrichLead(lead);
  }

  private enrichLead(lead: Lead): Lead {
    const history = this.leadHistories
      .filter((h) => h.leadId === lead.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const callLogs = this.callActivities
      .filter((c) => c.leadId === lead.id)
      .sort((a, b) => new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime());

    const followUps = this.followUps
      .filter((f) => f.leadId === lead.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeFollowUp = followUps.find((f) => f.status === 'PENDING' || f.status === 'OVERDUE');

    const tc = lead.assignedTo ? this.users.find((u) => u.id === lead.assignedTo) : undefined;

    return {
      ...lead,
      assignedTelecallerName: tc ? tc.name : undefined,
      history,
      callLogs,
      followUps,
      activeFollowUp,
    };
  }

  // --- BATCH IMPORT LEADS (Excel / CSV) ---
  public importLeads(
    rows: ParsedLeadRow[],
    assignedToTelecallerId?: string | null,
    adminUser?: User,
    defaultBrand?: BusinessBrand
  ): {
    importedCount: number;
    failedCount: number;
    leads: Lead[];
  } {
    const now = new Date();
    const importedLeads: Lead[] = [];
    let importedCount = 0;
    let failedCount = 0;

    const tc = assignedToTelecallerId ? this.users.find((u) => u.id === assignedToTelecallerId) : null;

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

      this.leads.unshift(newLead);
      importedLeads.push(newLead);
      importedCount++;

      // Record Creation History
      this.leadHistories.push({
        id: `hist_${leadId}_create`,
        leadId,
        userId: adminUser ? adminUser.id : 'usr_admin_001',
        userName: adminUser ? adminUser.name : 'Master Admin HQ',
        action: 'CREATED',
        description: `Lead imported for [${brand === 'APNI_VIDYA' ? 'Apni Vidya' : 'Apni Estate'}] via spreadsheet batch.`,
        timestamp: now.toISOString(),
      });

      if (tc) {
        this.leadHistories.push({
          id: `hist_${leadId}_assign`,
          leadId,
          userId: adminUser ? adminUser.id : 'usr_admin_001',
          userName: adminUser ? adminUser.name : 'Master Admin HQ',
          action: 'ASSIGNED',
          description: `Auto-assigned to ${tc.name} (${tc.loginId}).`,
          timestamp: now.toISOString(),
        });
      }
    });

    this.persistToDisk();
    return { importedCount, failedCount, leads: importedLeads };
  }

  // --- ASSIGN LEADS ---
  public assignLeads(
    leadIds: string[],
    telecallerId: string | null,
    adminUser: User
  ): { assignedCount: number; leads: Lead[] } {
    const nowIso = new Date().toISOString();
    const tc = telecallerId ? this.users.find((u) => u.id === telecallerId) : null;
    let assignedCount = 0;
    const modifiedLeads: Lead[] = [];

    leadIds.forEach((id) => {
      const lead = this.leads.find((l) => l.id === id);
      if (!lead) return;

      const previousTcName = lead.assignedTelecallerName || 'Unassigned';
      lead.assignedTo = tc ? tc.id : null;
      lead.assignedTelecallerName = tc ? tc.name : undefined;
      lead.updatedAt = nowIso;

      this.leadHistories.push({
        id: `hist_${lead.id}_assign_${Date.now()}`,
        leadId: lead.id,
        userId: adminUser.id,
        userName: adminUser.name,
        action: tc ? 'ASSIGNED' : 'REASSIGNED',
        description: tc
          ? `Lead assigned to ${tc.name} (${tc.loginId}) [Brand Access: ${tc.brandAccess}] by ${adminUser.name}. Previous: ${previousTcName}.`
          : `Lead returned to Unassigned Pool by ${adminUser.name}.`,
        timestamp: nowIso,
      });

      assignedCount++;
      modifiedLeads.push(this.enrichLead(lead));
    });

    this.persistToDisk();
    return { assignedCount, leads: modifiedLeads };
  }

  // --- AUTOMATED LEAD DISTRIBUTION (ROUTING BY BRAND) ---
  public autoDistributeLeads(
    brandFilter?: 'ALL' | BusinessBrand,
    adminUser?: User
  ): {
    vidyaAssigned: number;
    estateAssigned: number;
    totalAssigned: number;
    message: string;
  } {
    const nowIso = new Date().toISOString();
    const admin = adminUser || this.findUserById('usr_admin_001') || { id: 'usr_admin_001', name: 'Master Admin' } as any;

    let vidyaAssigned = 0;
    let estateAssigned = 0;

    // Active Vidya telecallers
    const vidyaCallers = this.users.filter(
      (u) => u.role === 'TELECALLER' && u.isActive && (u.brandAccess === 'APNI_VIDYA' || u.brandAccess === 'BOTH')
    );

    // Active Estate telecallers
    const estateCallers = this.users.filter(
      (u) => u.role === 'TELECALLER' && u.isActive && (u.brandAccess === 'APNI_ESTATE' || u.brandAccess === 'BOTH')
    );

    // 1. Distribute Apni Vidya Unassigned Leads
    if (!brandFilter || brandFilter === 'ALL' || brandFilter === 'APNI_VIDYA') {
      if (vidyaCallers.length > 0) {
        const unassignedVidya = this.leads.filter((l) => l.brand === 'APNI_VIDYA' && l.assignedTo === null);
        unassignedVidya.forEach((lead, index) => {
          const targetCaller = vidyaCallers[index % vidyaCallers.length];
          lead.assignedTo = targetCaller.id;
          lead.assignedTelecallerName = targetCaller.name;
          lead.updatedAt = nowIso;

          this.leadHistories.push({
            id: `hist_${lead.id}_auto_assign_${Date.now()}_${index}`,
            leadId: lead.id,
            userId: admin.id,
            userName: admin.name,
            action: 'ASSIGNED',
            description: `Auto-routed to ${targetCaller.name} (${targetCaller.loginId}) via Apni Vidya Distribution Engine.`,
            timestamp: nowIso,
          });

          vidyaAssigned++;
        });
      }
    }

    // 2. Distribute Apni Estate Unassigned Leads
    if (!brandFilter || brandFilter === 'ALL' || brandFilter === 'APNI_ESTATE') {
      if (estateCallers.length > 0) {
        const unassignedEstate = this.leads.filter((l) => l.brand === 'APNI_ESTATE' && l.assignedTo === null);
        unassignedEstate.forEach((lead, index) => {
          const targetCaller = estateCallers[index % estateCallers.length];
          lead.assignedTo = targetCaller.id;
          lead.assignedTelecallerName = targetCaller.name;
          lead.updatedAt = nowIso;

          this.leadHistories.push({
            id: `hist_${lead.id}_auto_assign_${Date.now()}_${index}`,
            leadId: lead.id,
            userId: admin.id,
            userName: admin.name,
            action: 'ASSIGNED',
            description: `Auto-routed to ${targetCaller.name} (${targetCaller.loginId}) via Apni Estate Distribution Engine.`,
            timestamp: nowIso,
          });

          estateAssigned++;
        });
      }
    }

    const totalAssigned = vidyaAssigned + estateAssigned;
    this.persistToDisk();
    return {
      vidyaAssigned,
      estateAssigned,
      totalAssigned,
      message: `Automated distribution complete: ${vidyaAssigned} Vidya leads and ${estateAssigned} Estate leads routed to active callers.`,
    };
  }

  // --- RECORD CALL ACTIVITY & STATUS UPDATE ---
  public recordCallActivity(data: {
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
  }): {
    callActivity: CallActivity;
    lead: Lead;
    followUp?: FollowUp;
  } {
    const lead = this.leads.find((l) => l.id === data.leadId);
    if (!lead) {
      throw new Error(`Lead with ID ${data.leadId} was not found.`);
    }

    const tc = this.users.find((u) => u.id === data.telecallerId);
    if (!tc) {
      throw new Error(`Telecaller with ID ${data.telecallerId} was not found.`);
    }

    const nowIso = new Date().toISOString();
    const prevStatus = lead.status;

    // 1. Create Call Activity
    const callActivity: CallActivity = {
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      leadId: lead.id,
      telecallerId: tc.id,
      telecallerName: tc.name,
      status: data.status,
      note: data.note?.trim(),
      calledAt: nowIso,
      durationSeconds: data.durationSeconds || 0,
      callType: data.callType || 'CALL',
    };
    this.callActivities.unshift(callActivity);

    // 2. Update Lead & custom brand fields
    lead.status = data.status;
    lead.lastCallAt = nowIso;
    lead.lastCallTimestamp = nowIso;
    lead.totalCallsCount = (lead.totalCallsCount || 0) + 1;
    lead.updatedAt = nowIso;
    if (data.note) {
      lead.notes = data.note.trim();
    }
    if (data.customFields) {
      if (data.customFields.courseInterest) lead.courseInterest = data.customFields.courseInterest;
      if (data.customFields.qualification) lead.qualification = data.customFields.qualification;
      if (data.customFields.preferredBatch) lead.preferredBatch = data.customFields.preferredBatch;
      if (data.customFields.propertyType) lead.propertyType = data.customFields.propertyType;
      if (data.customFields.budget) lead.budget = data.customFields.budget;
      if (data.customFields.preferredLocation) lead.preferredLocation = data.customFields.preferredLocation;
      if (data.customFields.siteVisitDate) lead.siteVisitDate = data.customFields.siteVisitDate;
    }

    // 3. Create History
    this.leadHistories.push({
      id: `hist_${lead.id}_call_${Date.now()}`,
      leadId: lead.id,
      userId: tc.id,
      userName: tc.name,
      action: 'CALL_MADE',
      description: `${data.callType === 'WHATSAPP' ? 'WhatsApp outreach' : 'Phone call'} by ${tc.name}. Status: [${data.status}] (Previous: [${prevStatus}]). ${data.note ? `Note: "${data.note}"` : ''}`,
      timestamp: nowIso,
    });

    // 4. Handle Follow-up or Site Visit Schedule if provided
    let createdFollowUp: FollowUp | undefined = undefined;
    if (data.followUp && data.followUp.dueDate) {
      createdFollowUp = this.scheduleFollowUp({
        leadId: lead.id,
        telecallerId: tc.id,
        dueDate: data.followUp.dueDate,
        dueTime: data.followUp.dueTime || '04:00 PM',
        note: data.followUp.note || data.note,
      });

      lead.nextFollowUpAt = `${data.followUp.dueDate} ${data.followUp.dueTime || '04:00 PM'}`;
      if (lead.brand === 'APNI_ESTATE' && data.status === 'SITE_VISIT_SCHEDULED') {
        lead.siteVisitDate = `${data.followUp.dueDate} ${data.followUp.dueTime || '11:00 AM'}`;
      }
    }

    // 5. Special Milestone Histories
    if (data.status === 'ENROLLED') {
      this.leadHistories.push({
        id: `hist_${lead.id}_enroll_${Date.now()}`,
        leadId: lead.id,
        userId: tc.id,
        userName: tc.name,
        action: 'ENROLLED',
        description: `Student admission confirmed & enrolled in ${lead.courseInterest || 'course'}!`,
        timestamp: nowIso,
      });
    } else if (data.status === 'SITE_VISIT_SCHEDULED') {
      this.leadHistories.push({
        id: `hist_${lead.id}_sitevisit_${Date.now()}`,
        leadId: lead.id,
        userId: tc.id,
        userName: tc.name,
        action: 'SITE_VISIT_SCHEDULED',
        description: `Physical site visit booked for ${lead.propertyType || 'property'} at ${lead.preferredLocation || 'site'}.`,
        timestamp: nowIso,
      });
    } else if (data.status === 'CLOSED') {
      this.leadHistories.push({
        id: `hist_${lead.id}_closed_${Date.now()}`,
        leadId: lead.id,
        userId: tc.id,
        userName: tc.name,
        action: 'CLOSED_DEAL',
        description: `Real estate deal closed successfully with signed agreement and token advance!`,
        timestamp: nowIso,
      });
    }

    this.persistToDisk();
    return {
      callActivity,
      lead: this.enrichLead(lead),
      followUp: createdFollowUp,
    };
  }

  // --- SCHEDULE FOLLOW UP ---
  public scheduleFollowUp(data: {
    leadId: string;
    telecallerId: string;
    dueDate: string;
    dueTime: string;
    note?: string;
  }): FollowUp {
    const lead = this.leads.find((l) => l.id === data.leadId);
    if (!lead) throw new Error(`Lead with ID ${data.leadId} not found.`);

    const tc = this.users.find((u) => u.id === data.telecallerId);
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

    this.followUps.unshift(fu);

    lead.nextFollowUpAt = `${data.dueDate} ${data.dueTime || '04:00 PM'}`;
    lead.updatedAt = nowIso;

    this.leadHistories.push({
      id: `hist_${lead.id}_fu_sched_${Date.now()}`,
      leadId: lead.id,
      userId: tc.id,
      userName: tc.name,
      action: 'FOLLOW_UP_CREATED',
      description: `Follow-up scheduled for ${fu.dueDate} at ${fu.dueTime} by ${tc.name}. Note: "${fu.note || 'No notes'}"`,
      timestamp: nowIso,
    });

    this.persistToDisk();
    return fu;
  }

  // --- COMPLETE FOLLOW UP ---
  public completeFollowUp(
    followUpId: string,
    user: User,
    completionNote?: string
  ): { followUp: FollowUp; lead: Lead } {
    const fu = this.followUps.find((f) => f.id === followUpId);
    if (!fu) throw new Error(`Follow-up not found with ID: ${followUpId}`);

    const nowIso = new Date().toISOString();
    fu.status = 'COMPLETED';
    fu.completedAt = nowIso;
    if (completionNote) {
      fu.note = `${fu.note ? fu.note + ' | ' : ''}Completion Note: ${completionNote}`;
    }

    const lead = this.leads.find((l) => l.id === fu.leadId);
    if (lead) {
      lead.nextFollowUpAt = undefined;
      lead.updatedAt = nowIso;

      this.leadHistories.push({
        id: `hist_${lead.id}_fu_done_${Date.now()}`,
        leadId: lead.id,
        userId: user.id,
        userName: user.name,
        action: 'FOLLOW_UP_COMPLETED',
        description: `Follow-up marked as COMPLETED by ${user.name}. ${completionNote ? `Note: "${completionNote}"` : ''}`,
        timestamp: nowIso,
      });
    }

    this.persistToDisk();
    return { followUp: fu, lead: lead ? this.enrichLead(lead) : (null as unknown as Lead) };
  }

  // --- GET FOLLOW UPS FOR TELECALLER OR ADMIN ---
  public getFollowUps(
    telecallerId?: string,
    brandFilter?: 'ALL' | BusinessBrand
  ): {
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    completed: FollowUp[];
  } {
    this.recalculateFollowUpStatuses();
    const todayStr = new Date().toISOString().split('T')[0];

    const filtered = this.followUps.filter((f) => {
      if (telecallerId && f.telecallerId !== telecallerId) return false;
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

  // --- LEAD HISTORY ---
  public getLeadHistory(leadId: string): LeadHistory[] {
    return this.leadHistories
      .filter((h) => h.leadId === leadId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- MASTER ADMIN PERFORMANCE METRICS (BRAND-AWARE) ---
  public getAdminMetrics(brandFilter?: 'ALL' | BusinessBrand): AdminMetrics {
    this.recalculateFollowUpStatuses();
    const todayStr = new Date().toISOString().split('T')[0];

    const allLeads = this.leads;
    const filteredLeads = brandFilter && brandFilter !== 'ALL' ? allLeads.filter((l) => l.brand === brandFilter) : allLeads;

    const totalLeads = filteredLeads.length;
    const vidyaLeads = allLeads.filter((l) => l.brand === 'APNI_VIDYA').length;
    const estateLeads = allLeads.filter((l) => l.brand === 'APNI_ESTATE').length;
    const assignedLeads = filteredLeads.filter((l) => l.assignedTo !== null).length;
    const unassignedLeads = totalLeads - assignedLeads;

    // Calls today
    const callsToday = this.callActivities.filter((c) => {
      if (!c.calledAt.startsWith(todayStr)) return false;
      if (brandFilter && brandFilter !== 'ALL') {
        const l = this.leads.find((x) => x.id === c.leadId);
        return l?.brand === brandFilter;
      }
      return true;
    }).length;

    const activeCallers = this.getTelecallers(brandFilter).filter((t) => t.isActive);
    const todayTarget = activeCallers.reduce((acc, t) => acc + (t.dailyTarget || 50), 0);
    const targetCompletion = todayTarget > 0 ? Math.min(100, Math.round((callsToday / todayTarget) * 100)) : 0;

    // Aggregations
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

    // Apni Vidya Specific Breakdown
    const vidyaAll = allLeads.filter((l) => l.brand === 'APNI_VIDYA');
    const vidyaEnrolled = vidyaAll.filter((l) => l.status === 'ENROLLED').length;
    const vidyaInterested = vidyaAll.filter((l) => l.status === 'INTERESTED').length;
    const vidyaCallbacks = vidyaAll.filter((l) => l.status === 'CALLBACK' || l.status === 'FOLLOW_UP').length;
    const vidyaDemos = vidyaAll.filter((l) => l.status === 'DEMO').length;
    const vidyaNotInterested = vidyaAll.filter((l) => l.status === 'NOT_INTERESTED').length;
    const vidyaConversionRate = vidyaAll.length > 0 ? Math.round((vidyaEnrolled / vidyaAll.length) * 100) : 0;

    // Apni Estate Specific Breakdown
    const estateAll = allLeads.filter((l) => l.brand === 'APNI_ESTATE');
    const estateClosed = estateAll.filter((l) => l.status === 'CLOSED' || l.status === 'BOOKING' || l.status === 'SALE').length;
    const estateInterested = estateAll.filter((l) => l.status === 'INTERESTED').length;
    const estateSiteVisits = estateAll.filter((l) => l.status === 'SITE_VISIT_SCHEDULED').length;
    const estateNegotiating = estateAll.filter((l) => l.status === 'NEGOTIATING').length;
    const estateNotInterested = estateAll.filter((l) => l.status === 'NOT_INTERESTED').length;
    const estateConversionRate = estateAll.length > 0 ? Math.round((estateClosed / estateAll.length) * 100) : 0;

    // Follow-ups counts
    const activeFollowUps = this.followUps.filter((f) => {
      if (f.status === 'COMPLETED' || f.status === 'CANCELLED') return false;
      if (brandFilter && brandFilter !== 'ALL' && f.brand && f.brand !== brandFilter) return false;
      return true;
    });
    const overdueFollowUps = activeFollowUps.filter((f) => f.dueDate < todayStr || f.status === 'OVERDUE').length;
    const todayFollowUps = activeFollowUps.filter((f) => f.dueDate === todayStr && f.status !== 'OVERDUE').length;
    const upcomingFollowUps = activeFollowUps.filter((f) => f.dueDate > todayStr).length;

    return {
      totalLeads,
      vidyaLeads,
      estateLeads,
      assignedLeads,
      unassignedLeads,
      callsMade: this.callActivities.length,
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

  // --- TELECALLER SPECIFIC PERFORMANCE METRICS (BRAND AWARE) ---
  public getTelecallerMetrics(telecallerId: string): TelecallerMetrics {
    const tc = this.users.find((u) => u.id === telecallerId);
    const todayStr = new Date().toISOString().split('T')[0];

    const assignedLeadsList = this.leads.filter((l) => l.assignedTo === telecallerId);
    const callsMadeToday = this.callActivities.filter(
      (c) => c.telecallerId === telecallerId && c.calledAt.startsWith(todayStr)
    ).length;

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

  // --- ALL TELECALLERS PERFORMANCE SUMMARY ---
  public getAllTelecallersPerformance(brandFilter?: 'ALL' | BusinessBrand): TelecallerMetrics[] {
    return this.getTelecallers(brandFilter).map((tc) => this.getTelecallerMetrics(tc.id));
  }
}

export const db = new Database();
