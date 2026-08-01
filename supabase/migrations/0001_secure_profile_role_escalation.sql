-- Defense-in-depth: prevent privilege escalation on public.profiles.
--
-- Context: Admin and Lecturer accounts must now be created exclusively through the
-- "admin-provision-user" Edge Function (which uses the service role key). This
-- trigger makes that a hard database-level guarantee: any INSERT/UPDATE coming from
-- a normal client session (role = 'authenticated' or 'anon') is blocked from setting
-- profiles.role to 'Admin' or 'Lecturer'. Requests made with the service role key
-- (as the Edge Function does) are unaffected.
--
-- Safe to run multiple times.

CREATE OR REPLACE FUNCTION public.prevent_privileged_role_self_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NEW.role IN ('Admin', 'Lecturer') THEN
    -- Allow no-op updates where the role isn't actually changing.
    IF TG_OP = 'UPDATE' AND OLD.role = NEW.role THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Admin and Lecturer roles can only be assigned by a trusted server process.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_privileged_role_self_assignment ON public.profiles;

CREATE TRIGGER trg_prevent_privileged_role_self_assignment
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privileged_role_self_assignment();
