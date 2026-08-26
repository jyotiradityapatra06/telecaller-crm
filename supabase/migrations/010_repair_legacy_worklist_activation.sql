-- Fixes migration 009's legacy-audit backfill without automatically changing data.
-- Run the read-only diagnostic script first, then explicitly call the repair RPC
-- with the timestamp immediately before migration 009 was executed.

ALTER TABLE public.lead_assignments
  ADD COLUMN IF NOT EXISTS worklist_origin VARCHAR(30) NOT NULL DEFAULT 'NATIVE_WORKLIST'
  CHECK (worklist_origin IN ('NATIVE_WORKLIST', 'LEGACY_CURRENT', 'LEGACY_HISTORY'));

CREATE OR REPLACE FUNCTION public.repair_legacy_worklist_activation(
  p_org_id VARCHAR,
  p_legacy_before TIMESTAMPTZ,
  p_apply BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_candidates INTEGER; v_changed INTEGER := 0;
BEGIN
  -- Only rows created before migration 009 are eligible. Rows created by the new
  -- multi-worklist RPC remain untouched even when leads.assigned_to differs.
  SELECT count(*) INTO v_candidates
  FROM lead_assignments a
  JOIN leads l ON l.organization_id=a.organization_id AND l.id=a.lead_id
  WHERE a.organization_id=p_org_id AND a.created_at < p_legacy_before
    AND a.assigned_to IS NOT NULL AND a.is_active
    AND a.assigned_to IS DISTINCT FROM l.assigned_to;

  IF p_apply THEN
    UPDATE lead_assignments a SET is_active=FALSE, worklist_origin='LEGACY_HISTORY', updated_at=NOW()
    FROM leads l
    WHERE l.organization_id=a.organization_id AND l.id=a.lead_id
      AND a.organization_id=p_org_id AND a.created_at < p_legacy_before
      AND a.assigned_to IS NOT NULL AND a.is_active
      AND a.assigned_to IS DISTINCT FROM l.assigned_to;
    GET DIAGNOSTICS v_changed = ROW_COUNT;

    UPDATE lead_assignments a SET worklist_origin='LEGACY_CURRENT', updated_at=NOW()
    FROM leads l
    WHERE l.organization_id=a.organization_id AND l.id=a.lead_id
      AND a.organization_id=p_org_id AND a.created_at < p_legacy_before
      AND a.assigned_to=l.assigned_to AND a.is_active;
  END IF;
  RETURN jsonb_build_object('candidateCount',v_candidates,'deactivatedCount',v_changed,'applied',p_apply);
END $$;

REVOKE EXECUTE ON FUNCTION public.repair_legacy_worklist_activation(VARCHAR,TIMESTAMPTZ,BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.repair_legacy_worklist_activation(VARCHAR,TIMESTAMPTZ,BOOLEAN) TO service_role;

-- Make the selected-caller check explicit. The unique index still supplies the
-- concurrency guarantee for exactly (organization, lead, selected telecaller).
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
    IF length(v_phone) <> 10 OR COALESCE(trim(r->>'name'),'') = '' OR v_brand NOT IN ('APNI_VIDYA','APNI_ESTATE') THEN v_invalid := v_invalid+1; CONTINUE; END IF;
    IF (SELECT brand_access FROM users WHERE id=p_telecaller_id AND organization_id=p_org_id) <> v_brand THEN RAISE EXCEPTION 'Imported lead brand must match selected telecaller brand'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_org_id||':'||v_brand||':'||v_phone,0));
    SELECT id INTO v_lead_id FROM leads WHERE organization_id=p_org_id AND brand=v_brand AND right(regexp_replace(phone,'\D','','g'),10)=v_phone ORDER BY created_at,id LIMIT 1 FOR UPDATE;
    IF v_lead_id IS NULL THEN
      v_lead_id := 'lead_'||encode(extensions.gen_random_bytes(12),'hex');
      INSERT INTO leads (id,organization_id,name,phone,email,city,source,brand,course_interest,qualification,preferred_batch,property_type,budget,preferred_location,site_visit_date,product_interest,notes,created_at,updated_at)
      VALUES (v_lead_id,p_org_id,trim(r->>'name'),v_phone,NULLIF(trim(r->>'email'),''),NULLIF(trim(r->>'city'),''),COALESCE(NULLIF(trim(r->>'source'),''),'Excel/CSV Import'),v_brand,NULLIF(trim(r->>'courseInterest'),''),NULLIF(trim(r->>'qualification'),''),NULLIF(trim(r->>'preferredBatch'),''),NULLIF(trim(r->>'propertyType'),''),NULLIF(trim(r->>'budget'),''),NULLIF(trim(r->>'preferredLocation'),''),NULLIF(trim(r->>'siteVisitDate'),''),COALESCE(NULLIF(trim(r->>'productInterest'),''),NULLIF(trim(r->>'courseInterest'),''),NULLIF(trim(r->>'propertyType'),'')),NULLIF(trim(r->>'notes'),''),v_now,v_now);
      v_new := v_new+1;
    ELSE v_reused := v_reused+1; END IF;

    IF EXISTS (SELECT 1 FROM lead_assignments WHERE organization_id=p_org_id AND lead_id=v_lead_id AND assigned_to=p_telecaller_id AND is_active) THEN
      v_skipped := v_skipped+1;
    ELSE
      INSERT INTO lead_assignments (id,organization_id,lead_id,assigned_to,assigned_by,assignment_type,is_active,status,worklist_origin,created_at,updated_at)
      VALUES ('asgn_'||encode(extensions.gen_random_bytes(12),'hex'),p_org_id,v_lead_id,p_telecaller_id,p_admin_id,'ASSIGNED',TRUE,'NEW','NATIVE_WORKLIST',v_now,v_now)
      ON CONFLICT (organization_id,lead_id,assigned_to) WHERE assigned_to IS NOT NULL AND is_active DO NOTHING;
      IF FOUND THEN v_assigned:=v_assigned+1; ELSE v_skipped:=v_skipped+1; END IF;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('totalRows',jsonb_array_length(p_rows),'assignedCount',v_assigned,'newContactsCreated',v_new,'existingContactsReused',v_reused,'alreadyAssignedCount',v_skipped,'invalidCount',v_invalid,'existingAssignmentsModified',0);
END $$;

REVOKE EXECUTE ON FUNCTION public.import_leads_for_telecaller_atomic(VARCHAR,VARCHAR,VARCHAR,JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_leads_for_telecaller_atomic(VARCHAR,VARCHAR,VARCHAR,JSONB) TO service_role;
