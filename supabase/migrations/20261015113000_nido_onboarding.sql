-- =============================================================================
-- Nido - first-run onboarding flag
--
-- Profiles carry when their owner has seen the intro slides; the flag is per
-- account (not per couple) so the partner sees the intro once too.
-- Idempotent: safe to re-run.
-- =============================================================================

alter table public.profiles
  add column if not exists onboarded_at timestamptz;
