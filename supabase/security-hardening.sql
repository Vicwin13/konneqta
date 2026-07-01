-- =============================================================================
-- Security hardening: RLS policies, CHECK constraints, and storage locks
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run (idempotent where practical).
-- =============================================================================
-- WHAT THIS FILE DOES
-- --------------------
-- 1. Locks the `social_links` table so a user can only write their own links.
-- 2. Adds a DB-level CHECK constraint that rejects dangerous URL schemes
--    (javascript:, data:, vbscript:, file:) — the REAL security barrier.
-- 3. Adds a CHECK constraint that rejects dangerous username characters.
-- 4. Documents the storage-bucket MIME allowlist you must set in the Dashboard.
-- 5. Fixes the "clients can list all files" warning on the qrcodes bucket.
-- =============================================================================
-- -----------------------------------------------------------------------------
-- 1. Row Level Security on `social_links`
--    Currently anyone authenticated can INSERT/UPDATE/DELETE ANY row.
--    This locks writes to the owner only. (SELECT stays public — profiles
--    are public, so their links must be too.)
-- -----------------------------------------------------------------------------
alter table public.social_links enable row level security;
-- Public read (profiles are public, so links must be public too)
drop policy if exists "social_links_public_read" on public.social_links;
create policy "social_links_public_read" on public.social_links for
select to public using (true);
-- Owner-only INSERT
drop policy if exists "social_links_owner_insert" on public.social_links;
create policy "social_links_owner_insert" on public.social_links for
insert to authenticated with check (profile_id = auth.uid());
-- Owner-only UPDATE
drop policy if exists "social_links_owner_update" on public.social_links;
create policy "social_links_owner_update" on public.social_links for
update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
-- Owner-only DELETE
drop policy if exists "social_links_owner_delete" on public.social_links;
create policy "social_links_owner_delete" on public.social_links for delete to authenticated using (profile_id = auth.uid());
-- -----------------------------------------------------------------------------
-- 2. CHECK constraint: reject dangerous URL schemes
--    This is the REAL security barrier for XSS-via-href. Even if an attacker
--    calls the Supabase REST API directly (bypassing the form), the DB will
--    refuse to store javascript:, data:, vbscript:, or file: URLs.
--
--    For `email` platform rows, the URL is just the address (no mailto:),
--    so we also reject dangerous schemes there.
-- -----------------------------------------------------------------------------
-- Correct PostgreSQL syntax: ALTER TABLE ... DROP CONSTRAINT IF EXISTS ...
alter table public.social_links drop constraint if exists social_links_url_safe_scheme;
alter table public.social_links
add constraint social_links_url_safe_scheme check (
        -- Standard web links: must start with http:// or https://
        url ~* '^https?://'
        or (
            platform = 'email' -- Strict email format (case-insensitive)
            and url ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' -- Still block dangerous protocols just in case (belt & suspenders)
            and url !~* '^(javascript|data|vbscript|file):' -- Ensure it's not empty or just whitespace
            and length(trim(url)) > 0
        )
    );
-- -----------------------------------------------------------------------------
-- 3. CHECK constraint: username format (defense-in-depth)
--    The client normalizes username input, but a direct API call could bypass
--    that. This ensures usernames are always 3–20 chars of [a-z0-9_].
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles
add constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$');
-- -----------------------------------------------------------------------------
-- 4. Storage bucket MIME allowlists (DO THIS IN THE DASHBOARD)
-- -----------------------------------------------------------------------------
-- Supabase storage bucket MIME-type restrictions are configured in the
-- Dashboard (Storage → bucket → ⚙️ Settings → Allowed MIME types).
--
-- avatars:  image/jpeg, image/png, image/webp   (max 5 MB)
-- logos:    image/jpeg, image/png, image/webp   (max 5 MB)
-- qrcodes:  image/png                           (max 1 MB)
--
-- This is the REAL barrier against SVG/script uploads. SVG is EXCLUDED
-- because it can carry <script> tags → stored XSS.
-- -----------------------------------------------------------------------------
-- 5. Fix: "Clients can list all files in this bucket"
-- -----------------------------------------------------------------------------
-- Public buckets don't need a SELECT policy on storage.objects — public read
-- is handled by the bucket's `public` flag. A broad SELECT policy lets clients
-- enumerate every file. Dropping it stops enumeration while keeping public URLs
-- working.
--
-- Apply this to ALL public buckets: qrcodes, avatars, logos.
drop policy if exists "qrcodes_public_read" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "logos_public_read" on storage.objects;
-- If you used different policy names, find them with:
--   select policyname, tablename from pg_policies where schemaname = 'storage';
-- Then drop those specific policies by name.