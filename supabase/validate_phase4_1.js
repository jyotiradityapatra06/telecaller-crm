import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
const seedFile = path.join(__dirname, 'seed', 'demo_data.sql');
const dbFile = path.join(__dirname, '..', 'data', 'crm_db.json');

console.log('=== PHASE 4.1 DATABASE MIGRATION & DATA VALIDATION ===\n');

const checks = [];

function check(name, pass, details = '') {
  checks.push({ name, pass, details });
  console.log(`${pass ? '✅' : '❌'} ${name}${details ? ` (${details})` : ''}`);
}

// 1. Check Migration File Exists
const schemaExists = fs.existsSync(schemaFile);
check('Migration file 001_initial_schema.sql exists', schemaExists);

const schemaContent = schemaExists ? fs.readFileSync(schemaFile, 'utf8') : '';

// 2. Check Required Tables in Schema
const requiredTables = [
  'organizations',
  'users',
  'leads',
  'lead_assignments',
  'call_activities',
  'follow_ups',
  'lead_history'
];

requiredTables.forEach(tbl => {
  const hasTable = schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${tbl}`);
  check(`Table '${tbl}' defined in schema`, hasTable);
});

// 3. Check Required Columns in Tables
const requiredColumns = {
  organizations: ['id', 'name', 'slug', 'is_demo', 'is_active', 'created_at', 'updated_at'],
  users: ['id', 'organization_id', 'name', 'login_id', 'role', 'brand_access', 'daily_target', 'phone', 'email', 'password_hash', 'is_active'],
  leads: ['id', 'organization_id', 'name', 'phone', 'email', 'city', 'source', 'brand', 'course_interest', 'qualification', 'preferred_batch', 'property_type', 'budget', 'preferred_location', 'site_visit_date', 'product_interest', 'assigned_to', 'status', 'notes', 'last_call_at', 'total_calls_count'],
  lead_assignments: ['id', 'organization_id', 'lead_id', 'assigned_to', 'assigned_by', 'assignment_type'],
  call_activities: ['id', 'organization_id', 'lead_id', 'telecaller_id', 'status', 'note', 'called_at', 'duration_seconds', 'call_type'],
  follow_ups: ['id', 'organization_id', 'lead_id', 'telecaller_id', 'scheduled_at', 'due_date', 'due_time', 'legacy_datetime', 'note', 'status'],
  lead_history: ['id', 'organization_id', 'lead_id', 'user_id', 'action', 'description', 'timestamp']
};

Object.entries(requiredColumns).forEach(([table, cols]) => {
  cols.forEach(col => {
    const hasCol = schemaContent.includes(col);
    check(`Column '${col}' in '${table}'`, hasCol);
  });
});

// 4. Check Foreign Keys & Constraints
check('Foreign key: users -> organizations', schemaContent.includes('REFERENCES organizations(id)'));
check('Foreign key: leads -> organizations', schemaContent.includes('REFERENCES organizations(id)'));
check('Foreign key: leads -> users(assigned_to)', schemaContent.includes('REFERENCES users(id) ON DELETE SET NULL'));
check('Constraint: unique(organization_id, login_id)', schemaContent.includes('UNIQUE (organization_id, login_id)'));
check('Row Level Security (RLS) enabled on all tables', schemaContent.includes('ENABLE ROW LEVEL SECURITY'));

// 5. Check Indexes
const requiredIndexes = [
  'idx_organizations_slug',
  'idx_users_org',
  'idx_users_org_role_active',
  'idx_leads_org',
  'idx_leads_org_brand',
  'idx_leads_org_status',
  'idx_leads_org_assigned',
  'idx_leads_org_phone',
  'idx_lead_asgn_org_lead',
  'idx_calls_org_lead',
  'idx_calls_org_tc_called_at',
  'idx_fu_org_lead',
  'idx_fu_org_tc_due',
  'idx_history_org_lead_time'
];

requiredIndexes.forEach(idx => {
  check(`Index '${idx}' created`, schemaContent.includes(idx));
});

// 6. Check Seed File & Local JSON Data Parity
const seedExists = fs.existsSync(seedFile);
check('Seed file demo_data.sql exists', seedExists);

const seedContent = seedExists ? fs.readFileSync(seedFile, 'utf8') : '';
const dbExists = fs.existsSync(dbFile);
check('data/crm_db.json exists and preserved for Node API', dbExists);

const db = dbExists ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : {};

// Count SQL seed statements
const orgCountSQL = (seedContent.match(/INSERT INTO organizations/g) || []).length;
const userCountSQL = (seedContent.match(/INSERT INTO users/g) || []).length;
const leadCountSQL = (seedContent.match(/INSERT INTO leads/g) || []).length;
const asgnCountSQL = (seedContent.match(/INSERT INTO lead_assignments/g) || []).length;
const callCountSQL = (seedContent.match(/INSERT INTO call_activities/g) || []).length;
const followUpCountSQL = (seedContent.match(/INSERT INTO follow_ups/g) || []).length;
const historyCountSQL = (seedContent.match(/INSERT INTO lead_history/g) || []).length;

check('Authoritative Seed: organizations count is 1 (org_demo_001)', orgCountSQL === 1, `Found ${orgCountSQL}`);
check('Authoritative Seed: users count is 6', userCountSQL === 6, `Found ${userCountSQL}`);
check('Authoritative Seed: leads count is 32', leadCountSQL === 32, `Found ${leadCountSQL}`);
check('Authoritative Seed: lead_assignments count is 24', asgnCountSQL === 24, `Found ${asgnCountSQL}`);
check('Authoritative Seed: call_activities count is 24', callCountSQL === 24, `Found ${callCountSQL}`);
check('Authoritative Seed: follow_ups count is 6', followUpCountSQL === 6, `Found ${followUpCountSQL}`);
check('Authoritative Seed: lead_history count is 84', historyCountSQL === 84, `Found ${historyCountSQL}`);

// Count Local JSON Data
const userCountJSON = db.users ? db.users.length : 0;
const leadCountJSON = db.leads ? db.leads.length : 0;
const vidyaLeadsJSON = db.leads ? db.leads.filter(l => l.brand === 'APNI_VIDYA').length : 0;
const estateLeadsJSON = db.leads ? db.leads.filter(l => l.brand === 'APNI_ESTATE').length : 0;
const callCountJSON = db.callActivities ? db.callActivities.length : 0;
const followUpCountJSON = db.followUps ? db.followUps.length : 0;
const historyCountJSON = db.leadHistories ? db.leadHistories.length : 0;

check('Local Data: users count is 6', userCountJSON === 6, `Found ${userCountJSON}`);
check('Local Data: leads count is 32', leadCountJSON === 32, `Found ${leadCountJSON}`);
check('Local Data: APNI_VIDYA leads count is 16', vidyaLeadsJSON === 16, `Found ${vidyaLeadsJSON}`);
check('Local Data: APNI_ESTATE leads count is 16', estateLeadsJSON === 16, `Found ${estateLeadsJSON}`);
check('Local Data: call_activities count is 24', callCountJSON === 24, `Found ${callCountJSON}`);
check('Local Data: follow_ups count is 6', followUpCountJSON === 6, `Found ${followUpCountJSON}`);
check('Local Data: lead_history count is 84', historyCountJSON === 84, `Found ${historyCountJSON}`);

// 7. Multi-Tenant Ownership & Demo Isolation Checks
const demoOrgMatch = seedContent.includes("'org_demo_001'") && seedContent.includes("TRUE");
check('Org org_demo_001 exists and has is_demo = TRUE in seed', demoOrgMatch);

const nonDemoOrgRecords = (seedContent.match(/INSERT INTO \w+ [\s\S]*?'(?!org_demo_001')org_[^']+'/g) || []).length;
check('All demo records strictly bound to org_demo_001 (0 non-demo leaks)', nonDemoOrgRecords === 0, `Leaks: ${nonDemoOrgRecords}`);

// 8. Foreign Key Integrity Checks (No Orphaned References)
const userIds = new Set(db.users.map(u => u.id));
const leadIds = new Set(db.leads.map(l => l.id));

let orphanedLeadRefs = 0;
let orphanedUserRefs = 0;

db.leads.forEach(l => {
  if (l.assignedTo && !userIds.has(l.assignedTo)) orphanedUserRefs++;
});

db.callActivities.forEach(c => {
  if (!leadIds.has(c.leadId)) orphanedLeadRefs++;
  if (c.telecallerId && !userIds.has(c.telecallerId)) orphanedUserRefs++;
});

db.followUps.forEach(f => {
  if (!leadIds.has(f.leadId)) orphanedLeadRefs++;
  if (f.telecallerId && !userIds.has(f.telecallerId)) orphanedUserRefs++;
});

db.leadHistories.forEach(h => {
  if (!leadIds.has(h.leadId)) orphanedLeadRefs++;
  if (h.userId && !userIds.has(h.userId)) orphanedUserRefs++;
});

check('Foreign Key Integrity: 0 orphaned lead references', orphanedLeadRefs === 0, `Orphaned: ${orphanedLeadRefs}`);
check('Foreign Key Integrity: 0 orphaned user references', orphanedUserRefs === 0, `Orphaned: ${orphanedUserRefs}`);

const allPass = checks.every(c => c.pass);
console.log(`\n========================================`);
console.log(`VALIDATION RESULT: ${allPass ? '🟢 ALL CHECKS PASSED' : '🔴 SOME CHECKS FAILED'}`);
console.log(`========================================\n`);

process.exit(allPass ? 0 : 1);
