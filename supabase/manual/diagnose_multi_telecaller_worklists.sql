-- READ ONLY. Replace the values in params; this script never updates data.
WITH params AS (
  SELECT 'YOUR_ORGANIZATION_ID'::varchar AS org_id,
         'TEJASRI'::varchar AS tejasri_login,
         'PRIYA'::varchar AS priya_login
)
SELECT u.id,u.login_id,u.name,u.organization_id,u.brand_access,u.is_active
FROM users u,params p WHERE u.organization_id=p.org_id
ORDER BY u.role,u.name;

WITH params AS (SELECT 'YOUR_ORGANIZATION_ID'::varchar org_id)
SELECT a.assigned_to,u.login_id,u.name,count(*) AS active_worklist_items
FROM lead_assignments a LEFT JOIN users u ON u.id=a.assigned_to AND u.organization_id=a.organization_id,params p
WHERE a.organization_id=p.org_id AND a.is_active AND a.assigned_to IS NOT NULL
GROUP BY a.assigned_to,u.login_id,u.name ORDER BY active_worklist_items DESC;

WITH params AS (SELECT 'YOUR_ORGANIZATION_ID'::varchar org_id,'TEJASRI'::varchar login_id)
SELECT count(*) AS tejasri_active_assignments
FROM lead_assignments a JOIN users u ON u.id=a.assigned_to AND u.organization_id=a.organization_id,params p
WHERE a.organization_id=p.org_id AND a.is_active AND upper(u.login_id)=upper(p.login_id);

WITH params AS (SELECT 'YOUR_ORGANIZATION_ID'::varchar org_id,'PRIYA'::varchar login_id)
SELECT count(*) AS priya_active_assignments
FROM lead_assignments a JOIN users u ON u.id=a.assigned_to AND u.organization_id=a.organization_id,params p
WHERE a.organization_id=p.org_id AND a.is_active AND upper(u.login_id)=upper(p.login_id);

-- Put the 100 normalized ten-digit numbers in uploaded_phones.
WITH params AS (SELECT 'YOUR_ORGANIZATION_ID'::varchar org_id),
uploaded_phones(phone) AS (VALUES ('9876543210'::text),('REPLACE_ME'::text))
SELECT right(regexp_replace(l.phone,'\D','','g'),10) normalized_phone,l.id lead_id,l.brand,
       l.assigned_to legacy_owner_id,a.assigned_to worklist_owner_id,u.login_id,u.name,a.is_active,a.created_at,a.updated_at
FROM leads l JOIN uploaded_phones p ON p.phone=right(regexp_replace(l.phone,'\D','','g'),10)
LEFT JOIN lead_assignments a ON a.organization_id=l.organization_id AND a.lead_id=l.id
LEFT JOIN users u ON u.organization_id=a.organization_id AND u.id=a.assigned_to,params x
WHERE l.organization_id=x.org_id ORDER BY normalized_phone,a.is_active DESC,u.name;

WITH params AS (SELECT 'YOUR_ORGANIZATION_ID'::varchar org_id)
SELECT organization_id,lead_id,assigned_to,count(*) active_duplicates
FROM lead_assignments,params p WHERE organization_id=p.org_id AND is_active AND assigned_to IS NOT NULL
GROUP BY organization_id,lead_id,assigned_to HAVING count(*)>1;

-- Reveals migration-009 false-active candidates. Inspect timestamps to choose
-- p_legacy_before: it must be after old audit rows and before the first 009 upload.
WITH params AS (SELECT 'YOUR_ORGANIZATION_ID'::varchar org_id)
SELECT date_trunc('second',updated_at) likely_migration_009_time,count(*) rows_touched
FROM lead_assignments,params p
WHERE organization_id=p.org_id AND updated_at > created_at + interval '1 second'
GROUP BY date_trunc('second',updated_at) ORDER BY rows_touched DESC,likely_migration_009_time DESC;

WITH params AS (SELECT 'YOUR_ORGANIZATION_ID'::varchar org_id)
SELECT a.id,a.lead_id,a.assigned_to,u.login_id,u.name,l.assigned_to legacy_current_owner,
       a.assignment_type,a.is_active,a.created_at,a.updated_at
FROM lead_assignments a JOIN leads l ON l.organization_id=a.organization_id AND l.id=a.lead_id
LEFT JOIN users u ON u.organization_id=a.organization_id AND u.id=a.assigned_to,params p
WHERE a.organization_id=p.org_id AND a.is_active AND a.assigned_to IS DISTINCT FROM l.assigned_to
ORDER BY a.created_at,a.lead_id;
