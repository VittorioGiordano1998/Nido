-- =============================================================================
-- Nido - cycle consent
--
-- Health data needs explicit, revocable consent per account (PLAN-001
-- §GDPR/store): the cycle section stays hidden until profiles.cycle_consent_at
-- is set, and setting it to null hides the section again without touching the
-- logs (the owner can re-enable or the deletion tools remove them).
-- Idempotent.
-- =============================================================================

alter table public.profiles
  add column if not exists cycle_consent_at timestamptz;
