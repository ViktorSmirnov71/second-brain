-- ============================================================================
-- Second Brain -- Security Hardening
-- Migration: 002_security_hardening.sql
-- ============================================================================

-- Harden handle_new_user() -- add search_path + ON CONFLICT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicitly mark handle_updated_at() as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Revoke unnecessary anon SELECT on profiles
REVOKE SELECT ON public.profiles FROM anon;

-- Revoke default permissions from public role
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC;

-- Add unique constraints to junction tables
ALTER TABLE public.project_clients
  ADD CONSTRAINT uq_project_clients_project_person
  UNIQUE (project_id, person_id);

ALTER TABLE public.project_companies
  ADD CONSTRAINT uq_project_companies_project_company
  UNIQUE (project_id, company_id);

-- Add unique constraint on tags per user
ALTER TABLE public.tags
  ADD CONSTRAINT uq_tags_user_name
  UNIQUE (user_id, name);
