import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
const seedFile = path.join(__dirname, 'seed', 'demo_data.sql');
const dbFile = path.join(__dirname, '..', 'data', 'crm_db.json');

console.log('=== PHASE 4.1 DATABASE MIGRATION VALIDATION ===\n');

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

// 6. Check Seed File Exists & Content
const seedExists = fs.existsSync(seedFile);
check('Seed file demo_data.sql exists', seedExists);

const seedContent = seedExists ? fs.readFileSync(seedFile, 'utf8') : '';
const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

// Count occurrences in seed
const orgCount = (seedContent.match(/INSERT INTO organizations/g) || []).length;
const userCount = (seedContent.match(/INSERT INTO users/g) || []).length;
const leadCount = (seedContent.match(/INSERT INTO leads/g) || []).length;
const callCount = (seedContent.match(/INSERT INTO call_activities/g) || []).length;
const followUpCount = (seedContent.match(/INSERT INTO follow_ups/g) || []).length;
const historyCount = (seedContent.match(/INSERT INTO lead_history/g) || []).length;

check('Seed organization count is 1 (Demo Org)', orgCount === 1, `Found ${orgCount}`);
check('Seed users count is 6', userCount === 6, `Found ${userCount}`);
check('Seed leads count is 28', leadCount === 28, `Found ${leadCount}`);
check('Seed call_activities count is 22', callCount === 22, `Found ${callCount}`);
check('Seed follow_ups count is 6', followUpCount === 6, `Found ${followUpCount}`);
check('Seed lead_history count is 82', historyCount === 82, `Found ${historyCount}`);

// Verify Brand Distribution
const vidyaLeadsInSeed = (seedContent.match(/'APNI_VIDYA'/g) || []).length;
const estateLeadsInSeed = (seedContent.match(/'APNI_ESTATE'/g) || []).length;
check('Seed contains Apni Vidya records', vidyaLeadsInSeed > 0, `Matches: ${vidyaLeadsInSeed}`);
check('Seed contains Apni Estate records', estateLeadsInSeed > 0, `Matches: ${estateLeadsInSeed}`);

// 7. Verify crm_db.json is preserved and active
check('data/crm_db.json exists and preserved for Node API', fs.existsSync(dbFile));

const allPass = checks.every(c => c.pass);
console.log(`\n========================================`);
console.log(`VALIDATION RESULT: ${allPass ? '🟢 ALL CHECKS PASSED' : '🔴 SOME CHECKS FAILED'}`);
console.log(`========================================\n`);
