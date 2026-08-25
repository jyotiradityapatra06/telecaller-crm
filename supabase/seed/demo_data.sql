-- ==============================================================================
-- TeleCaller CRM Enterprise — Phase 4.1 Demo Seed Data
-- Target Database: Supabase PostgreSQL
-- Organization: Apni CRM Demo (Isolated Sandbox)
-- ==============================================================================

BEGIN;

-- 1. Create Dedicated Demo Organization
INSERT INTO organizations (id, name, slug, is_demo, is_active, created_at, updated_at)
VALUES (
  'org_demo_001',
  'Apni CRM Demo',
  'apni-crm-demo',
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
INSERT INTO users (id, organization_id, name, login_id, role, brand_access, daily_target, phone, email, password_hash, is_active, created_at, updated_at)
VALUES (
  'usr_admin_001',
  'org_demo_001',
  'Master Admin HQ',
  'admin',
  'OWNER',
  'BOTH',
  50,
  '+91 99000 00000',
  'admin@apnicrm.com',
  '$2b$10$gyktp.mv3CsL816uc6rG3etjRfRM9I2vWqnKyx5Y8v44ufs5yMTHS',
  TRUE,
  '2026-07-25T04:18:13.549Z'::timestamptz,
  '2026-08-24T04:18:13.549Z'::timestamptz
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

INSERT INTO users (id, organization_id, name, login_id, role, brand_access, daily_target, phone, email, password_hash, is_active, created_at, updated_at)
VALUES (
  'usr_tc_vidya_001',
  'org_demo_001',
  'Rahul Sharma',
  'TC_VIDYA_1',
  'TELECALLER',
  'APNI_VIDYA',
  50,
  '+91 98765 43210',
  'rahul.vidya@apnicrm.com',
  '$2b$10$gyktp.mv3CsL816uc6rG3e2djmuJoqAPLo2V0mhINym0TUuJLNX8m',
  TRUE,
  '2026-08-04T04:18:13.549Z'::timestamptz,
  '2026-08-24T04:18:13.549Z'::timestamptz
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

INSERT INTO users (id, organization_id, name, login_id, role, brand_access, daily_target, phone, email, password_hash, is_active, created_at, updated_at)
VALUES (
  'usr_tc_vidya_002',
  'org_demo_001',
  'Priya Patel',
  'TC_VIDYA_2',
  'TELECALLER',
  'APNI_VIDYA',
  45,
  '+91 97123 45678',
  'priya.vidya@apnicrm.com',
  '$2b$10$gyktp.mv3CsL816uc6rG3e2djmuJoqAPLo2V0mhINym0TUuJLNX8m',
  TRUE,
  '2026-08-09T04:18:13.549Z'::timestamptz,
  '2026-08-24T04:18:13.549Z'::timestamptz
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

INSERT INTO users (id, organization_id, name, login_id, role, brand_access, daily_target, phone, email, password_hash, is_active, created_at, updated_at)
VALUES (
  'usr_tc_estate_001',
  'org_demo_001',
  'Amit Kumar',
  'TC_ESTATE_1',
  'TELECALLER',
  'APNI_ESTATE',
  40,
  '+91 98234 56789',
  'amit.estate@apnicrm.com',
  '$2b$10$gyktp.mv3CsL816uc6rG3e2djmuJoqAPLo2V0mhINym0TUuJLNX8m',
  TRUE,
  '2026-08-06T04:18:13.549Z'::timestamptz,
  '2026-08-24T04:18:13.549Z'::timestamptz
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

INSERT INTO users (id, organization_id, name, login_id, role, brand_access, daily_target, phone, email, password_hash, is_active, created_at, updated_at)
VALUES (
  'usr_tc_estate_002',
  'org_demo_001',
  'Sneha Rao',
  'TC_ESTATE_2',
  'TELECALLER',
  'APNI_ESTATE',
  45,
  '+91 96543 21098',
  'sneha.estate@apnicrm.com',
  '$2b$10$gyktp.mv3CsL816uc6rG3e2djmuJoqAPLo2V0mhINym0TUuJLNX8m',
  TRUE,
  '2026-08-12T04:18:13.549Z'::timestamptz,
  '2026-08-24T04:18:13.549Z'::timestamptz
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

INSERT INTO users (id, organization_id, name, login_id, role, brand_access, daily_target, phone, email, password_hash, is_active, created_at, updated_at)
VALUES (
  'usr_tc_dual_001',
  'org_demo_001',
  'Vikram Malhotra',
  'TC_DUAL_1',
  'TELECALLER',
  'APNI_VIDYA',
  55,
  '+91 95432 10987',
  'vikram.both@apnicrm.com',
  '$2b$10$gyktp.mv3CsL816uc6rG3e2djmuJoqAPLo2V0mhINym0TUuJLNX8m',
  TRUE,
  '2026-08-14T04:18:13.549Z'::timestamptz,
  '2026-08-24T04:18:13.549Z'::timestamptz
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


-- 3. Seed Demo Leads (28 Leads: 14 Apni Vidya, 14 Apni Estate)
INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_apni_estate_imp_1787545218879_1',
  'org_demo_001',
  'Kiran Rao',
  '+91 97777 22222',
  NULL,
  NULL,
  'Excel/CSV Import',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  '3BHK Luxury Villa',
  NULL,
  NULL,
  NULL,
  '3BHK Luxury Villa',
  NULL,
  'NEW',
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-24T04:20:18.879Z'::timestamptz,
  '2026-08-24T04:20:18.879Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_apni_vidya_imp_1787545218879_0',
  'org_demo_001',
  'Sanjay Dutt',
  '+91 98888 11111',
  NULL,
  NULL,
  'Excel/CSV Import',
  'APNI_VIDYA',
  'Data Science Masterclass',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'Data Science Masterclass',
  NULL,
  'NEW',
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-24T04:20:18.879Z'::timestamptz,
  '2026-08-24T04:20:18.879Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_apni_estate_imp_1787545203691_1',
  'org_demo_001',
  'Kiran Rao',
  '+91 97777 22222',
  NULL,
  NULL,
  'Excel/CSV Import',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  '3BHK Luxury Villa',
  NULL,
  NULL,
  NULL,
  '3BHK Luxury Villa',
  NULL,
  'NEW',
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-24T04:20:03.691Z'::timestamptz,
  '2026-08-24T04:20:03.691Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_apni_vidya_imp_1787545203691_0',
  'org_demo_001',
  'Sanjay Dutt',
  '+91 98888 11111',
  NULL,
  NULL,
  'Excel/CSV Import',
  'APNI_VIDYA',
  'Data Science Masterclass',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'Data Science Masterclass',
  NULL,
  'NEW',
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-24T04:20:03.691Z'::timestamptz,
  '2026-08-24T04:20:03.691Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_1',
  'org_demo_001',
  'Aarav Sharma',
  '+91 98111 22334',
  'aarav.sharma@gmail.com',
  'Delhi NCR',
  'Instagram Ad Campaign',
  'APNI_VIDYA',
  'Full Stack Web Development',
  'Graduate (B.Tech CSE)',
  'Weekday Morning (8-10 AM)',
  NULL,
  NULL,
  NULL,
  NULL,
  'Full Stack Web Development',
  'usr_tc_vidya_001',
  'INTERESTED',
  'Smoke test call: student confirmed interest in Full Stack Web Dev.',
  '2026-08-24T04:20:18.845Z'::timestamptz,
  '2026-08-24T04:20:18.845Z',
  NULL,
  3,
  '2026-08-21T04:18:13.549Z'::timestamptz,
  '2026-08-24T04:20:18.871Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_2',
  'org_demo_001',
  'Ananya Deshmukh',
  '+91 99456 78901',
  'ananya.d@outlook.com',
  'Pune',
  'Website Inquiry Form',
  'APNI_VIDYA',
  'Data Science & Generative AI',
  'Working Professional (2 yrs exp)',
  'Weekend Intensive (Sat-Sun)',
  NULL,
  NULL,
  NULL,
  NULL,
  'Data Science & Generative AI',
  'usr_tc_vidya_001',
  'DEMO',
  'Attending Live AI/ML Demo Class this Saturday at 11 AM.',
  '2026-08-23T22:18:13.549Z'::timestamptz,
  '2026-08-23T22:18:13.549Z',
  NULL,
  2,
  '2026-08-20T04:18:13.549Z'::timestamptz,
  '2026-08-23T22:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_3',
  'org_demo_001',
  'Rohan Joshi',
  '+91 97123 45678',
  'rohan.j@techstartup.io',
  'Hyderabad',
  'Google Search Ads',
  'APNI_VIDYA',
  'UI/UX & Product Design',
  'Final Year College Student',
  'Weekday Evening (7-9 PM)',
  NULL,
  NULL,
  NULL,
  NULL,
  'UI/UX & Product Design',
  'usr_tc_vidya_001',
  'ENROLLED',
  'Admission token paid! Onboarded to Batch #42 starting Monday.',
  '2026-08-23T19:18:13.549Z'::timestamptz,
  '2026-08-23T19:18:13.549Z',
  NULL,
  3,
  '2026-08-19T04:18:13.549Z'::timestamptz,
  '2026-08-23T19:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_4',
  'org_demo_001',
  'Kavita Sundaram',
  '+91 98450 12345',
  'kavita.s@yahoo.com',
  'Chennai',
  'LinkedIn Education Lead',
  'APNI_VIDYA',
  'Digital Marketing & Growth',
  'Graduate (B.Com)',
  'Weekday Morning (8-10 AM)',
  NULL,
  NULL,
  NULL,
  NULL,
  'Digital Marketing & Growth',
  'usr_tc_vidya_001',
  'CALLBACK',
  'In college lectures right now. Requested callback at 4:30 PM today.',
  '2026-08-23T16:18:13.549Z'::timestamptz,
  '2026-08-23T16:18:13.549Z',
  '2026-08-24 04:30 PM'::timestamptz,
  1,
  '2026-08-18T04:18:13.549Z'::timestamptz,
  '2026-08-23T16:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_5',
  'org_demo_001',
  'Deepak Saxena',
  '+91 98777 66554',
  'deepak.saxena@gmail.com',
  'Jaipur',
  'YouTube Masterclass',
  'APNI_VIDYA',
  'UPSC & Civil Services Prep',
  'Graduate (BA History)',
  'Fast-track Bootcamp',
  NULL,
  NULL,
  NULL,
  NULL,
  'UPSC & Civil Services Prep',
  'usr_tc_vidya_001',
  'NOT_INTERESTED',
  'Opted for offline coaching institute in Delhi instead.',
  '2026-08-23T13:18:13.549Z'::timestamptz,
  '2026-08-23T13:18:13.549Z',
  NULL,
  2,
  '2026-08-17T04:18:13.549Z'::timestamptz,
  '2026-08-23T13:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_6',
  'org_demo_001',
  'Meera Nambiar',
  '+91 98222 33445',
  'meera.n@keralaedu.in',
  'Kochi',
  'Referral by Alumnus',
  'APNI_VIDYA',
  'Python & Cloud DevOps',
  'Working Professional (SysAdmin)',
  'Weekend Intensive (Sat-Sun)',
  NULL,
  NULL,
  NULL,
  NULL,
  'Python & Cloud DevOps',
  'usr_tc_vidya_002',
  'INTERESTED',
  'Looking for AWS + Docker modules. Syllabus PDF sent on WhatsApp.',
  '2026-08-23T10:18:13.549Z'::timestamptz,
  '2026-08-23T10:18:13.549Z',
  NULL,
  3,
  '2026-08-16T04:18:13.549Z'::timestamptz,
  '2026-08-23T10:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_7',
  'org_demo_001',
  'Siddharth Varma',
  '+91 98333 44556',
  'siddharth.v@gmail.com',
  'Mumbai',
  'Facebook Ad',
  'APNI_VIDYA',
  'Banking & Financial Analysis',
  'Graduate (BBA Finance)',
  'Weekday Evening (7-9 PM)',
  NULL,
  NULL,
  NULL,
  NULL,
  'Banking & Financial Analysis',
  'usr_tc_vidya_002',
  'DEMO',
  'Free trial demo session link shared. Very interested in mock interview prep.',
  '2026-08-23T07:18:13.549Z'::timestamptz,
  '2026-08-23T07:18:13.549Z',
  NULL,
  1,
  '2026-08-15T04:18:13.549Z'::timestamptz,
  '2026-08-23T07:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_8',
  'org_demo_001',
  'Tanya Kapoor',
  '+91 99111 88776',
  'tanya.k@chandigarh.org',
  'Chandigarh',
  'Website Form',
  'APNI_VIDYA',
  'Data Science & Generative AI',
  'Post Graduate (M.Sc Stats)',
  'Weekday Morning (8-10 AM)',
  NULL,
  NULL,
  NULL,
  NULL,
  'Data Science & Generative AI',
  'usr_tc_vidya_002',
  'ENROLLED',
  'Full course fee paid. Enrolled in GenAI Advanced Cohort.',
  '2026-08-23T04:18:13.549Z'::timestamptz,
  '2026-08-23T04:18:13.549Z',
  NULL,
  2,
  '2026-08-14T04:18:13.549Z'::timestamptz,
  '2026-08-23T04:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_9',
  'org_demo_001',
  'Gaurav Mehta',
  '+91 96555 44332',
  'gaurav.m@rediffmail.com',
  'Ahmedabad',
  'Meta Ad Campaign',
  'APNI_VIDYA',
  'Full Stack Web Development',
  '12th Pass (PCM)',
  'Fast-track Bootcamp',
  NULL,
  NULL,
  NULL,
  NULL,
  'Full Stack Web Development',
  'usr_tc_vidya_002',
  'RINGING',
  'Called 2 times, phone was ringing with no answer. Scheduled retry.',
  '2026-08-23T01:18:13.549Z'::timestamptz,
  '2026-08-23T01:18:13.549Z',
  NULL,
  3,
  '2026-08-13T04:18:13.549Z'::timestamptz,
  '2026-08-23T01:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_10',
  'org_demo_001',
  'Pooja Hegde',
  '+91 99222 33445',
  'pooja.hegde@outlook.com',
  'Bengaluru',
  'Google Search Ads',
  'APNI_VIDYA',
  'UI/UX & Product Design',
  'Graduate (B.Des)',
  'Weekend Intensive (Sat-Sun)',
  NULL,
  NULL,
  NULL,
  NULL,
  'UI/UX & Product Design',
  'usr_tc_vidya_002',
  'NEW',
  'Fresh web inquiry seeking Figma & Portfolio acceleration batch.',
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-12T04:18:13.549Z'::timestamptz,
  '2026-08-22T22:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_11',
  'org_demo_001',
  'Nikhil Rathi',
  '+91 97888 11223',
  'nikhil.rathi@gmail.com',
  'Indore',
  'Instagram Ad',
  'APNI_VIDYA',
  'Full Stack Web Development',
  'Final Year College Student',
  'Weekday Evening (7-9 PM)',
  NULL,
  NULL,
  NULL,
  NULL,
  'Full Stack Web Development',
  'usr_tc_dual_001',
  'NEW',
  'Inquired about internship guarantee and scholarship test.',
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-11T04:18:13.549Z'::timestamptz,
  '2026-08-22T19:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_12',
  'org_demo_001',
  'Divya Iyer',
  '+91 99333 77889',
  'divya.iyer@gmail.com',
  'Bengaluru',
  'College Campus Drive',
  'APNI_VIDYA',
  'Data Science & Generative AI',
  'Graduate (B.E. EEE)',
  'Weekday Morning (8-10 AM)',
  NULL,
  NULL,
  NULL,
  NULL,
  'Data Science & Generative AI',
  'usr_tc_dual_001',
  'INTERESTED',
  'Interested in Python + SQL foundation with AI capstone project.',
  '2026-08-22T16:18:13.549Z'::timestamptz,
  '2026-08-22T16:18:13.549Z',
  NULL,
  3,
  '2026-08-10T04:18:13.549Z'::timestamptz,
  '2026-08-22T16:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_1',
  'org_demo_001',
  'Rajesh Verma',
  '+91 98234 56789',
  'rajesh.v@gmail.com',
  'Mumbai',
  'Meta Real Estate Ad',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  '3 BHK Luxury High-rise',
  '₹1.8 Cr - ₹2.5 Cr',
  'Bandra West, Mumbai',
  '2026-08-25 11:30 AM',
  '3 BHK Luxury High-rise (₹1.8 Cr - ₹2.5 Cr)',
  'usr_tc_estate_001',
  'SITE_VISIT_SCHEDULED',
  'Looking for sea-facing tower. Confirmed physical site visit with family tomorrow at 11:30 AM.',
  '2026-08-24T00:18:13.549Z'::timestamptz,
  '2026-08-24T00:18:13.549Z',
  '2026-08-25 11:30 AM'::timestamptz,
  1,
  '2026-08-22T04:18:13.549Z'::timestamptz,
  '2026-08-24T00:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_2',
  'org_demo_001',
  'Sunita Mehra',
  '+91 98111 55443',
  'sunita.m@yahoo.com',
  'Delhi NCR',
  '99acres Portal',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  'Commercial Retail Shop',
  '₹85 Lakhs - ₹1.2 Cr',
  'Sector 62, Noida',
  '2026-08-24 04:30 PM',
  'Commercial Retail Shop (₹85 Lakhs - ₹1.2 Cr)',
  'usr_tc_estate_001',
  'NEGOTIATING',
  'Inspected ground floor shop unit. Currently negotiating 5% developer discount on spot booking.',
  '2026-08-23T20:18:13.549Z'::timestamptz,
  '2026-08-23T20:18:13.549Z',
  '2026-08-24 04:30 PM'::timestamptz,
  2,
  '2026-08-21T04:18:13.549Z'::timestamptz,
  '2026-08-23T20:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_3',
  'org_demo_001',
  'Vikram Malhotra Group',
  '+91 97654 32109',
  'vikram.m@corporatemail.com',
  'Bengaluru',
  'Housing.com Platinum Lead',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  'Independent Luxury Villa',
  '₹3.5 Cr - ₹5 Cr',
  'Whitefield, Bengaluru',
  '2026-08-23 02:00 PM',
  'Independent Luxury Villa (₹3.5 Cr - ₹5 Cr)',
  'usr_tc_estate_001',
  'CLOSED',
  'Token advance of ₹10 Lakhs received! Sale agreement draft dispatched to legal.',
  '2026-08-23T16:18:13.549Z'::timestamptz,
  '2026-08-23T16:18:13.549Z',
  '2026-08-23 02:00 PM'::timestamptz,
  3,
  '2026-08-20T04:18:13.549Z'::timestamptz,
  '2026-08-23T16:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_4',
  'org_demo_001',
  'Manish Agarwal',
  '+91 98999 11223',
  'manish.agarwal@gmail.com',
  'Gurugram',
  'Google Search Ads',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  '2 BHK Premium Apartment',
  '₹65 Lakhs - ₹85 Lakhs',
  'Cyber City, Gurugram',
  '2026-08-26 10:00 AM',
  '2 BHK Premium Apartment (₹65 Lakhs - ₹85 Lakhs)',
  'usr_tc_estate_001',
  'INTERESTED',
  'Wants gated society near metro station. Floor plans sent on WhatsApp.',
  '2026-08-23T12:18:13.549Z'::timestamptz,
  '2026-08-23T12:18:13.549Z',
  '2026-08-26 10:00 AM'::timestamptz,
  1,
  '2026-08-19T04:18:13.549Z'::timestamptz,
  '2026-08-23T12:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_5',
  'org_demo_001',
  'Harish Ranganathan',
  '+91 98888 77665',
  'harish.r@chennaiport.in',
  'Chennai',
  'MagicBricks Verified',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  'Residential Plot / Land',
  '₹45 Lakhs - ₹60 Lakhs',
  'OMR Road, Chennai',
  '',
  'Residential Plot / Land (₹45 Lakhs - ₹60 Lakhs)',
  'usr_tc_estate_001',
  'NOT_INTERESTED',
  'Looking for DTCP approved layout inside city center. Current plots too far.',
  '2026-08-23T08:18:13.549Z'::timestamptz,
  '2026-08-23T08:18:13.549Z',
  NULL,
  2,
  '2026-08-18T04:18:13.549Z'::timestamptz,
  '2026-08-23T08:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_6',
  'org_demo_001',
  'Karan Johar Group',
  '+91 98333 88990',
  'karan@investorgroup.in',
  'Mumbai',
  'Direct Builder Referral',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  'Commercial Office Space (3000 sq.ft)',
  '₹4.5 Cr - ₹6 Cr',
  'BKC / Kurla, Mumbai',
  '2026-08-24 05:00 PM',
  'Commercial Office Space (3000 sq.ft) (₹4.5 Cr - ₹6 Cr)',
  'usr_tc_estate_002',
  'SITE_VISIT_SCHEDULED',
  'Corporate site visit with architect scheduled for today 5:00 PM.',
  '2026-08-23T04:18:13.549Z'::timestamptz,
  '2026-08-23T04:18:13.549Z',
  '2026-08-24 05:00 PM'::timestamptz,
  3,
  '2026-08-17T04:18:13.549Z'::timestamptz,
  '2026-08-23T04:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_7',
  'org_demo_001',
  'Sneha Kulkarni',
  '+91 98450 99887',
  'sneha.k@rediffmail.com',
  'Pune',
  'Meta Lead Ad',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  '2 BHK Smart Home',
  '₹55 Lakhs - ₹70 Lakhs',
  'Hinjewadi Phase 1, Pune',
  '2026-08-25 03:00 PM',
  '2 BHK Smart Home (₹55 Lakhs - ₹70 Lakhs)',
  'usr_tc_estate_002',
  'NEGOTIATING',
  'Liked Tower B East-facing unit. Reviewing payment milestone plan with bank loan officer.',
  '2026-08-23T00:18:13.549Z'::timestamptz,
  '2026-08-23T00:18:13.549Z',
  '2026-08-25 03:00 PM'::timestamptz,
  1,
  '2026-08-16T04:18:13.549Z'::timestamptz,
  '2026-08-23T00:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_8',
  'org_demo_001',
  'Arjun Singhania',
  '+91 99000 44556',
  'arjun.singhania@luxury.in',
  'Hyderabad',
  'High Net Worth Referral',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  'Studio Penthouse / Villa',
  '₹2.8 Cr - ₹3.5 Cr',
  'Gachibowli Financial District, Hyderabad',
  '2026-08-23 11:00 AM',
  'Studio Penthouse / Villa (₹2.8 Cr - ₹3.5 Cr)',
  'usr_tc_estate_002',
  'CLOSED',
  'Unit #1802 Penthouse booked! Bank sanction letter received.',
  '2026-08-22T20:18:13.549Z'::timestamptz,
  '2026-08-22T20:18:13.549Z',
  '2026-08-23 11:00 AM'::timestamptz,
  2,
  '2026-08-15T04:18:13.549Z'::timestamptz,
  '2026-08-22T20:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_9',
  'org_demo_001',
  'Prakash Rao',
  '+91 97555 66778',
  'prakash.rao@gmail.com',
  'Bengaluru',
  'Facebook Ad',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  '3 BHK High-rise Tower',
  '₹1.2 Cr - ₹1.6 Cr',
  'Sarjapur Road, Bengaluru',
  '',
  '3 BHK High-rise Tower (₹1.2 Cr - ₹1.6 Cr)',
  'usr_tc_estate_002',
  'RINGING',
  'Phone rang with no response on morning call. Sent WhatsApp summary.',
  '2026-08-22T16:18:13.549Z'::timestamptz,
  '2026-08-22T16:18:13.549Z',
  NULL,
  3,
  '2026-08-14T04:18:13.549Z'::timestamptz,
  '2026-08-22T16:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_10',
  'org_demo_001',
  'Deepa Narang',
  '+91 98112 33445',
  'deepa.narang@gmail.com',
  'Noida',
  'Website Property Form',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  '3 BHK Luxury Apartment',
  '₹1.1 Cr - ₹1.4 Cr',
  'Sector 150, Noida Expressway',
  '',
  '3 BHK Luxury Apartment (₹1.1 Cr - ₹1.4 Cr)',
  'usr_tc_estate_002',
  'NEW',
  'Inquired about golf-view premium towers with clubhouse amenities.',
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-13T04:18:13.549Z'::timestamptz,
  '2026-08-22T12:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_11',
  'org_demo_001',
  'Tarun Chawla',
  '+91 98765 00998',
  'tarun.c@investments.in',
  'Gurugram',
  'Google Search Ads',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  'Commercial Retail / Food Court',
  '₹75 Lakhs - ₹1 Cr',
  'Golf Course Extension, Gurugram',
  '',
  'Commercial Retail / Food Court (₹75 Lakhs - ₹1 Cr)',
  'usr_tc_dual_001',
  'NEW',
  'Seeking pre-leased commercial property with guaranteed rental returns.',
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-12T04:18:13.549Z'::timestamptz,
  '2026-08-22T08:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_12',
  'org_demo_001',
  'Rashmi Sen',
  '+91 99887 76655',
  'rashmi.sen@gmail.com',
  'Kolkata',
  'Meta Ad Campaign',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  '2 BHK Apartment',
  '₹45 Lakhs - ₹60 Lakhs',
  'New Town, Kolkata',
  '2026-08-25 12:00 PM',
  '2 BHK Apartment (₹45 Lakhs - ₹60 Lakhs)',
  'usr_tc_dual_001',
  'SITE_VISIT_SCHEDULED',
  'Site visit confirmed with sales executive for tomorrow noon.',
  '2026-08-22T04:18:13.549Z'::timestamptz,
  '2026-08-22T04:18:13.549Z',
  '2026-08-25 12:00 PM'::timestamptz,
  3,
  '2026-08-11T04:18:13.549Z'::timestamptz,
  '2026-08-22T04:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_13',
  'org_demo_001',
  'Gaurav Chouhan',
  '+91 98999 00112',
  'gaurav.c@indoretech.com',
  'Indore',
  'Telegram Channel Ad',
  'APNI_VIDYA',
  'Full Stack Web Development',
  'Working Professional (PHP Dev)',
  'Fast-track Bootcamp',
  NULL,
  NULL,
  NULL,
  NULL,
  'Full Stack Web Development',
  NULL,
  'NEW',
  'Seeking Next.js + Microservices upgrade for senior dev promotion. Unassigned pool.',
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-09T04:18:13.549Z'::timestamptz,
  '2026-08-09T04:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_vidya_14',
  'org_demo_001',
  'Ritika Sen',
  '+91 98000 11223',
  'ritika.sen@bhu.ac.in',
  'Varanasi',
  'Quora Question Link',
  'APNI_VIDYA',
  'Data Science & Generative AI',
  'Graduate (M.Sc Statistics)',
  'Weekend Intensive (Sat-Sun)',
  NULL,
  NULL,
  NULL,
  NULL,
  'Data Science & Generative AI',
  NULL,
  'NEW',
  'Strong math background. Wants Python for ML syllabus breakdown. Unassigned pool.',
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-08T04:18:13.549Z'::timestamptz,
  '2026-08-08T04:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_13',
  'org_demo_001',
  'Sameer Khan',
  '+91 99333 44556',
  'sameer.k@khancorp.com',
  'Hyderabad',
  'MagicBricks Form',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  'Commercial Office Floor',
  '₹5.0 Cr - ₹7.0 Cr',
  'HITEC City, Hyderabad',
  NULL,
  'Commercial Office Floor',
  NULL,
  'NEW',
  'Corporate buyer searching for 6,000 sq.ft grade-A office space. Unassigned pool.',
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-09T04:18:13.549Z'::timestamptz,
  '2026-08-09T04:18:13.549Z'::timestamptz
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

INSERT INTO leads (
  id, organization_id, name, phone, email, city, source, brand,
  course_interest, qualification, preferred_batch,
  property_type, budget, preferred_location, site_visit_date,
  product_interest, assigned_to, status, notes,
  last_call_at, last_call_timestamp, next_follow_up_at, total_calls_count,
  created_at, updated_at
) VALUES (
  'lead_estate_14',
  'org_demo_001',
  'Tanya Roy',
  '+91 99444 55667',
  'tanya.roy@gmail.com',
  'Kolkata',
  '99acres Lead Form',
  'APNI_ESTATE',
  NULL,
  NULL,
  NULL,
  '3 BHK Lake-view Condo',
  '₹75 Lakh - ₹95 Lakh',
  'New Town Action Area 2, Kolkata',
  NULL,
  '3 BHK Lake-view Condo',
  NULL,
  'NEW',
  'IT professional looking for south-facing balcony unit. Unassigned pool.',
  NULL,
  NULL,
  NULL,
  0,
  '2026-08-08T04:18:13.549Z'::timestamptz,
  '2026-08-08T04:18:13.549Z'::timestamptz
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


-- 4. Seed Initial Lead Assignments (24 Active Lead Allocations)
INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_001',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-21T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_002',
  'org_demo_001',
  'lead_vidya_2',
  'usr_tc_vidya_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-20T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_003',
  'org_demo_001',
  'lead_vidya_3',
  'usr_tc_vidya_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-19T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_004',
  'org_demo_001',
  'lead_vidya_4',
  'usr_tc_vidya_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-18T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_005',
  'org_demo_001',
  'lead_vidya_5',
  'usr_tc_vidya_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-17T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_006',
  'org_demo_001',
  'lead_vidya_6',
  'usr_tc_vidya_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-16T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_007',
  'org_demo_001',
  'lead_vidya_7',
  'usr_tc_vidya_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-15T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_008',
  'org_demo_001',
  'lead_vidya_8',
  'usr_tc_vidya_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-14T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_009',
  'org_demo_001',
  'lead_vidya_9',
  'usr_tc_vidya_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-13T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_010',
  'org_demo_001',
  'lead_vidya_10',
  'usr_tc_vidya_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-12T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_011',
  'org_demo_001',
  'lead_vidya_11',
  'usr_tc_dual_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-11T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_012',
  'org_demo_001',
  'lead_vidya_12',
  'usr_tc_dual_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-10T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_013',
  'org_demo_001',
  'lead_estate_1',
  'usr_tc_estate_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-22T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_014',
  'org_demo_001',
  'lead_estate_2',
  'usr_tc_estate_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-21T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_015',
  'org_demo_001',
  'lead_estate_3',
  'usr_tc_estate_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-20T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_016',
  'org_demo_001',
  'lead_estate_4',
  'usr_tc_estate_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-19T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_017',
  'org_demo_001',
  'lead_estate_5',
  'usr_tc_estate_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-18T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_018',
  'org_demo_001',
  'lead_estate_6',
  'usr_tc_estate_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-17T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_019',
  'org_demo_001',
  'lead_estate_7',
  'usr_tc_estate_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-16T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_020',
  'org_demo_001',
  'lead_estate_8',
  'usr_tc_estate_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-15T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_021',
  'org_demo_001',
  'lead_estate_9',
  'usr_tc_estate_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-14T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_022',
  'org_demo_001',
  'lead_estate_10',
  'usr_tc_estate_002',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-13T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_023',
  'org_demo_001',
  'lead_estate_11',
  'usr_tc_dual_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-12T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
VALUES (
  'asgn_demo_024',
  'org_demo_001',
  'lead_estate_12',
  'usr_tc_dual_001',
  'usr_admin_001',
  'ASSIGNED',
  '2026-08-11T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;


-- 5. Seed Call Activities (22 Call Interactions)
INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_1787545218845_gtry',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'INTERESTED',
  'Smoke test call: student confirmed interest in Full Stack Web Dev.',
  '2026-08-24T04:20:18.845Z'::timestamptz,
  62,
  'CALL',
  '2026-08-24T04:20:18.845Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_1787545203673_12pg',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'INTERESTED',
  'Smoke test call: student confirmed interest in Full Stack Web Dev.',
  '2026-08-24T04:20:03.673Z'::timestamptz,
  62,
  'CALL',
  '2026-08-24T04:20:03.673Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_1_1',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'INTERESTED',
  'Highly motivated. Wants placement assistance in MERN stack. Sent brochure.',
  '2026-08-24T01:18:13.549Z'::timestamptz,
  45,
  'WHATSAPP',
  '2026-08-24T01:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_2_1',
  'org_demo_001',
  'lead_vidya_2',
  'usr_tc_vidya_001',
  'DEMO',
  'Attending Live AI/ML Demo Class this Saturday at 11 AM.',
  '2026-08-23T22:18:13.549Z'::timestamptz,
  60,
  'CALL',
  '2026-08-23T22:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_3_1',
  'org_demo_001',
  'lead_vidya_3',
  'usr_tc_vidya_001',
  'ENROLLED',
  'Admission token paid! Onboarded to Batch #42 starting Monday.',
  '2026-08-23T19:18:13.549Z'::timestamptz,
  75,
  'CALL',
  '2026-08-23T19:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_4_1',
  'org_demo_001',
  'lead_vidya_4',
  'usr_tc_vidya_001',
  'CALLBACK',
  'In college lectures right now. Requested callback at 4:30 PM today.',
  '2026-08-23T16:18:13.549Z'::timestamptz,
  90,
  'CALL',
  '2026-08-23T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_5_1',
  'org_demo_001',
  'lead_vidya_5',
  'usr_tc_vidya_001',
  'NOT_INTERESTED',
  'Opted for offline coaching institute in Delhi instead.',
  '2026-08-23T13:18:13.549Z'::timestamptz,
  105,
  'WHATSAPP',
  '2026-08-23T13:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_6_1',
  'org_demo_001',
  'lead_vidya_6',
  'usr_tc_vidya_002',
  'INTERESTED',
  'Looking for AWS + Docker modules. Syllabus PDF sent on WhatsApp.',
  '2026-08-23T10:18:13.549Z'::timestamptz,
  120,
  'CALL',
  '2026-08-23T10:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_7_1',
  'org_demo_001',
  'lead_vidya_7',
  'usr_tc_vidya_002',
  'DEMO',
  'Free trial demo session link shared. Very interested in mock interview prep.',
  '2026-08-23T07:18:13.549Z'::timestamptz,
  135,
  'CALL',
  '2026-08-23T07:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_8_1',
  'org_demo_001',
  'lead_vidya_8',
  'usr_tc_vidya_002',
  'ENROLLED',
  'Full course fee paid. Enrolled in GenAI Advanced Cohort.',
  '2026-08-23T04:18:13.549Z'::timestamptz,
  150,
  'CALL',
  '2026-08-23T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_9_1',
  'org_demo_001',
  'lead_vidya_9',
  'usr_tc_vidya_002',
  'RINGING',
  'Called 2 times, phone was ringing with no answer. Scheduled retry.',
  '2026-08-23T01:18:13.549Z'::timestamptz,
  165,
  'WHATSAPP',
  '2026-08-23T01:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_12_1',
  'org_demo_001',
  'lead_vidya_12',
  'usr_tc_dual_001',
  'INTERESTED',
  'Interested in Python + SQL foundation with AI capstone project.',
  '2026-08-22T16:18:13.549Z'::timestamptz,
  210,
  'CALL',
  '2026-08-22T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_1_1',
  'org_demo_001',
  'lead_estate_1',
  'usr_tc_estate_001',
  'SITE_VISIT_SCHEDULED',
  'Looking for sea-facing tower. Confirmed physical site visit with family tomorrow at 11:30 AM.',
  '2026-08-24T00:18:13.549Z'::timestamptz,
  60,
  'WHATSAPP',
  '2026-08-24T00:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_2_1',
  'org_demo_001',
  'lead_estate_2',
  'usr_tc_estate_001',
  'NEGOTIATING',
  'Inspected ground floor shop unit. Currently negotiating 5% developer discount on spot booking.',
  '2026-08-23T20:18:13.549Z'::timestamptz,
  80,
  'CALL',
  '2026-08-23T20:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_3_1',
  'org_demo_001',
  'lead_estate_3',
  'usr_tc_estate_001',
  'CLOSED',
  'Token advance of ₹10 Lakhs received! Sale agreement draft dispatched to legal.',
  '2026-08-23T16:18:13.549Z'::timestamptz,
  100,
  'CALL',
  '2026-08-23T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_4_1',
  'org_demo_001',
  'lead_estate_4',
  'usr_tc_estate_001',
  'INTERESTED',
  'Wants gated society near metro station. Floor plans sent on WhatsApp.',
  '2026-08-23T12:18:13.549Z'::timestamptz,
  120,
  'WHATSAPP',
  '2026-08-23T12:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_5_1',
  'org_demo_001',
  'lead_estate_5',
  'usr_tc_estate_001',
  'NOT_INTERESTED',
  'Looking for DTCP approved layout inside city center. Current plots too far.',
  '2026-08-23T08:18:13.549Z'::timestamptz,
  140,
  'CALL',
  '2026-08-23T08:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_6_1',
  'org_demo_001',
  'lead_estate_6',
  'usr_tc_estate_002',
  'SITE_VISIT_SCHEDULED',
  'Corporate site visit with architect scheduled for today 5:00 PM.',
  '2026-08-23T04:18:13.549Z'::timestamptz,
  160,
  'CALL',
  '2026-08-23T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_7_1',
  'org_demo_001',
  'lead_estate_7',
  'usr_tc_estate_002',
  'NEGOTIATING',
  'Liked Tower B East-facing unit. Reviewing payment milestone plan with bank loan officer.',
  '2026-08-23T00:18:13.549Z'::timestamptz,
  180,
  'WHATSAPP',
  '2026-08-23T00:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_8_1',
  'org_demo_001',
  'lead_estate_8',
  'usr_tc_estate_002',
  'CLOSED',
  'Unit #1802 Penthouse booked! Bank sanction letter received.',
  '2026-08-22T20:18:13.549Z'::timestamptz,
  200,
  'CALL',
  '2026-08-22T20:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_9_1',
  'org_demo_001',
  'lead_estate_9',
  'usr_tc_estate_002',
  'RINGING',
  'Phone rang with no response on morning call. Sent WhatsApp summary.',
  '2026-08-22T16:18:13.549Z'::timestamptz,
  220,
  'CALL',
  '2026-08-22T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_12_1',
  'org_demo_001',
  'lead_estate_12',
  'usr_tc_dual_001',
  'SITE_VISIT_SCHEDULED',
  'Site visit confirmed with sales executive for tomorrow noon.',
  '2026-08-22T04:18:13.549Z'::timestamptz,
  280,
  'CALL',
  '2026-08-22T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_vidya_11_1',
  'org_demo_001',
  'lead_vidya_11',
  'usr_tc_dual_001',
  'INTERESTED',
  'Discussed design portfolio review and career mentorship.',
  '2026-08-22T22:18:13.549Z'::timestamptz,
  280,
  'CALL',
  '2026-08-22T22:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO call_activities (id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at)
VALUES (
  'call_lead_estate_11_1',
  'org_demo_001',
  'lead_estate_11',
  'usr_tc_dual_001',
  'INTERESTED',
  'NRI buyer inquiry logged for Pune project.',
  '2026-08-22T18:18:13.549Z'::timestamptz,
  310,
  'CALL',
  '2026-08-22T18:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;


-- 6. Seed Follow-ups (6 Scheduled Follow-ups)
INSERT INTO follow_ups (
  id, organization_id, lead_id, telecaller_id,
  scheduled_at, due_date, due_time, legacy_datetime,
  note, status, completed_at, created_at
) VALUES (
  'fu_1787545218845_bnm1',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  '2026-08-25T03:30 PM'::timestamptz,
  '2026-08-25'::date,
  '03:30 PM',
  '2026-08-25T03:30 PM',
  'Call back for fee breakdown and batch timing. | Completion Note: Follow up completed during test.',
  'COMPLETED',
  '2026-08-24T04:20:18.871Z'::timestamptz,
  '2026-08-24T04:20:18.845Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO follow_ups (
  id, organization_id, lead_id, telecaller_id,
  scheduled_at, due_date, due_time, legacy_datetime,
  note, status, completed_at, created_at
) VALUES (
  'fu_1787545203674_egjy',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  '2026-08-25T03:30 PM'::timestamptz,
  '2026-08-25'::date,
  '03:30 PM',
  '2026-08-25T03:30 PM',
  'Call back for fee breakdown and batch timing.',
  'PENDING',
  NULL,
  '2026-08-24T04:20:03.674Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO follow_ups (
  id, organization_id, lead_id, telecaller_id,
  scheduled_at, due_date, due_time, legacy_datetime,
  note, status, completed_at, created_at
) VALUES (
  'fu_lead_vidya_4_1',
  'org_demo_001',
  'lead_vidya_4',
  'usr_tc_vidya_001',
  '2026-08-24T16:30:00'::timestamptz,
  '2026-08-24'::date,
  '04:30 PM',
  '2026-08-24T16:30:00',
  'In college lectures right now. Requested callback at 4:30 PM today.',
  'PENDING',
  NULL,
  '2026-08-23T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO follow_ups (
  id, organization_id, lead_id, telecaller_id,
  scheduled_at, due_date, due_time, legacy_datetime,
  note, status, completed_at, created_at
) VALUES (
  'fu_lead_estate_1_1',
  'org_demo_001',
  'lead_estate_1',
  'usr_tc_estate_001',
  '2026-08-25T11:30:00'::timestamptz,
  '2026-08-25'::date,
  '11:30 AM',
  '2026-08-25T11:30:00',
  'Site visit scheduled at Bandra West, Mumbai. Looking for sea-facing tower. Confirmed physical site visit with family tomorrow at 11:30 AM.',
  'PENDING',
  NULL,
  '2026-08-24T00:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO follow_ups (
  id, organization_id, lead_id, telecaller_id,
  scheduled_at, due_date, due_time, legacy_datetime,
  note, status, completed_at, created_at
) VALUES (
  'fu_lead_estate_6_1',
  'org_demo_001',
  'lead_estate_6',
  'usr_tc_estate_002',
  '2026-08-25T11:30:00'::timestamptz,
  '2026-08-25'::date,
  '11:30 AM',
  '2026-08-25T11:30:00',
  'Site visit scheduled at BKC / Kurla, Mumbai. Corporate site visit with architect scheduled for today 5:00 PM.',
  'PENDING',
  NULL,
  '2026-08-23T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO follow_ups (
  id, organization_id, lead_id, telecaller_id,
  scheduled_at, due_date, due_time, legacy_datetime,
  note, status, completed_at, created_at
) VALUES (
  'fu_lead_estate_12_1',
  'org_demo_001',
  'lead_estate_12',
  'usr_tc_dual_001',
  '2026-08-25T11:30:00'::timestamptz,
  '2026-08-25'::date,
  '11:30 AM',
  '2026-08-25T11:30:00',
  'Site visit scheduled at New Town, Kolkata. Site visit confirmed with sales executive for tomorrow noon.',
  'PENDING',
  NULL,
  '2026-08-22T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;


-- 7. Seed Lead History (82 Timeline History Entries)
INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_1_create',
  'org_demo_001',
  'lead_vidya_1',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "Full Stack Web Development" (Graduate (B.Tech CSE)).',
  '2026-08-21T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_1_assign',
  'org_demo_001',
  'lead_vidya_1',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Rahul Sharma (TC_VIDYA_1) [Apni Vidya Team].',
  '2026-08-21T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_1_call_1',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'CALL_MADE',
  'Call completed by Rahul Sharma. Status marked: INTERESTED. Note: "Highly motivated. Wants placement assistance in MERN stack. Sent brochure."',
  '2026-08-24T01:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_2_create',
  'org_demo_001',
  'lead_vidya_2',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "Data Science & Generative AI" (Working Professional (2 yrs exp)).',
  '2026-08-20T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_2_assign',
  'org_demo_001',
  'lead_vidya_2',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Rahul Sharma (TC_VIDYA_1) [Apni Vidya Team].',
  '2026-08-20T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_2_call_1',
  'org_demo_001',
  'lead_vidya_2',
  'usr_tc_vidya_001',
  'CALL_MADE',
  'Call completed by Rahul Sharma. Status marked: DEMO. Note: "Attending Live AI/ML Demo Class this Saturday at 11 AM."',
  '2026-08-23T22:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_2_demo',
  'org_demo_001',
  'lead_vidya_2',
  'usr_tc_vidya_001',
  'DEMO_SCHEDULED',
  'Live Academic Demo class scheduled with senior mentor.',
  '2026-08-23T22:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_3_create',
  'org_demo_001',
  'lead_vidya_3',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "UI/UX & Product Design" (Final Year College Student).',
  '2026-08-19T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_3_assign',
  'org_demo_001',
  'lead_vidya_3',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Rahul Sharma (TC_VIDYA_1) [Apni Vidya Team].',
  '2026-08-19T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_3_call_1',
  'org_demo_001',
  'lead_vidya_3',
  'usr_tc_vidya_001',
  'CALL_MADE',
  'Call completed by Rahul Sharma. Status marked: ENROLLED. Note: "Admission token paid! Onboarded to Batch #42 starting Monday."',
  '2026-08-23T19:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_3_enroll',
  'org_demo_001',
  'lead_vidya_3',
  'usr_tc_vidya_001',
  'ENROLLED',
  'Student enrollment completed! Seat confirmed for UI/UX & Product Design.',
  '2026-08-23T19:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_4_create',
  'org_demo_001',
  'lead_vidya_4',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "Digital Marketing & Growth" (Graduate (B.Com)).',
  '2026-08-18T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_4_assign',
  'org_demo_001',
  'lead_vidya_4',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Rahul Sharma (TC_VIDYA_1) [Apni Vidya Team].',
  '2026-08-18T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_4_call_1',
  'org_demo_001',
  'lead_vidya_4',
  'usr_tc_vidya_001',
  'CALL_MADE',
  'Call completed by Rahul Sharma. Status marked: CALLBACK. Note: "In college lectures right now. Requested callback at 4:30 PM today."',
  '2026-08-23T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_5_create',
  'org_demo_001',
  'lead_vidya_5',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "UPSC & Civil Services Prep" (Graduate (BA History)).',
  '2026-08-17T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_5_assign',
  'org_demo_001',
  'lead_vidya_5',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Rahul Sharma (TC_VIDYA_1) [Apni Vidya Team].',
  '2026-08-17T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_5_call_1',
  'org_demo_001',
  'lead_vidya_5',
  'usr_tc_vidya_001',
  'CALL_MADE',
  'Call completed by Rahul Sharma. Status marked: NOT_INTERESTED. Note: "Opted for offline coaching institute in Delhi instead."',
  '2026-08-23T13:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_6_create',
  'org_demo_001',
  'lead_vidya_6',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "Python & Cloud DevOps" (Working Professional (SysAdmin)).',
  '2026-08-16T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_6_assign',
  'org_demo_001',
  'lead_vidya_6',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Priya Patel (TC_VIDYA_2) [Apni Vidya Team].',
  '2026-08-16T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_6_call_1',
  'org_demo_001',
  'lead_vidya_6',
  'usr_tc_vidya_002',
  'CALL_MADE',
  'Call completed by Priya Patel. Status marked: INTERESTED. Note: "Looking for AWS + Docker modules. Syllabus PDF sent on WhatsApp."',
  '2026-08-23T10:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_7_create',
  'org_demo_001',
  'lead_vidya_7',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "Banking & Financial Analysis" (Graduate (BBA Finance)).',
  '2026-08-15T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_7_assign',
  'org_demo_001',
  'lead_vidya_7',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Priya Patel (TC_VIDYA_2) [Apni Vidya Team].',
  '2026-08-15T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_7_call_1',
  'org_demo_001',
  'lead_vidya_7',
  'usr_tc_vidya_002',
  'CALL_MADE',
  'Call completed by Priya Patel. Status marked: DEMO. Note: "Free trial demo session link shared. Very interested in mock interview prep."',
  '2026-08-23T07:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_7_demo',
  'org_demo_001',
  'lead_vidya_7',
  'usr_tc_vidya_002',
  'DEMO_SCHEDULED',
  'Live Academic Demo class scheduled with senior mentor.',
  '2026-08-23T07:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_8_create',
  'org_demo_001',
  'lead_vidya_8',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "Data Science & Generative AI" (Post Graduate (M.Sc Stats)).',
  '2026-08-14T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_8_assign',
  'org_demo_001',
  'lead_vidya_8',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Priya Patel (TC_VIDYA_2) [Apni Vidya Team].',
  '2026-08-14T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_8_call_1',
  'org_demo_001',
  'lead_vidya_8',
  'usr_tc_vidya_002',
  'CALL_MADE',
  'Call completed by Priya Patel. Status marked: ENROLLED. Note: "Full course fee paid. Enrolled in GenAI Advanced Cohort."',
  '2026-08-23T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_8_enroll',
  'org_demo_001',
  'lead_vidya_8',
  'usr_tc_vidya_002',
  'ENROLLED',
  'Student enrollment completed! Seat confirmed for Data Science & Generative AI.',
  '2026-08-23T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_9_create',
  'org_demo_001',
  'lead_vidya_9',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "Full Stack Web Development" (12th Pass (PCM)).',
  '2026-08-13T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_9_assign',
  'org_demo_001',
  'lead_vidya_9',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Priya Patel (TC_VIDYA_2) [Apni Vidya Team].',
  '2026-08-13T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_9_call_1',
  'org_demo_001',
  'lead_vidya_9',
  'usr_tc_vidya_002',
  'CALL_MADE',
  'Call completed by Priya Patel. Status marked: RINGING. Note: "Called 2 times, phone was ringing with no answer. Scheduled retry."',
  '2026-08-23T01:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_10_create',
  'org_demo_001',
  'lead_vidya_10',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "UI/UX & Product Design" (Graduate (B.Des)).',
  '2026-08-12T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_11_create',
  'org_demo_001',
  'lead_vidya_11',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "Full Stack Web Development" (Final Year College Student).',
  '2026-08-11T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_12_create',
  'org_demo_001',
  'lead_vidya_12',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Vidya] inquiring about "Data Science & Generative AI" (Graduate (B.E. EEE)).',
  '2026-08-10T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_12_assign',
  'org_demo_001',
  'lead_vidya_12',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Vikram Malhotra (TC_DUAL_1) [Apni Vidya Team].',
  '2026-08-10T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_12_call_1',
  'org_demo_001',
  'lead_vidya_12',
  'usr_tc_dual_001',
  'CALL_MADE',
  'Call completed by Vikram Malhotra. Status marked: INTERESTED. Note: "Interested in Python + SQL foundation with AI capstone project."',
  '2026-08-22T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_1_create',
  'org_demo_001',
  'lead_estate_1',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "3 BHK Luxury High-rise" at "Bandra West, Mumbai" (Budget: ₹1.8 Cr - ₹2.5 Cr).',
  '2026-08-22T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_1_assign',
  'org_demo_001',
  'lead_estate_1',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Amit Kumar (TC_ESTATE_1) [Apni Estate Team].',
  '2026-08-22T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_1_call_1',
  'org_demo_001',
  'lead_estate_1',
  'usr_tc_estate_001',
  'CALL_MADE',
  'Call completed by Amit Kumar. Status marked: SITE_VISIT_SCHEDULED. Note: "Looking for sea-facing tower. Confirmed physical site visit with family tomorrow at 11:30 AM."',
  '2026-08-24T00:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_1_site_visit',
  'org_demo_001',
  'lead_estate_1',
  'usr_tc_estate_001',
  'SITE_VISIT_SCHEDULED',
  'Physical site visit scheduled for 2026-08-25 11:30 AM at Bandra West, Mumbai.',
  '2026-08-24T00:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_2_create',
  'org_demo_001',
  'lead_estate_2',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "Commercial Retail Shop" at "Sector 62, Noida" (Budget: ₹85 Lakhs - ₹1.2 Cr).',
  '2026-08-21T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_2_assign',
  'org_demo_001',
  'lead_estate_2',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Amit Kumar (TC_ESTATE_1) [Apni Estate Team].',
  '2026-08-21T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_2_call_1',
  'org_demo_001',
  'lead_estate_2',
  'usr_tc_estate_001',
  'CALL_MADE',
  'Call completed by Amit Kumar. Status marked: NEGOTIATING. Note: "Inspected ground floor shop unit. Currently negotiating 5% developer discount on spot booking."',
  '2026-08-23T20:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_3_create',
  'org_demo_001',
  'lead_estate_3',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "Independent Luxury Villa" at "Whitefield, Bengaluru" (Budget: ₹3.5 Cr - ₹5 Cr).',
  '2026-08-20T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_3_assign',
  'org_demo_001',
  'lead_estate_3',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Amit Kumar (TC_ESTATE_1) [Apni Estate Team].',
  '2026-08-20T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_3_call_1',
  'org_demo_001',
  'lead_estate_3',
  'usr_tc_estate_001',
  'CALL_MADE',
  'Call completed by Amit Kumar. Status marked: CLOSED. Note: "Token advance of ₹10 Lakhs received! Sale agreement draft dispatched to legal."',
  '2026-08-23T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_3_closed',
  'org_demo_001',
  'lead_estate_3',
  'usr_tc_estate_001',
  'CLOSED_DEAL',
  'Real estate booking closed successfully with token advance!',
  '2026-08-23T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_4_create',
  'org_demo_001',
  'lead_estate_4',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "2 BHK Premium Apartment" at "Cyber City, Gurugram" (Budget: ₹65 Lakhs - ₹85 Lakhs).',
  '2026-08-19T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_4_assign',
  'org_demo_001',
  'lead_estate_4',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Amit Kumar (TC_ESTATE_1) [Apni Estate Team].',
  '2026-08-19T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_4_call_1',
  'org_demo_001',
  'lead_estate_4',
  'usr_tc_estate_001',
  'CALL_MADE',
  'Call completed by Amit Kumar. Status marked: INTERESTED. Note: "Wants gated society near metro station. Floor plans sent on WhatsApp."',
  '2026-08-23T12:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_5_create',
  'org_demo_001',
  'lead_estate_5',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "Residential Plot / Land" at "OMR Road, Chennai" (Budget: ₹45 Lakhs - ₹60 Lakhs).',
  '2026-08-18T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_5_assign',
  'org_demo_001',
  'lead_estate_5',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Amit Kumar (TC_ESTATE_1) [Apni Estate Team].',
  '2026-08-18T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_5_call_1',
  'org_demo_001',
  'lead_estate_5',
  'usr_tc_estate_001',
  'CALL_MADE',
  'Call completed by Amit Kumar. Status marked: NOT_INTERESTED. Note: "Looking for DTCP approved layout inside city center. Current plots too far."',
  '2026-08-23T08:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_6_create',
  'org_demo_001',
  'lead_estate_6',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "Commercial Office Space (3000 sq.ft)" at "BKC / Kurla, Mumbai" (Budget: ₹4.5 Cr - ₹6 Cr).',
  '2026-08-17T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_6_assign',
  'org_demo_001',
  'lead_estate_6',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Sneha Rao (TC_ESTATE_2) [Apni Estate Team].',
  '2026-08-17T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_6_call_1',
  'org_demo_001',
  'lead_estate_6',
  'usr_tc_estate_002',
  'CALL_MADE',
  'Call completed by Sneha Rao. Status marked: SITE_VISIT_SCHEDULED. Note: "Corporate site visit with architect scheduled for today 5:00 PM."',
  '2026-08-23T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_6_site_visit',
  'org_demo_001',
  'lead_estate_6',
  'usr_tc_estate_002',
  'SITE_VISIT_SCHEDULED',
  'Physical site visit scheduled for 2026-08-24 05:00 PM at BKC / Kurla, Mumbai.',
  '2026-08-23T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_7_create',
  'org_demo_001',
  'lead_estate_7',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "2 BHK Smart Home" at "Hinjewadi Phase 1, Pune" (Budget: ₹55 Lakhs - ₹70 Lakhs).',
  '2026-08-16T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_7_assign',
  'org_demo_001',
  'lead_estate_7',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Sneha Rao (TC_ESTATE_2) [Apni Estate Team].',
  '2026-08-16T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_7_call_1',
  'org_demo_001',
  'lead_estate_7',
  'usr_tc_estate_002',
  'CALL_MADE',
  'Call completed by Sneha Rao. Status marked: NEGOTIATING. Note: "Liked Tower B East-facing unit. Reviewing payment milestone plan with bank loan officer."',
  '2026-08-23T00:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_8_create',
  'org_demo_001',
  'lead_estate_8',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "Studio Penthouse / Villa" at "Gachibowli Financial District, Hyderabad" (Budget: ₹2.8 Cr - ₹3.5 Cr).',
  '2026-08-15T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_8_assign',
  'org_demo_001',
  'lead_estate_8',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Sneha Rao (TC_ESTATE_2) [Apni Estate Team].',
  '2026-08-15T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_8_call_1',
  'org_demo_001',
  'lead_estate_8',
  'usr_tc_estate_002',
  'CALL_MADE',
  'Call completed by Sneha Rao. Status marked: CLOSED. Note: "Unit #1802 Penthouse booked! Bank sanction letter received."',
  '2026-08-22T20:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_8_closed',
  'org_demo_001',
  'lead_estate_8',
  'usr_tc_estate_002',
  'CLOSED_DEAL',
  'Real estate booking closed successfully with token advance!',
  '2026-08-22T20:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_9_create',
  'org_demo_001',
  'lead_estate_9',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "3 BHK High-rise Tower" at "Sarjapur Road, Bengaluru" (Budget: ₹1.2 Cr - ₹1.6 Cr).',
  '2026-08-14T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_9_assign',
  'org_demo_001',
  'lead_estate_9',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Sneha Rao (TC_ESTATE_2) [Apni Estate Team].',
  '2026-08-14T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_9_call_1',
  'org_demo_001',
  'lead_estate_9',
  'usr_tc_estate_002',
  'CALL_MADE',
  'Call completed by Sneha Rao. Status marked: RINGING. Note: "Phone rang with no response on morning call. Sent WhatsApp summary."',
  '2026-08-22T16:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_10_create',
  'org_demo_001',
  'lead_estate_10',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "3 BHK Luxury Apartment" at "Sector 150, Noida Expressway" (Budget: ₹1.1 Cr - ₹1.4 Cr).',
  '2026-08-13T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_11_create',
  'org_demo_001',
  'lead_estate_11',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "Commercial Retail / Food Court" at "Golf Course Extension, Gurugram" (Budget: ₹75 Lakhs - ₹1 Cr).',
  '2026-08-12T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_12_create',
  'org_demo_001',
  'lead_estate_12',
  'usr_admin_001',
  'CREATED',
  'Lead created for [Apni Estate] inquiring for "2 BHK Apartment" at "New Town, Kolkata" (Budget: ₹45 Lakhs - ₹60 Lakhs).',
  '2026-08-11T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_12_assign',
  'org_demo_001',
  'lead_estate_12',
  'usr_admin_001',
  'ASSIGNED',
  'Assigned to Vikram Malhotra (TC_DUAL_1) [Apni Estate Team].',
  '2026-08-11T04:19:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_12_call_1',
  'org_demo_001',
  'lead_estate_12',
  'usr_tc_dual_001',
  'CALL_MADE',
  'Call completed by Vikram Malhotra. Status marked: SITE_VISIT_SCHEDULED. Note: "Site visit confirmed with sales executive for tomorrow noon."',
  '2026-08-22T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_12_site_visit',
  'org_demo_001',
  'lead_estate_12',
  'usr_tc_dual_001',
  'SITE_VISIT_SCHEDULED',
  'Physical site visit scheduled for 2026-08-25 12:00 PM at New Town, Kolkata.',
  '2026-08-22T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_1_call_1787545203673',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'CALL_MADE',
  'Phone call by Rahul Sharma. Status: [INTERESTED] (Previous: [INTERESTED]). Note: "Smoke test call: student confirmed interest in Full Stack Web Dev."',
  '2026-08-24T04:20:03.673Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_1_fu_sched_1787545203674',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'FOLLOW_UP_CREATED',
  'Follow-up scheduled for 2026-08-25 at 03:30 PM by Rahul Sharma. Note: "Call back for fee breakdown and batch timing."',
  '2026-08-24T04:20:03.674Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_apni_vidya_imp_1787545203691_0_create',
  'org_demo_001',
  'lead_apni_vidya_imp_1787545203691_0',
  'usr_admin_001',
  'CREATED',
  'Lead imported for [Apni Vidya] via spreadsheet batch.',
  '2026-08-24T04:20:03.691Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_apni_estate_imp_1787545203691_1_create',
  'org_demo_001',
  'lead_apni_estate_imp_1787545203691_1',
  'usr_admin_001',
  'CREATED',
  'Lead imported for [Apni Estate] via spreadsheet batch.',
  '2026-08-24T04:20:03.691Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_1_call_1787545218845',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'CALL_MADE',
  'Phone call by Rahul Sharma. Status: [INTERESTED] (Previous: [INTERESTED]). Note: "Smoke test call: student confirmed interest in Full Stack Web Dev."',
  '2026-08-24T04:20:18.845Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_1_fu_sched_1787545218845',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'FOLLOW_UP_CREATED',
  'Follow-up scheduled for 2026-08-25 at 03:30 PM by Rahul Sharma. Note: "Call back for fee breakdown and batch timing."',
  '2026-08-24T04:20:18.845Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_1_fu_done_1787545218871',
  'org_demo_001',
  'lead_vidya_1',
  'usr_tc_vidya_001',
  'FOLLOW_UP_COMPLETED',
  'Follow-up marked as COMPLETED by Rahul Sharma. Note: "Follow up completed during test."',
  '2026-08-24T04:20:18.871Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_apni_vidya_imp_1787545218879_0_create',
  'org_demo_001',
  'lead_apni_vidya_imp_1787545218879_0',
  'usr_admin_001',
  'CREATED',
  'Lead imported for [Apni Vidya] via spreadsheet batch.',
  '2026-08-24T04:20:18.879Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_apni_estate_imp_1787545218879_1_create',
  'org_demo_001',
  'lead_apni_estate_imp_1787545218879_1',
  'usr_admin_001',
  'CREATED',
  'Lead imported for [Apni Estate] via spreadsheet batch.',
  '2026-08-24T04:20:18.879Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_vidya_13_0',
  'org_demo_001',
  'lead_vidya_13',
  'usr_admin_001',
  'CREATED',
  'Lead registered from Telegram Channel Ad',
  '2026-08-09T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
VALUES (
  'hist_lead_estate_13_0',
  'org_demo_001',
  'lead_estate_13',
  'usr_admin_001',
  'CREATED',
  'Lead registered from MagicBricks Form',
  '2026-08-09T04:18:13.549Z'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
