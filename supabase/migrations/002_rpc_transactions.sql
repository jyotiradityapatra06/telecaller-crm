-- ==============================================================================
-- TeleCaller CRM Enterprise — Phase 4.2 Atomic RPC Transactions Migration
-- PostgreSQL Stored Procedures for ACID Transaction Safety
-- ==============================================================================

-- 1. ATOMIC LEAD ASSIGNMENT
CREATE OR REPLACE FUNCTION assign_leads_atomic(
  p_org_id VARCHAR,
  p_lead_ids VARCHAR[],
  p_telecaller_id VARCHAR,
  p_admin_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_id VARCHAR;
  v_admin_name VARCHAR;
  v_tc_name VARCHAR;
  v_tc_brand VARCHAR;
  v_prev_tc_name VARCHAR;
  v_now TIMESTAMPTZ := NOW();
  v_now_iso VARCHAR := TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_assigned_count INTEGER := 0;
  v_updated_lead_ids VARCHAR[] := ARRAY[]::VARCHAR[];
BEGIN
  -- Validate Admin
  SELECT name INTO v_admin_name FROM users WHERE organization_id = p_org_id AND id = p_admin_id;
  IF v_admin_name IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Admin user not found in organization.';
  END IF;

  -- Validate Telecaller if assigning
  IF p_telecaller_id IS NOT NULL THEN
    SELECT name, brand_access INTO v_tc_name, v_tc_brand FROM users WHERE organization_id = p_org_id AND id = p_telecaller_id;
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
    PERFORM 1 FROM leads WHERE organization_id = p_org_id AND id = v_lead_id FOR UPDATE;

    SELECT u.name INTO v_prev_tc_name
    FROM leads l
    LEFT JOIN users u ON u.id = l.assigned_to
    WHERE l.organization_id = p_org_id AND l.id = v_lead_id;

    IF v_prev_tc_name IS NULL THEN
      v_prev_tc_name := 'Unassigned';
    END IF;

    -- Update lead
    UPDATE leads
    SET assigned_to = p_telecaller_id,
        updated_at = v_now
    WHERE organization_id = p_org_id AND id = v_lead_id;

    -- Insert assignment record
    INSERT INTO lead_assignments (
      id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at
    ) VALUES (
      'asgn_' || encode(gen_random_bytes(8), 'hex'),
      p_org_id,
      v_lead_id,
      p_telecaller_id,
      p_admin_id,
      CASE WHEN p_telecaller_id IS NOT NULL THEN 'ASSIGNED' ELSE 'UNASSIGNED' END,
      v_now
    );

    -- Insert history audit
    INSERT INTO lead_history (
      id, organization_id, lead_id, user_id, action, description, timestamp
    ) VALUES (
      'hist_' || encode(gen_random_bytes(8), 'hex'),
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


-- 2. ATOMIC ROUND-ROBIN AUTO-DISTRIBUTION
CREATE OR REPLACE FUNCTION auto_distribute_leads_atomic(
  p_org_id VARCHAR,
  p_brand_filter VARCHAR,
  p_admin_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_name VARCHAR;
  v_vidya_callers VARCHAR[];
  v_vidya_names VARCHAR[];
  v_estate_callers VARCHAR[];
  v_estate_names VARCHAR[];
  v_vidya_count INTEGER := 0;
  v_estate_count INTEGER := 0;
  v_lead_rec RECORD;
  v_caller_idx INTEGER := 0;
  v_target_id VARCHAR;
  v_target_name VARCHAR;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT name INTO v_admin_name FROM users WHERE organization_id = p_org_id AND id = p_admin_id;
  IF v_admin_name IS NULL THEN
    v_admin_name := 'Master Admin HQ';
  END IF;

  -- 1. Distribute Apni Vidya
  IF p_brand_filter IS NULL OR p_brand_filter = 'ALL' OR p_brand_filter = 'APNI_VIDYA' THEN
    SELECT array_agg(id), array_agg(name) INTO v_vidya_callers, v_vidya_names
    FROM users
    WHERE organization_id = p_org_id AND role = 'TELECALLER' AND is_active = TRUE AND brand_access IN ('APNI_VIDYA', 'BOTH');

    IF v_vidya_callers IS NOT NULL AND array_length(v_vidya_callers, 1) > 0 THEN
      v_caller_idx := 0;
      FOR v_lead_rec IN
        SELECT id FROM leads
        WHERE organization_id = p_org_id AND brand = 'APNI_VIDYA' AND assigned_to IS NULL
        FOR UPDATE SKIP LOCKED
      LOOP
        v_target_id := v_vidya_callers[(v_caller_idx % array_length(v_vidya_callers, 1)) + 1];
        v_target_name := v_vidya_names[(v_caller_idx % array_length(v_vidya_callers, 1)) + 1];

        UPDATE leads SET assigned_to = v_target_id, updated_at = v_now WHERE id = v_lead_rec.id;

        INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
        VALUES ('asgn_' || encode(gen_random_bytes(8), 'hex'), p_org_id, v_lead_rec.id, v_target_id, p_admin_id, 'ASSIGNED', v_now);

        INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
        VALUES ('hist_' || encode(gen_random_bytes(8), 'hex'), p_org_id, v_lead_rec.id, p_admin_id, 'ASSIGNED',
                'Auto-routed to ' || v_target_name || ' via Apni Vidya Distribution Engine.', v_now);

        v_vidya_count := v_vidya_count + 1;
        v_caller_idx := v_caller_idx + 1;
      END LOOP;
    END IF;
  END IF;

  -- 2. Distribute Apni Estate
  IF p_brand_filter IS NULL OR p_brand_filter = 'ALL' OR p_brand_filter = 'APNI_ESTATE' THEN
    SELECT array_agg(id), array_agg(name) INTO v_estate_callers, v_estate_names
    FROM users
    WHERE organization_id = p_org_id AND role = 'TELECALLER' AND is_active = TRUE AND brand_access IN ('APNI_ESTATE', 'BOTH');

    IF v_estate_callers IS NOT NULL AND array_length(v_estate_callers, 1) > 0 THEN
      v_caller_idx := 0;
      FOR v_lead_rec IN
        SELECT id FROM leads
        WHERE organization_id = p_org_id AND brand = 'APNI_ESTATE' AND assigned_to IS NULL
        FOR UPDATE SKIP LOCKED
      LOOP
        v_target_id := v_estate_callers[(v_caller_idx % array_length(v_estate_callers, 1)) + 1];
        v_target_name := v_estate_names[(v_caller_idx % array_length(v_estate_callers, 1)) + 1];

        UPDATE leads SET assigned_to = v_target_id, updated_at = v_now WHERE id = v_lead_rec.id;

        INSERT INTO lead_assignments (id, organization_id, lead_id, assigned_to, assigned_by, assignment_type, created_at)
        VALUES ('asgn_' || encode(gen_random_bytes(8), 'hex'), p_org_id, v_lead_rec.id, v_target_id, p_admin_id, 'ASSIGNED', v_now);

        INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
        VALUES ('hist_' || encode(gen_random_bytes(8), 'hex'), p_org_id, v_lead_rec.id, p_admin_id, 'ASSIGNED',
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


-- 3. ATOMIC CALL LOGGING & STATUS UPDATE
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
  SELECT * INTO v_lead_rec FROM leads WHERE organization_id = p_org_id AND id = p_lead_id FOR UPDATE;
  IF v_lead_rec.id IS NULL THEN
    RAISE EXCEPTION 'Lead with ID % not found in organization.', p_lead_id;
  END IF;

  -- Validate Telecaller
  SELECT name INTO v_tc_name FROM users WHERE organization_id = p_org_id AND id = p_telecaller_id;
  IF v_tc_name IS NULL THEN
    RAISE EXCEPTION 'Telecaller with ID % not found in organization.', p_telecaller_id;
  END IF;

  -- 1. Insert Call Activity
  v_call_id := 'call_' || encode(gen_random_bytes(8), 'hex');
  INSERT INTO call_activities (
    id, organization_id, lead_id, telecaller_id, status, note, called_at, duration_seconds, call_type, created_at
  ) VALUES (
    v_call_id, p_org_id, p_lead_id, p_telecaller_id, p_status, p_note, v_now, COALESCE(p_duration_seconds, 0), COALESCE(p_call_type, 'CALL'), v_now
  );

  -- 2. Update Lead Fields
  UPDATE leads SET
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
  INSERT INTO lead_history (
    id, organization_id, lead_id, user_id, action, description, timestamp
  ) VALUES (
    'hist_' || encode(gen_random_bytes(8), 'hex'),
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
    v_fu_id := 'fu_' || encode(gen_random_bytes(8), 'hex');

    INSERT INTO follow_ups (
      id, organization_id, lead_id, telecaller_id, scheduled_at, due_date, due_time, note, status, created_at
    ) VALUES (
      v_fu_id, p_org_id, p_lead_id, p_telecaller_id, v_due_date || 'T' || v_due_time, v_due_date, v_due_time, v_fu_note, v_fu_status, v_now
    );

    UPDATE leads SET next_follow_up_at = v_now WHERE organization_id = p_org_id AND id = p_lead_id;
  END IF;

  -- 5. Special Milestones History
  IF p_status = 'ENROLLED' THEN
    INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
    VALUES ('hist_' || encode(gen_random_bytes(8), 'hex'), p_org_id, p_lead_id, p_telecaller_id, 'ENROLLED', 'Student admission confirmed & enrolled!', v_now);
  ELSIF p_status = 'SITE_VISIT_SCHEDULED' THEN
    INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
    VALUES ('hist_' || encode(gen_random_bytes(8), 'hex'), p_org_id, p_lead_id, p_telecaller_id, 'SITE_VISIT_SCHEDULED', 'Physical site visit booked!', v_now);
  ELSIF p_status = 'CLOSED' THEN
    INSERT INTO lead_history (id, organization_id, lead_id, user_id, action, description, timestamp)
    VALUES ('hist_' || encode(gen_random_bytes(8), 'hex'), p_org_id, p_lead_id, p_telecaller_id, 'CLOSED_DEAL', 'Real estate deal closed successfully!', v_now);
  END IF;

  RETURN jsonb_build_object(
    'callActivityId', v_call_id,
    'followUpId', v_fu_id,
    'leadId', p_lead_id
  );
END;
$$;


-- 4. ATOMIC FOLLOW-UP CREATION
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
AS $$
DECLARE
  v_fu_id VARCHAR := 'fu_' || encode(gen_random_bytes(8), 'hex');
  v_now TIMESTAMPTZ := NOW();
  v_tc_name VARCHAR;
  v_status VARCHAR;
BEGIN
  SELECT name INTO v_tc_name FROM users WHERE organization_id = p_org_id AND id = p_telecaller_id;
  IF v_tc_name IS NULL THEN
    RAISE EXCEPTION 'Telecaller with ID % not found.', p_telecaller_id;
  END IF;

  v_status := CASE WHEN p_due_date < CURRENT_DATE THEN 'OVERDUE' ELSE 'PENDING' END;

  INSERT INTO follow_ups (
    id, organization_id, lead_id, telecaller_id, scheduled_at, due_date, due_time, note, status, created_at
  ) VALUES (
    v_fu_id, p_org_id, p_lead_id, p_telecaller_id, p_due_date || 'T' || COALESCE(p_due_time, '04:00 PM'), p_due_date, COALESCE(p_due_time, '04:00 PM'), p_note, v_status, v_now
  );

  UPDATE leads SET next_follow_up_at = v_now, updated_at = v_now WHERE organization_id = p_org_id AND id = p_lead_id;

  INSERT INTO lead_history (
    id, organization_id, lead_id, user_id, action, description, timestamp
  ) VALUES (
    'hist_' || encode(gen_random_bytes(8), 'hex'),
    p_org_id, p_lead_id, p_telecaller_id, 'FOLLOW_UP_CREATED',
    'Follow-up scheduled for ' || p_due_date || ' at ' || COALESCE(p_due_time, '04:00 PM') || ' by ' || v_tc_name || '.',
    v_now
  );

  RETURN jsonb_build_object('followUpId', v_fu_id);
END;
$$;


-- 5. ATOMIC FOLLOW-UP COMPLETION
CREATE OR REPLACE FUNCTION complete_follow_up_atomic(
  p_org_id VARCHAR,
  p_follow_up_id VARCHAR,
  p_user_id VARCHAR,
  p_completion_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fu_rec RECORD;
  v_user_name VARCHAR;
  v_now TIMESTAMPTZ := NOW();
  v_updated_note TEXT;
BEGIN
  SELECT * INTO v_fu_rec FROM follow_ups WHERE organization_id = p_org_id AND id = p_follow_up_id FOR UPDATE;
  IF v_fu_rec.id IS NULL THEN
    RAISE EXCEPTION 'Follow-up with ID % not found.', p_follow_up_id;
  END IF;

  SELECT name INTO v_user_name FROM users WHERE organization_id = p_org_id AND id = p_user_id;
  IF v_user_name IS NULL THEN
    v_user_name := 'Master Admin';
  END IF;

  v_updated_note := CASE
    WHEN p_completion_note IS NOT NULL AND v_fu_rec.note IS NOT NULL THEN v_fu_rec.note || ' | Completion Note: ' || p_completion_note
    WHEN p_completion_note IS NOT NULL THEN 'Completion Note: ' || p_completion_note
    ELSE v_fu_rec.note
  END;

  UPDATE follow_ups SET
    status = 'COMPLETED',
    completed_at = v_now,
    note = v_updated_note,
    updated_at = v_now
  WHERE organization_id = p_org_id AND id = p_follow_up_id;

  UPDATE leads SET next_follow_up_at = NULL, updated_at = v_now WHERE organization_id = p_org_id AND id = v_fu_rec.lead_id;

  INSERT INTO lead_history (
    id, organization_id, lead_id, user_id, action, description, timestamp
  ) VALUES (
    'hist_' || encode(gen_random_bytes(8), 'hex'),
    p_org_id, v_fu_rec.lead_id, p_user_id, 'FOLLOW_UP_COMPLETED',
    'Follow-up marked as COMPLETED by ' || v_user_name || '.',
    v_now
  );

  RETURN jsonb_build_object('followUpId', p_follow_up_id, 'leadId', v_fu_rec.lead_id);
END;
$$;


-- 6. ATOMIC TELECALLER DELETION
CREATE OR REPLACE FUNCTION delete_telecaller_atomic(
  p_org_id VARCHAR,
  p_telecaller_id VARCHAR,
  p_admin_id VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tc_name VARCHAR;
  v_tc_login VARCHAR;
  v_admin_name VARCHAR;
  v_unassigned_count INTEGER := 0;
  v_lead_rec RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT name, login_id INTO v_tc_name, v_tc_login FROM users WHERE organization_id = p_org_id AND id = p_telecaller_id;
  IF v_tc_name IS NULL THEN
    RAISE EXCEPTION 'Telecaller not found in organization.';
  END IF;

  SELECT name INTO v_admin_name FROM users WHERE organization_id = p_org_id AND id = p_admin_id;

  -- 1. Unassign leads & log audit
  FOR v_lead_rec IN
    SELECT id FROM leads WHERE organization_id = p_org_id AND assigned_to = p_telecaller_id FOR UPDATE
  LOOP
    UPDATE leads SET assigned_to = NULL, updated_at = v_now WHERE id = v_lead_rec.id;

    INSERT INTO lead_history (
      id, organization_id, lead_id, user_id, action, description, timestamp
    ) VALUES (
      'hist_' || encode(gen_random_bytes(8), 'hex'),
      p_org_id, v_lead_rec.id, p_admin_id, 'REASSIGNED',
      'Telecaller ' || v_tc_name || ' (' || v_tc_login || ') was removed. Lead returned to Unassigned Pool.',
      v_now
    );

    v_unassigned_count := v_unassigned_count + 1;
  END LOOP;

  -- 2. Remove user (FK SET NULL retains all call_activities, follow_ups, history)
  DELETE FROM users WHERE organization_id = p_org_id AND id = p_telecaller_id;

  RETURN jsonb_build_object(
    'success', true,
    'unassignedLeadsCount', v_unassigned_count
  );
END;
$$;
