BEGIN;

-- Existing ADMIN was exclusively the organization master role in the current
-- registration and seed architecture, so every legacy ADMIN is promoted to OWNER.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE public.users SET role = 'OWNER', brand_access = 'BOTH', updated_at = NOW() WHERE role = 'ADMIN';
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('OWNER', 'HR', 'TELECALLER'));

-- Enforce the invariant for every new/updated row. NOT VALID deliberately avoids
-- breaking deployment if historical TELECALLER+BOTH rows exist; audit/remediate
-- those rows, then validate this constraint as shown in the handoff instructions.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_brand_access_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_brand_access_check CHECK (
  (role = 'OWNER' AND brand_access = 'BOTH') OR
  (role IN ('HR', 'TELECALLER') AND brand_access IN ('APNI_VIDYA', 'APNI_ESTATE'))
) NOT VALID;

COMMENT ON TABLE public.users IS 'CRM accounts with OWNER, brand-scoped HR, and brand-scoped TELECALLER roles.';
COMMENT ON COLUMN public.users.brand_access IS 'OWNER=BOTH; HR and TELECALLER must be APNI_VIDYA or APNI_ESTATE.';

COMMIT;
