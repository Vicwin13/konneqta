-- =============================================================================
-- QR code feature: Supabase setup
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run (idempotent where practical).
-- =============================================================================
-- -----------------------------------------------------------------------------
-- 1. Add the QR code URL column to `profiles`
-- -----------------------------------------------------------------------------
alter table public.profiles
add column if not exists qr_code_url text;
comment on column public.profiles.qr_code_url is 'Public Storage URL of the generated profile QR PNG (qrcodes bucket). Null until first generation.';
-- -----------------------------------------------------------------------------
-- 2. Create the `qrcodes` storage bucket (public READ, owner-only WRITE via RLS)
--    Path convention: <user_id>/qr.png   (unique per user, upserted on regen)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('qrcodes', 'qrcodes', true) on conflict (id) do nothing;
-- -----------------------------------------------------------------------------
-- 3. Row Level Security on the `qrcodes` bucket
--    - Anyone can SELECT (profiles are public, so QRs must be too)
--    - Only the owner can INSERT / UPDATE / DELETE their own QR
--      (owner = the first path segment equals the auth user id)
-- -----------------------------------------------------------------------------
-- Public read
create policy "qrcodes_public_read" on storage.objects for
select to public using (bucket_id = 'qrcodes');
-- Owner insert: <auth.uid>/qr.png
create policy "qrcodes_owner_insert" on storage.objects for
insert to authenticated with check (
        bucket_id = 'qrcodes'
        and (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Owner update: only their own object
create policy "qrcodes_owner_update" on storage.objects for
update to authenticated using (
        bucket_id = 'qrcodes'
        and (storage.foldername(name)) [1] = auth.uid()::text
    ) with check (
        bucket_id = 'qrcodes'
        and (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Owner delete: only their own object
create policy "qrcodes_owner_delete" on storage.objects for delete to authenticated using (
    bucket_id = 'qrcodes'
    and (storage.foldername(name)) [1] = auth.uid()::text
);
-- -----------------------------------------------------------------------------
-- NOTE on MIME / size
-- The app uploads PNGs generated from canvas. If you want a hard server-side
-- guard, you can additionally restrict via a storage bucket mime config in the
-- dashboard (Allowed MIME types: image/png; max file size: e.g. 1 MB).
-- -----------------------------------------------------------------------------