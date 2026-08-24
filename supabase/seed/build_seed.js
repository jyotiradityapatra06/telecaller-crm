import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'data', 'crm_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const DEMO_ORG_ID = 'org_demo_001';
const DEMO_ORG_NAME = 'Apni CRM Demo';
const DEMO_ORG_SLUG = 'apni-crm-demo';

function sqlStr(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function sqlDate(val) {
  if (!val) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'::timestamptz`;
}

let sql = `-- ==============================================================================
-- TeleCaller CRM Enterprise — Phase 4.1 Demo Seed Data
-- Target Database: Supabase PostgreSQL
-- Organization: Apni CRM Demo (Isolated Sandbox)
-- ==============================================================================

BEGIN;

-- 1. Create Dedicated Demo Organization
INSERT INTO organizations (id, name, slug, is_demo, is_active, created_at, updated_at)
VALUES (
  ${sqlStr(DEMO_ORG_ID)},
  ${sqlStr(DEMO_ORG_NAME)},
  ${sqlStr(DEMO_ORG_SLUG)},
  TRUE,
  TRUE,
  NOW() - INTERVAL '30 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  is_demo = EXCLUDED.is_demo,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 2. Seed Demo Users (6 Users: 1 Admin, 2 Vidya TCs, 2 Estate TCs, 1 Dual TC)
`;

db.users.forEach(u => {
  sql += `INSERT INTO users (id, organization_id, name, login_id, role, brand_access, daily_target, phone, email, password_hash, is_active, created_at, updated_at)
VALUES (
  ${sqlStr(u.id)},
  ${sqlStr(DEMO_ORG_ID)},
  ${sqlStr(u.name)},
  ${sqlStr(u.loginId)},
  ${sqlStr(u.role)},
  ${sqlStr(u.brandAccess || 'BOTH')},
  ${u.dailyTarget || 50},
  ${sqlStr(u.phone)},
  ${sqlStr(u.email)},
  ${sqlStr(u.passwordHash)},
  ${u.isActive ? 'TRUE' : 'FALSE'},
  ${sqlDate(u.createdAt)},
  ${sqlDate(u.updatedAt)}
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  login_id = EXCLUDED.login_id,
  role = EXCLUDED.role,
  brand_access = EXCLUDED.brand_access,
  daily_target = EXCLUDED.daily_target,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

`;
});

sql += `\n-- 3. Seed Demo Leads (28 Leads: 14 Apni Vidya, 14 Apni Estate)\n`;

db.leads.forEach(l => {
  sql += `INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  ${sqlStr(l.id)},
  ${sqlStr(DEMO_ORG_ID)},
  ${sqlStr(l.name)},
  ${sqlStr(l.phone)},
  ${sqlStr(l.email)},
  ${sqlStr(l.city)},
  ${sqlStr(l.source || 'Direct')},
  ${sqlStr(l.brand)},
  ${sqlStr(l.courseInterest)},
  ${sqlStr(l.qualification)},
  ${sqlStr(l.preferredBatch)},
  ${sqlStr(l.propertyType)},
  ${sqlStr(l.budget)},
  ${sqlStr(l.preferredLocation)},
  ${sqlStr(l.siteVisitDate)},
  ${sqlStr(l.productInterest)},
  ${sqlStr(l.assignedTo)},
  ${sqlStr(l.status || 'NEW')},
  ${sqlStr(l.notes)},
  ${sqlDate(l.lastCallAt)},
  ${sqlStr(l.lastCallTimestamp)},
  ${sqlDate(l.nextFollowUpAt)},
  ${l.totalCallsCount || 0},
  ${sqlDate(l.createdAt)},
  ${sqlDate(l.updatedAt)}
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  city = EXCLUDED.city,
  source = EXCLUDED.source,
  brand = EXCLUDED.brand,
  course_interest = EXCLUDED.course_interest,
  qualification = EXCLUDED.qualification,
  preferred_batch = EXCLUDED.preferred_batch,
  property_type = EXCLUDED.property_type,
  budget = EXCLUDED.budget,
  preferred_location = EXCLUDED.preferred_location,
  site_visit_date = EXCLUDED.site_visit_date,
  product_interest = EXCLUDED.product_interest,
  assigned_to = EXCLUDED.assigned_to,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  last_call_at = EXCLUDED.last_call_at,
  last_call_timestamp = EXCLUDED.last_call_timestamp,
  next_follow_up_at = EXCLUDED.next_follow_up_at,
  total_calls_count = EXCLUDED.total_calls_count,
  updated_at = EXCLUDED.updated_at;

`;
});

sql += `\n-- 4. Seed Initial Lead Assignments\n`;

db.leads.forEach((l, idx) => {
  if (l.assignedTo) {
    const asgnId = `asgn_demo_${String(idx + 1).padStart(3, '0')}`;
    sql += `INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  ${sqlStr(asgnId)},
  ${sqlStr(DEMO_ORG_ID)},
  ${sqlStr(l.id)},
  ${sqlStr(l.assignedTo)},
  'usr_admin_001',
  'ASSIGNED',
  ${sqlDate(l.createdAt)}
)
ON CONFLICT (id) DO NOTHING;

`;
  }
});

sql += `\n-- 5. Seed Call Activities (22 Call Interactions)\n`;

db.callActivities.forEach(c => {
  sql += `INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  ${sqlStr(c.id)},
  ${sqlStr(DEMO_ORG_ID)},
  ${sqlStr(c.leadId)},
  ${sqlStr(c.telecallerId)},
  ${sqlStr(c.status)},
  ${sqlStr(c.note)},
  ${sqlDate(c.calledAt)},
  ${c.durationSeconds || 0},
  ${sqlStr(c.callType || 'CALL')},
  ${sqlDate(c.calledAt)}
)
ON CONFLICT (id) DO NOTHING;

`;
});

sql += `\n-- 6. Seed Follow-ups (6 Scheduled Follow-ups)\n`;

db.followUps.forEach(f => {
  sql += `INSERT INTO follow_ups (
  id, organization_id, lead_id, telecaller_id,
  scheduled_at, due_date, due_time, legacy_datetime,
  note, status, completed_at, created_at
) VALUES (
  ${sqlStr(f.id)},
  ${sqlStr(DEMO_ORG_ID)},
  ${sqlStr(f.leadId)},
  ${sqlStr(f.telecallerId)},
  ${sqlDate(f.dateTime)},
  '${f.dueDate}'::date,
  ${sqlStr(f.dueTime)},
  ${sqlStr(f.dateTime)},
  ${sqlStr(f.note)},
  ${sqlStr(f.status || 'PENDING')},
  ${sqlDate(f.completedAt)},
  ${sqlDate(f.createdAt)}
)
ON CONFLICT (id) DO NOTHING;

`;
});

sql += `\n-- 7. Seed Lead History (82 Timeline History Entries)\n`;

db.leadHistories.forEach(h => {
  sql += `INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  ${sqlStr(h.id)},
  ${sqlStr(DEMO_ORG_ID)},
  ${sqlStr(h.leadId)},
  ${sqlStr(h.userId)},
  ${sqlStr(h.action)},
  ${sqlStr(h.description)},
  ${sqlDate(h.timestamp)}
)
ON CONFLICT (id) DO NOTHING;

`;
});

sql += `COMMIT;\n`;

const outPath = path.join(__dirname, 'demo_data.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('demo_data.sql generated successfully with:');
console.log('- 1 Demo Organization');
console.log('- ' + db.users.length + ' Users');
console.log('- ' + db.leads.length + ' Leads');
console.log('- ' + db.callActivities.length + ' Call Activities');
console.log('- ' + db.followUps.length + ' Follow-ups');
console.log('- ' + db.leadHistories.length + ' Lead History entries');
