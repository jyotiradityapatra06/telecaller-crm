-- ==============================================================================
-- TeleCaller CRM Enterprise — Migration 006: Fix RPC pgcrypto Resolution
-- Schema qualification of extensions.gen_random_bytes() under hardened search_path
-- ==============================================================================

BEGIN;

-- 1. ATOMIC CALL LOGGING & STATUS UPDATE (FIXED pgcrypto QUALIFICATION)
CREATE OR REPLACE FUNCTION record_call_activity_atomic(
  p_org_id VARCHAR,
  p_lead_id VARCHAR,
  p_telecaller_id VARCHAR,
  p_status VARCHAR,
  p_note TEXT,
  p_duration_seconds INTEGER,
  p_call_type VARCHAR,
  p_custom_fields JSONB,
  p_follow_up JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lead_rec RECORD;
  v_tc_name VARCHAR;
  v_call_id VARCHAR;
  v_fu_id VARCHAR := NULL;
  v_now TIMESTAMPTZ := NOW();
  v_due_date DATE;
  v_due_time VARCHAR;
  v_fu_note TEXT;
  v_fu_status VARCHAR;
BEGIN
  -- Lock Lead Row
  SELECT * INTO v_lead_rec FROM public.leads WHERE organization_id = p_org_id AND id = p_lead_id FOR UPDATE;
  IF v_lead_rec.id IS NULL THEN
    RAISE EXCEPTION 'Lead with ID % not found in organization.', p_lead_id;
  END IF;

  -- Validate Telecaller
  SELECT name INTO v_tc_name FROM public.users WHERE organization_id = p_org_id AND id = p_telecaller_id;
  IF v_tc_name IS NULL THEN
    RAISE EXCEPTION 'Telecaller with ID % not found in organization.', p_telecaller_id;
  END IF;

  -- 1. Insert Call Activity
  v_call_id := 'call_' || encode(extensions.gen_random_bytes(8), 'hex');
  INSERT INTO public.call_activities (
    id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at
  ) VALUES (
    v_call_id, p_org_id, p_lead_id, p_telecaller_id, p_status, p_note, v_now, COALESCE(p_duration_seconds, 0), COALESCE(p_call_type, 'CALL'), v_now
  );

  -- 2. Update Lead Fields
  UPDATE public.leads SET
    status = p_status,
    last_call_at = v_now,
    last_call_timestamp = TO_CHAR(v_now, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    total_calls_count = COALESCE(v_lead_rec.total_calls_count, 0) + 1,
    notes = COALESCE(p_note, notes),
    course_interest = COALESCE(p_custom_fields->>'courseInterest', course_interest),
    qualification = COALESCE(p_custom_fields->>'qualification', qualification),
    preferred_batch = COALESCE(p_custom_fields->>'preferredBatch', preferred_batch),
    property_type = COALESCE(p_custom_fields->>'propertyType', property_type),
    budget = COALESCE(p_custom_fields->>'budget', budget),
    preferred_location = COALESCE(p_custom_fields->>'preferredLocation', preferred_location),
    site_visit_date = COALESCE(p_custom_fields->>'siteVisitDate', site_visit_date),
    updated_at = v_now
  WHERE organization_id = p_org_id AND id = p_lead_id;

  -- 3. Insert Call History
  INSERT INTO public.lead_history (
    id, organization_id, lead_id, user_id, action, description, timestamp
  ) VALUES (
    'hist_' || encode(extensions.gen_random_bytes(8), 'hex'),
    p_org_id,
    p_lead_id,
    p_telecaller_id,
    'CALL_MADE',
    (CASE WHEN p_call_type = 'WHATSAPP' THEN 'WhatsApp outreach' ELSE 'Phone call' END) || ' by ' || v_tc_name || '. Status: [' || p_status || '] (Previous: [' || v_lead_rec.status || ']).' || (CASE WHEN p_note IS NOT NULL THEN ' Note: "' || p_note || '"' ELSE '' END),
    v_now
  );

  -- 4. Embedded Follow-up
  IF p_follow_up IS NOT NULL AND p_follow_up->>'dueDate' IS NOT NULL THEN
    v_due_date := (p_follow_up->>'dueDate')::DATE;
    v_due_time := COALESCE(p_follow_up->>'dueTime', '04:00 PM');
    v_fu_note := COALESCE(p_follow_up->>'note', p_note);
    v_fu_status := CASE WHEN v_due_date < CURRENT_DATE THEN 'OVERDUE' ELSE 'PENDING' END;
    v_fu_id := 'fu_' || encode(extensions.gen_random_bytes(8), 'hex');

    INSERT INTO public.follow_ups (
      id, organization_id, lead_id, telecaller_id, scheduled_at, due_date, due_time, note, status, created_at
    ) VALUES (
      v_fu_id, p_org_id, p_lead_id, p_telecaller_id, v_due_date || 'T' || v_due_time, v_due_date, v_due_time, v_fu_note, v_fu_status, v_now
    );

    UPDATE public.leads SET next_follow_up_at = v_now WHERE organization_id = p_org_id AND id = p_lead_id;
  END IF;

  -- 5. Special Milestones History
  IF p_status = 'ENROLLED' THEN
    INSERT INTO public.lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
    VALUES ('hist_' || encode(extensions.gen_random_bytes(8), 'hex'), p_org_id, p_lead_id, p_telecaller_id, 'ENROLLED', 'Student admission confirmed & enrolled!', v_now);
  ELSIF p_status = 'SITE_VISIT_SCHEDULED' THEN
    INSERT INTO public.lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
    VALUES ('hist_' || encode(extensions.gen_random_bytes(8), 'hex'), p_org_id, p_lead_id, p_telecaller_id, 'SITE_VISIT_SCHEDULED', 'Physical site visit booked!', v_now);
  ELSIF p_status = 'CLOSED' THEN
    INSERT INTO public.lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
    VALUES ('hist_' || encode(extensions.gen_random_bytes(8), 'hex'), p_org_id, p_lead_id, p_telecaller_id, 'CLOSED_DEAL', 'Real estate deal closed successfully!', v_now);
  END IF;

  RETURN jsonb_build_object(
    'callActivityId', v_call_id,
    'followUpId', v_fu_id,
    'leadId', p_lead_id
  );
END;
$$;


-- 2. ATOMIC FOLLOW-UP CREATION (FIXED pgcrypto QUALIFICATION)
CREATE OR REPLACE FUNCTION schedule_follow_up_atomic(
  p_org_id VARCHAR,
  p_lead_id VARCHAR,
  p_telecaller_id VARCHAR,
  p_due_date DATE,
  p_due_time VARCHAR,
  p_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fu_id VARCHAR := 'fu_' || encode(extensions.gen_random_bytes(8), 'hex');
  v_now TIMESTAMPTZ := NOW();
  v_tc_name VARCHAR;
  v_status VARCHAR;
BEGIN
  SELECT name INTO v_tc_name FROM public.users WHERE organization_id = p_org_id AND id = p_telecaller_id;
  IF v_tc_name IS NULL THEN
    RAISE EXCEPTION 'Telecaller with ID % not found.', p_telecaller_id;
  END IF;

  v_status := CASE WHEN p_due_date < CURRENT_DATE THEN 'OVERDUE' ELSE 'PENDING' END;

  INSERT INTO public.follow_ups (
    id, organization_id, lead_id, telecaller_id, scheduled_at, due_date, due_time, note, status, created_at
  ) VALUES (
    v_fu_id, p_org_id, p_lead_id, p_telecaller_id, p_due_date || 'T' || COALESCE(p_due_time, '04:00 PM'), p_due_date, COALESCE(p_due_time, '04:00 PM'), p_note, v_status, v_now
  );

  UPDATE public.leads SET next_follow_up_at = v_now, updated_at = v_now WHERE organization_id = p_org_id AND id = p_lead_id;

  INSERT INTO public.lead_history (
    id, organization_id, lead_id, user_id, action, description, timestamp
  ) VALUES (
    'hist_' || encode(extensions.gen_random_bytes(8), 'hex'),
    p_org_id, p_lead_id, p_telecaller_id, 'FOLLOW_UP_CREATED',
    'Follow-up scheduled for ' || p_due_date || ' at ' || COALESCE(p_due_time, '04:00 PM') || ' by ' || v_tc_name || '.',
    v_now
  );

  RETURN jsonb_build_object('followUpId', v_fu_id);
END;
$$;


-- 3. ATOMIC FOLLOW-UP COMPLETION (FIXED pgcrypto QUALIFICATION)
CREATE OR REPLACE FUNCTION complete_follow_up_atomic(
  p_org_id VARCHAR,
  p_follow_up_id VARCHAR,
  p_user_id VARCHAR,
  p_user_role VARCHAR,
  p_completion_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fu_rec RECORD;
  v_lead_rec RECORD;
  v_user_name VARCHAR;
  v_now TIMESTAMPTZ := NOW();
  v_updated_note TEXT;
BEGIN
  -- 1. Lock follow-up record
  SELECT * INTO v_fu_rec FROM public.follow_ups WHERE organization_id = p_org_id AND id = p_follow_up_id FOR UPDATE;
  IF v_fu_rec.id IS NULL THEN
    RAISE EXCEPTION 'Follow-up with ID % not found or access denied.', p_follow_up_id;
  END IF;

  -- 2. Strictly enforce telecaller ownership at RPC database level for non-admins
  IF p_user_role IS NULL OR p_user_role != 'ADMIN' THEN
    IF v_fu_rec.telecaller_id IS NULL OR v_fu_rec.telecaller_id != p_user_id THEN
      RAISE EXCEPTION 'Forbidden: You are not authorized to complete this follow-up.';
    END IF;

    SELECT * INTO v_lead_rec FROM public.leads WHERE organization_id = p_org_id AND id = v_fu_rec.lead_id;
    IF v_lead_rec.id IS NULL OR (v_lead_rec.assigned_to IS DISTINCT FROM p_user_id) THEN
      RAISE EXCEPTION 'Forbidden: Associated lead is assigned to another telecaller.';
    END IF;
  END IF;

  SELECT name INTO v_user_name FROM public.users WHERE organization_id = p_org_id AND id = p_user_id;
  IF v_user_name IS NULL THEN
    v_user_name := 'Master Admin';
  END IF;

  v_updated_note := CASE
    WHEN p_completion_note IS NOT NULL AND v_fu_rec.note IS NOT NULL THEN v_fu_rec.note || ' | Completion Note: ' || p_completion_note
    WHEN p_completion_note IS NOT NULL THEN 'Completion Note: ' || p_completion_note
    ELSE v_fu_rec.note
  END;

  UPDATE public.follow_ups SET
    status = 'COMPLETED',
    completed_at = v_now,
    note = v_updated_note,
    updated_at = v_now
  WHERE organization_id = p_org_id AND id = p_follow_up_id;

  UPDATE public.leads SET next_follow_up_at = NULL, updated_at = v_now WHERE organization_id = p_org_id AND id = v_fu_rec.lead_id;

  INSERT INTO public.lead_history (
    id, organization_id, lead_id, user_id, action, description, timestamp
  ) VALUES (
    'hist_' || encode(extensions.gen_random_bytes(8), 'hex'),
    p_org_id, v_fu_rec.lead_id, p_user_id, 'FOLLOW_UP_COMPLETED',
    'Follow-up marked as COMPLETED by ' || v_user_name || '.',
    v_now
  );

  RETURN jsonb_build_object('followUpId', p_follow_up_id, 'leadId', v_fu_rec.lead_id);
END;
$$;


-- Permissions Hardening
REVOKE EXECUTE ON FUNCTION record_call_activity_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION schedule_follow_up_atomic(VARCHAR, VARCHAR, VARCHAR, DATE, VARCHAR, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION complete_follow_up_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION record_call_activity_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION schedule_follow_up_atomic(VARCHAR, VARCHAR, VARCHAR, DATE, VARCHAR, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION complete_follow_up_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT) TO service_role;

COMMIT;
