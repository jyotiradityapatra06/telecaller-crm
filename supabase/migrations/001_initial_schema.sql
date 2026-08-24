-- ==============================================================================
-- TeleCaller CRM Enterprise — Phase 4.1 Production Database Migration
-- PostgreSQL / Supabase Schema
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE: organizations
-- Multi-tenant separation for Demo vs. Real Production Accounts
-- ==============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'org_' || encode(gen_random_bytes(8), 'hex'),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'Multi-tenant organization boundary separating demo data from live client enterprise accounts.';
COMMENT ON COLUMN organizations.is_demo IS 'Flag indicating whether this organization is the isolated demo sandbox.';

-- ==============================================================================
-- 3. TABLE: users
-- Users, Admins, and Brand-Isolated Telecallers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'usr_' || encode(gen_random_bytes(8), 'hex'),
    organization_id VARCHAR(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    login_id VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'TELECALLER')),
    brand_access VARCHAR(50) NOT NULL DEFAULT 'BOTH' CHECK (brand_access IN ('APNI_VIDYA', 'APNI_ESTATE', 'BOTH')),
    daily_target INTEGER NOT NULL DEFAULT 50,
    phone VARCHAR(50),
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_org_login UNIQUE (organization_id, login_id)
);

COMMENT ON TABLE users IS 'User accounts with enterprise roles (ADMIN, TELECALLER) and brand division access.';
COMMENT ON COLUMN users.login_id IS 'Organization-scoped unique login identifier.';
COMMENT ON COLUMN users.brand_access IS 'Division access restriction: APNI_VIDYA, APNI_ESTATE, or BOTH.';

-- ==============================================================================
-- 4. TABLE: leads
-- Dual-Brand Leads (Apni Vidya EdTech + Apni Estate Real Estate)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'lead_' || encode(gen_random_bytes(8), 'hex'),
    organization_id VARCHAR(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100),
    source VARCHAR(100) DEFAULT 'Direct',
    brand VARCHAR(50) NOT NULL CHECK (brand IN ('APNI_VIDYA', 'APNI_ESTATE')),
    
    -- Apni Vidya EdTech Custom Fields
    course_interest VARCHAR(255),
    qualification VARCHAR(255),
    preferred_batch VARCHAR(255),
    
    -- Apni Estate Real Estate Custom Fields
    property_type VARCHAR(255),
    budget VARCHAR(100),
    preferred_location VARCHAR(255),
    site_visit_date VARCHAR(100),
    
    -- General / Legacy Compatibility
    product_interest VARCHAR(255),
    
    -- Assignment & Status
    assigned_to VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    notes TEXT,
    
    -- Calling & Follow-up Tracking
    last_call_at TIMESTAMPTZ,
    last_call_timestamp VARCHAR(100),
    next_follow_up_at TIMESTAMPTZ,
    total_calls_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE leads IS 'Lead records with brand-specific properties for Apni Vidya and Apni Estate.';
COMMENT ON COLUMN leads.assigned_to IS 'Current assigned telecaller user ID. Set to NULL if unassigned.';

-- ==============================================================================
-- 5. TABLE: lead_assignments
-- Lead Assignment Audit Trail & Telecaller Allocation History
-- ==============================================================================
CREATE TABLE IF NOT EXISTS lead_assignments (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'asgn_' || encode(gen_random_bytes(8), 'hex'),
    organization_id VARCHAR(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id VARCHAR(100) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    assigned_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    assignment_type VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED' CHECK (assignment_type IN ('ASSIGNED', 'REASSIGNED', 'UNASSIGNED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lead_assignments IS 'Audit history of all lead assignments, re-assignments, and unassignments.';

-- ==============================================================================
-- 6. TABLE: call_activities
-- Telecalling Logged Interactions (Phone Calls & WhatsApp Messages)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS call_activities (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'call_' || encode(gen_random_bytes(8), 'hex'),
    organization_id VARCHAR(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id VARCHAR(100) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    telecaller_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0,
    call_type VARCHAR(50) NOT NULL DEFAULT 'CALL' CHECK (call_type IN ('CALL', 'WHATSAPP')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE call_activities IS 'Detailed calling and messaging log history recorded by telecallers.';

-- ==============================================================================
-- 7. TABLE: follow_ups
-- Scheduled Client Follow-ups & Callback Queues
-- ==============================================================================
CREATE TABLE IF NOT EXISTS follow_ups (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'fu_' || encode(gen_random_bytes(8), 'hex'),
    organization_id VARCHAR(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id VARCHAR(100) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    telecaller_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Normalized Scheduling
    scheduled_at TIMESTAMPTZ,
    due_date DATE NOT NULL,
    due_time VARCHAR(50),
    legacy_datetime VARCHAR(100),
    
    note TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE follow_ups IS 'Scheduled follow-up reminders and callback tasks for telecallers.';

-- ==============================================================================
-- 8. TABLE: lead_history
-- Full Chronological Audit Log for Lead State Changes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS lead_history (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'hist_' || encode(gen_random_bytes(8), 'hex'),
    organization_id VARCHAR(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id VARCHAR(100) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lead_history IS 'Comprehensive timeline of all activities and state transitions on a lead.';

-- ==============================================================================
-- 9. PERFORMANCE INDEXES
-- Optimized for Telecaller Queues, Brand Filtering & Dashboard Aggregations
-- ==============================================================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_demo ON organizations(is_demo);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org_role_active ON users(organization_id, role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_org_brand ON users(organization_id, brand_access);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_brand ON leads(organization_id, brand);
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_org_assigned ON leads(organization_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_org_phone ON leads(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_leads_org_brand_assigned_status ON leads(organization_id, brand, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(organization_id, created_at DESC);

-- Lead Assignments
CREATE INDEX IF NOT EXISTS idx_lead_asgn_org_lead ON lead_assignments(organization_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_asgn_org_assigned_to ON lead_assignments(organization_id, assigned_to);

-- Call Activities
CREATE INDEX IF NOT EXISTS idx_calls_org_lead ON call_activities(organization_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_org_tc_called_at ON call_activities(organization_id, telecaller_id, called_at DESC);

-- Follow-ups
CREATE INDEX IF NOT EXISTS idx_fu_org_lead ON follow_ups(organization_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_fu_org_tc_due ON follow_ups(organization_id, telecaller_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_fu_org_status ON follow_ups(organization_id, status);

-- Lead History
CREATE INDEX IF NOT EXISTS idx_history_org_lead_time ON lead_history(organization_id, lead_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_history_org_user_time ON lead_history(organization_id, user_id, timestamp DESC);

-- ==============================================================================
-- 10. AUTOMATIC TIMESTAMPS TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES (PREPARATION FOR PHASE 4.2)
-- ==============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- Default permissive policy for Service Role (Used by backend API connection)
-- In Phase 4.2, tenant-isolated policies will bind to Supabase JWT / Organization Context
CREATE POLICY service_role_all_organizations ON organizations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_users ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_leads ON leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_lead_assignments ON lead_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_call_activities ON call_activities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_follow_ups ON follow_ups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_lead_history ON lead_history FOR ALL TO service_role USING (true) WITH CHECK (true);
