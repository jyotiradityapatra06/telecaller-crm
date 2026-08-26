-- A lead is a shared contact; lead_assignments are independent telecaller work items.
-- This migration is idempotent and preserves all historical assignment rows.

ALTER TABLE public.lead_assignments
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_calls_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Old audit rows may contain repeats. Keep the newest active work item per caller.
WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY organization_id, lead_id, assigned_to
    ORDER BY created_at DESC, id DESC
  ) AS rn
  FROM public.lead_assignments
  WHERE assigned_to IS NOT NULL AND is_active
)
UPDATE public.lead_assignments a
SET is_active = FALSE, updated_at = NOW()
FROM ranked r
WHERE a.id = r.id AND r.rn > 1;

UPDATE public.lead_assignments a
SET status=l.status, notes=l.notes, last_call_at=l.last_call_at,
    next_follow_up_at=l.next_follow_up_at, total_calls_count=l.total_calls_count,
    updated_at=NOW()
FROM public.leads l
WHERE a.organization_id=l.organization_id AND a.lead_id=l.id
  AND a.assigned_to=l.assigned_to AND a.is_active;

CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_assignments_active_work_item
  ON public.lead_assignments (organization_id, lead_id, assigned_to)
  WHERE assigned_to IS NOT NULL AND is_active;

CREATE INDEX IF NOT EXISTS idx_lead_assignments_worklist
  ON public.lead_assignments (organization_id, assigned_to, is_active, status);

CREATE OR REPLACE FUNCTION public.sync_call_to_work_item() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE lead_assignments SET status=NEW.status, notes=COALESCE(NEW.note,notes),
    last_call_at=NEW.called_at, total_calls_count=total_calls_count+1, updated_at=NOW()
  WHERE organization_id=NEW.organization_id AND lead_id=NEW.lead_id
    AND assigned_to=NEW.telecaller_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Caller has no active assignment for this lead'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sync_call_to_work_item ON public.call_activities;
CREATE TRIGGER trg_sync_call_to_work_item AFTER INSERT ON public.call_activities
FOR EACH ROW EXECUTE FUNCTION public.sync_call_to_work_item();

CREATE OR REPLACE FUNCTION public.sync_follow_up_to_work_item() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE lead_assignments SET
    next_follow_up_at = CASE WHEN NEW.status IN ('COMPLETED','CANCELLED') THEN NULL ELSE NEW.scheduled_at END,
    updated_at=NOW()
  WHERE organization_id=NEW.organization_id AND lead_id=NEW.lead_id
    AND assigned_to=NEW.telecaller_id AND is_active;
  IF NOT FOUND AND TG_OP = 'INSERT' AND NEW.telecaller_id IS NOT NULL THEN
    RAISE EXCEPTION 'Telecaller has no active assignment for this lead';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sync_follow_up_to_work_item ON public.follow_ups;
CREATE TRIGGER trg_sync_follow_up_to_work_item AFTER INSERT OR UPDATE OF status, scheduled_at ON public.follow_ups
FOR EACH ROW EXECUTE FUNCTION public.sync_follow_up_to_work_item();

-- Existing installations may already contain duplicate master contacts, so this
-- migration does not destructively merge them. The import RPC serializes each
-- normalized org/brand/phone key and always reuses the first existing contact.

