-- ==============================================================================
-- TeleCaller CRM Enterprise — Migration 008: Fix Lead Assignment RPC pgcrypto
-- Schema qualification of extensions.gen_random_bytes() under hardened search_path
-- ==============================================================================

BEGIN;

-- 1. ATOMIC LEAD ASSIGNMENT (FIXED pgcrypto QUALIFICATION)
CREATE OR REPLACE FUNCTION assign_leads_atomic(
  p_org_id VARCHAR,
  p_lead_ids VARCHAR[],
  p_telecaller_id VARCHAR,
  p_admin_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_lead_id VARCHAR;
  v_admin_name VARCHAR;
  v_tc_name VARCHAR;
  v_tc_brand VARCHAR;
  v_prev_tc_name VARCHAR;
  v_now TIMESTAMPTZ := NOW();
  v_assigned_count INTEGER := 0;
  v_updated_lead_ids VARCHAR[] := ARRAY[]::VARCHAR[];
BEGIN
  -- Validate Admin
  SELECT name INTO v_admin_name FROM public.users WHERE organization_id = p_org_id AND id = p_admin_id;
  IF v_admin_name IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Admin user not found in organization.';
  END IF;

  -- Validate Telecaller if assigning
  IF p_telecaller_id IS NOT NULL THEN
    SELECT name, brand_access INTO v_tc_name, v_tc_brand FROM public.users WHERE organization_id = p_org_id AND id = p_telecaller_id;
    IF v_tc_name IS NULL THEN
      RAISE EXCEPTION 'Target telecaller not found in organization.';
    END IF;
  ELSE
    v_tc_name := NULL;
  END IF;

  -- Process each lead in transaction
  FOREACH v_lead_id IN ARRAY p_lead_ids
  LOOP
    -- Lock row for concurrency protection
    PERFORM 1 FROM public.leads WHERE organization_id = p_org_id AND id = v_lead_id FOR UPDATE;

    SELECT u.name INTO v_prev_tc_name
    FROM public.leads l
    LEFT JOIN public.users u ON u.id = l.assigned_to
    WHERE l.organization_id = p_org_id AND l.id = v_lead_id;

    IF v_prev_tc_name IS NULL THEN
      v_prev_tc_name := 'Unassigned';
    END IF;

    -- Update lead
    UPDATE public.leads
    SET assigned_to = p_telecaller_id,
        updated_at = v_now
    WHERE organization_id = p_org_id AND id = v_lead_id;

    -- Insert assignment record
    INSERT INTO public.lead_assignments (
      id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at
    ) VALUES (
      'asgn_' || encode(extensions.gen_random_bytes(8), 'hex'),
      p_org_id,
      v_lead_id,
      p_telecaller_id,
      p_admin_id,
      CASE WHEN p_telecaller_id IS NOT NULL THEN 'ASSIGNED' ELSE 'UNASSIGNED' END,
      v_now
    );

    -- Insert history audit
    INSERT INTO public.lead_history (
      id, organization_id, lead_id, user_id, action, description, timestamp
    ) VALUES (
      'hist_' || encode(extensions.gen_random_bytes(8), 'hex'),
      p_org_id,
      v_lead_id,
      p_admin_id,
      CASE WHEN p_telecaller_id IS NOT NULL THEN 'ASSIGNED' ELSE 'REASSIGNED' END,
      CASE WHEN p_telecaller_id IS NOT NULL
        THEN 'Lead assigned to ' || v_tc_name || ' [Brand Access: ' || COALESCE(v_tc_brand, 'BOTH') || '] by ' || v_admin_name || '. Previous: ' || v_prev_tc_name || '.'
        ELSE 'Lead returned to Unassigned Pool by ' || v_admin_name || '.'
      END,
      v_now
    );

    v_assigned_count := v_assigned_count + 1;
    v_updated_lead_ids := array_append(v_updated_lead_ids, v_lead_id);
  END LOOP;

  RETURN jsonb_build_object(
    'assignedCount', v_assigned_count,
    'leadIds', to_jsonb(v_updated_lead_ids)
  );
END;
$$;


-- 2. ATOMIC AUTO DISTRIBUTION (FIXED pgcrypto QUALIFICATION)
CREATE OR REPLACE FUNCTION auto_distribute_leads_atomic(
  p_org_id VARCHAR,
  p_brand_filter VARCHAR,
  p_admin_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_admin_name VARCHAR;
  v_now TIMESTAMPTZ := NOW();
  v_vidya_count INTEGER := 0;
  v_estate_count INTEGER := 0;
  v_lead_rec RECORD;
  v_vidya_callers VARCHAR[];
  v_vidya_names VARCHAR[];
  v_estate_callers VARCHAR[];
  v_estate_names VARCHAR[];
  v_caller_idx INTEGER := 0;
  v_target_id VARCHAR;
  v_target_name VARCHAR;
BEGIN
  -- Validate Admin
  SELECT name INTO v_admin_name FROM public.users WHERE organization_id = p_org_id AND id = p_admin_id;
  IF v_admin_name IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Admin user not found in organization.';
  END IF;

  -- 1. Distribute Apni Vidya
  IF p_brand_filter IS NULL OR p_brand_filter = 'ALL' OR p_brand_filter = 'APNI_VIDYA' THEN
    SELECT array_agg(id), array_agg(name) INTO v_vidya_callers, v_vidya_names
    FROM public.users
    WHERE organization_id = p_org_id AND role = 'TELECALLER' AND is_active = TRUE AND brand_access IN ('APNI_VIDYA', 'BOTH');

    IF v_vidya_callers IS NOT NULL AND array_length(v_vidya_callers, 1) > 0 THEN
      v_caller_idx := 0;
      FOR v_lead_rec IN
        SELECT id FROM public.leads
        WHERE organization_id = p_org_id AND brand = 'APNI_VIDYA' AND assigned_to IS NULL
        FOR UPDATE SKIP LOCKED
      LOOP
        v_target_id := v_vidya_callers[(v_caller_idx % array_length(v_vidya_callers, 1)) + 1];
        v_target_name := v_vidya_names[(v_caller_idx % array_length(v_vidya_callers, 1)) + 1];

        UPDATE public.leads SET assigned_to = v_target_id, updated_at = v_now WHERE id = v_lead_rec.id;

        INSERT INTO public.lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
        VALUES ('asgn_' || encode(extensions.gen_random_bytes(8), 'hex'), p_org_id, v_lead_rec.id, v_target_id, p_admin_id, 'ASSIGNED', v_now);

        INSERT INTO public.lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
        VALUES ('hist_' || encode(extensions.gen_random_bytes(8), 'hex'), p_org_id, v_lead_rec.id, p_admin_id, 'ASSIGNED',
                'Auto-routed to ' || v_target_name || ' via Apni Vidya Distribution Engine.', v_now);

        v_vidya_count := v_vidya_count + 1;
        v_caller_idx := v_caller_idx + 1;
      END LOOP;
    END IF;
  END IF;

  -- 2. Distribute Apni Estate
  IF p_brand_filter IS NULL OR p_brand_filter = 'ALL' OR p_brand_filter = 'APNI_ESTATE' THEN
    SELECT array_agg(id), array_agg(name) INTO v_estate_callers, v_estate_names
    FROM public.users
    WHERE organization_id = p_org_id AND role = 'TELECALLER' AND is_active = TRUE AND brand_access IN ('APNI_ESTATE', 'BOTH');

    IF v_estate_callers IS NOT NULL AND array_length(v_estate_callers, 1) > 0 THEN
      v_caller_idx := 0;
      FOR v_lead_rec IN
        SELECT id FROM public.leads
        WHERE organization_id = p_org_id AND brand = 'APNI_ESTATE' AND assigned_to IS NULL
        FOR UPDATE SKIP LOCKED
      LOOP
        v_target_id := v_estate_callers[(v_caller_idx % array_length(v_estate_callers, 1)) + 1];
        v_target_name := v_estate_names[(v_caller_idx % array_length(v_estate_callers, 1)) + 1];

        UPDATE public.leads SET assigned_to = v_target_id, updated_at = v_now WHERE id = v_lead_rec.id;

        INSERT INTO public.lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
        VALUES ('asgn_' || encode(extensions.gen_random_bytes(8), 'hex'), p_org_id, v_lead_rec.id, v_target_id, p_admin_id, 'ASSIGNED', v_now);

        INSERT INTO public.lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
        VALUES ('hist_' || encode(extensions.gen_random_bytes(8), 'hex'), p_org_id, v_lead_rec.id, p_admin_id, 'ASSIGNED',
                'Auto-routed to ' || v_target_name || ' via Apni Estate Distribution Engine.', v_now);

        v_estate_count := v_estate_count + 1;
        v_caller_idx := v_caller_idx + 1;
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'vidyaAssigned', v_vidya_count,
    'estateAssigned', v_estate_count,
    'totalAssigned', v_vidya_count + v_estate_count,
    'message', 'Automated distribution complete: ' || v_vidya_count || ' Vidya leads and ' || v_estate_count || ' Estate leads routed.'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION assign_leads_atomic(VARCHAR, VARCHAR[], VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION assign_leads_atomic(VARCHAR, VARCHAR[], VARCHAR, VARCHAR) TO service_role;

REVOKE EXECUTE ON FUNCTION auto_distribute_leads_atomic(VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION auto_distribute_leads_atomic(VARCHAR, VARCHAR, VARCHAR) TO service_role;

COMMIT;
