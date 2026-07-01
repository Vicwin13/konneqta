-- =============================================================================
-- vCard / "Save Contact" feature: Supabase setup
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run (idempotent).
-- =============================================================================
--
-- What this does
-- --------------
-- Adds a single owner-controlled boolean to `profiles` that decides whether
-- the owner's phone number is included in the generated .vcf download.
--
-- Privacy model
-- -------------
-- - Default is FALSE (phone is private / never shown).
-- - When FALSE (or when phone is empty), the phone column is simply ignored
--   by the vCard route — it is never written into the .vcf payload.
-- - Email is NEVER included in the vCard, regardless of this flag.
--
-- NOTE on the public profile payload leak
-- ---------------------------------------
-- This column does NOT fix the existing select("*") leak on its own.
-- The application must use explicit column lists (see app/[username]/page.tsx
-- and app/[username]/vcard/route.ts) so that phone / email / show_phone are
-- never sent to the browser on public pages. RLS is row-level and cannot
-- hide individual columns — column selection is the enforcement layer.
-- -----------------------------------------------------------------------------
-- 1. Add the show_phone flag to `profiles`
alter table public.profiles
add column if not exists show_phone boolean not null default false;
comment on column public.profiles.show_phone is 'Owner-controlled flag. When TRUE AND phone is non-empty, the phone number is included in the generated .vcf contact file. Default FALSE (private).';