CREATE OR REPLACE FUNCTION public.import_leads_for_telecaller_atomic(
  p_org_id VARCHAR, p_admin_id VARCHAR, p_telecaller_id VARCHAR, p_rows JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  r JSONB; v_lead_id VARCHAR; v_phone VARCHAR; v_brand VARCHAR; v_now TIMESTAMPTZ := NOW();
  v_new INTEGER := 0; v_reused INTEGER := 0; v_assigned INTEGER := 0; v_skipped INTEGER := 0; v_invalid INTEGER := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id=p_telecaller_id AND organization_id=p_org_id AND role='TELECALLER' AND is_active) THEN
    RAISE EXCEPTION 'Target telecaller is invalid, inactive, or outside the organization';
  END IF;
  FOR r IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_phone := right(regexp_replace(COALESCE(r->>'phone',''), '\D', '', 'g'), 10);
    v_brand := COALESCE(r->>'brand', (SELECT brand_access FROM users WHERE id=p_telecaller_id AND organization_id=p_org_id));
    IF length(v_phone) <> 10 OR COALESCE(trim(r->>'name'),'') = '' OR v_brand NOT IN ('APNI_VIDYA','APNI_ESTATE') THEN
      v_invalid := v_invalid + 1; CONTINUE;
    END IF;
    IF (SELECT brand_access FROM users WHERE id=p_telecaller_id AND organization_id=p_org_id) <> v_brand THEN
      RAISE EXCEPTION 'Imported lead brand must match selected telecaller brand';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_org_id || ':' || v_brand || ':' || v_phone, 0));
    SELECT id INTO v_lead_id FROM leads
      WHERE organization_id=p_org_id AND brand=v_brand
        AND right(regexp_replace(phone, '\D', '', 'g'),10)=v_phone LIMIT 1 FOR UPDATE;
    IF v_lead_id IS NULL THEN
      v_lead_id := 'lead_' || encode(extensions.gen_random_bytes(12),'hex');
      INSERT INTO leads (id,organization_id,name,phone,email,city,source,brand,course_interest,qualification,preferred_batch,property_type,budget,preferred_location,site_visit_date,product_interest,notes,created_at,updated_at)
      VALUES (v_lead_id,p_org_id,trim(r->>'name'),v_phone,NULLIF(trim(r->>'email'),''),NULLIF(trim(r->>'city'),''),COALESCE(NULLIF(trim(r->>'source'),''),'Excel/CSV Import'),v_brand,NULLIF(trim(r->>'courseInterest'),''),NULLIF(trim(r->>'qualification'),''),NULLIF(trim(r->>'preferredBatch'),''),NULLIF(trim(r->>'propertyType'),''),NULLIF(trim(r->>'budget'),''),NULLIF(trim(r->>'preferredLocation'),''),NULLIF(trim(r->>'siteVisitDate'),''),COALESCE(NULLIF(trim(r->>'productInterest'),''),NULLIF(trim(r->>'courseInterest'),''),NULLIF(trim(r->>'propertyType'),'')),NULLIF(trim(r->>'notes'),''),v_now,v_now)
      ON CONFLICT DO NOTHING;
      IF NOT FOUND THEN
        SELECT id INTO v_lead_id FROM leads WHERE organization_id=p_org_id AND brand=v_brand AND right(regexp_replace(phone,'\D','','g'),10)=v_phone LIMIT 1;
        v_reused := v_reused + 1;
      ELSE v_new := v_new + 1; END IF;
    ELSE v_reused := v_reused + 1; END IF;
    INSERT INTO lead_assignments (id,organization_id,lead_id,assigned_to,assigned_by,assignment_type,is_active,status,created_at,updated_at)
    VALUES ('asgn_'||encode(extensions.gen_random_bytes(12),'hex'),p_org_id,v_lead_id,p_telecaller_id,p_admin_id,'ASSIGNED',TRUE,'NEW',v_now,v_now)
    ON CONFLICT (organization_id,lead_id,assigned_to) WHERE assigned_to IS NOT NULL AND is_active DO NOTHING;
    IF FOUND THEN v_assigned := v_assigned + 1; ELSE v_skipped := v_skipped + 1; END IF;
  END LOOP;
  RETURN jsonb_build_object('totalRows',jsonb_array_length(p_rows),'assignedCount',v_assigned,'newContactsCreated',v_new,
    'existingContactsReused',v_reused,'alreadyAssignedCount',v_skipped,'invalidCount',v_invalid,'existingAssignmentsModified',0);
END $$;

REVOKE EXECUTE ON FUNCTION public.import_leads_for_telecaller_atomic(VARCHAR,VARCHAR,VARCHAR,JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_leads_for_telecaller_atomic(VARCHAR,VARCHAR,VARCHAR,JSONB) TO service_role;
