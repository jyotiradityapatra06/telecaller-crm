-- Run manually in Supabase only after migrations 004 and 005 are applied.
-- Moves only Koushik Roy's MASTER_ADMIN account. No demo business records move.
BEGIN;

DO $$
DECLARE
  v_user_id VARCHAR(100);
  v_current_org_id VARCHAR(100);
  v_new_org_id VARCHAR(100) := 'org_' || encode(gen_random_bytes(12), 'hex');
  v_new_slug VARCHAR(100) := 'koushik-roy-production-' || encode(gen_random_bytes(6), 'hex');
BEGIN
  SELECT id, organization_id
  INTO v_user_id, v_current_org_id
  FROM public.users
  WHERE login_id = 'MASTER_ADMIN'
    AND name = 'Koushik Roy'
    AND role = 'OWNER'
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Expected OWNER MASTER_ADMIN / Koushik Roy was not found.';
  END IF;

  IF v_current_org_id <> 'org_demo_001' THEN
    RAISE EXCEPTION 'MASTER_ADMIN is not in org_demo_001; no changes were made.';
  END IF;

  INSERT INTO public.organizations (id, name, slug, is_demo, is_active)
  VALUES (v_new_org_id, 'Koushik Roy Production', v_new_slug, FALSE, TRUE);

  UPDATE public.users
  SET organization_id = v_new_org_id,
      role = 'OWNER',
      brand_access = 'BOTH',
      updated_at = NOW()
  WHERE id = v_user_id
    AND organization_id = 'org_demo_001';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'MASTER_ADMIN move failed; transaction will be rolled back.';
  END IF;
END;
$$;

COMMIT;

-- Verification queries (read-only):
SELECT id, organization_id, name, login_id, role, brand_access
FROM public.users
WHERE login_id = 'MASTER_ADMIN' AND name = 'Koushik Roy';

SELECT
  (SELECT COUNT(*) FROM public.leads WHERE organization_id = u.organization_id) AS leads,
  (SELECT COUNT(*) FROM public.users WHERE organization_id = u.organization_id AND role = 'TELECALLER') AS telecallers,
  (SELECT COUNT(*) FROM public.call_activities WHERE organization_id = u.organization_id) AS calls,
  (SELECT COUNT(*) FROM public.follow_ups WHERE organization_id = u.organization_id) AS follow_ups,
  (SELECT COUNT(*) FROM public.lead_history WHERE organization_id = u.organization_id) AS history
FROM public.users u
WHERE u.login_id = 'MASTER_ADMIN' AND u.name = 'Koushik Roy';
