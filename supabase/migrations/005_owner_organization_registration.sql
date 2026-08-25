BEGIN;

CREATE OR REPLACE FUNCTION public.register_owner_organization_atomic(
  p_organization_name VARCHAR,
  p_owner_name VARCHAR,
  p_login_id VARCHAR,
  p_password_hash VARCHAR,
  p_phone VARCHAR DEFAULT NULL,
  p_email VARCHAR DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id VARCHAR(100);
  v_owner_id VARCHAR(100);
  v_slug VARCHAR(100);
  v_login_id VARCHAR(100);
BEGIN
  v_login_id := upper(trim(p_login_id));
  PERFORM pg_advisory_xact_lock(hashtext(lower(v_login_id)));

  IF EXISTS (SELECT 1 FROM public.users WHERE lower(login_id) = lower(v_login_id)) THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'Login ID already exists.';
  END IF;

  v_org_id := 'org_' || encode(gen_random_bytes(12), 'hex');
  v_owner_id := 'usr_owner_' || encode(gen_random_bytes(12), 'hex');
  v_slug := left(trim(both '-' from regexp_replace(lower(trim(p_organization_name)), '[^a-z0-9]+', '-', 'g')), 70)
    || '-' || encode(gen_random_bytes(6), 'hex');

  INSERT INTO public.organizations (id, name, slug, is_demo, is_active)
  VALUES (v_org_id, trim(p_organization_name), v_slug, FALSE, TRUE);

  INSERT INTO public.users (
    id, organization_id, name, login_id, role, brand_access,
    daily_target, phone, email, password_hash, is_active
  ) VALUES (
    v_owner_id, v_org_id, trim(p_owner_name), v_login_id, 'OWNER', 'BOTH',
    100, NULLIF(trim(p_phone), ''), NULLIF(trim(p_email), ''), p_password_hash, TRUE
  );

  RETURN jsonb_build_object('organization_id', v_org_id, 'owner_id', v_owner_id);
END;
$$;

REVOKE ALL ON FUNCTION public.register_owner_organization_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_owner_organization_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) FROM anon;
REVOKE ALL ON FUNCTION public.register_owner_organization_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.register_owner_organization_atomic(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO service_role;

COMMIT;
