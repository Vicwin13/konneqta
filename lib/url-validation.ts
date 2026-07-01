/**
 * URL safety helpers.
 *
 * Client-side validation is convenience only — the real security barrier is
 * the DB CHECK constraint (see supabase/security-hardening.sql). These helpers
 * exist to give users fast feedback and to provide defense-in-depth at render
 * time (ProfileCard) in case bad data slips through.
 */

/**
 * Returns true ONLY for http: or https: URLs.
 * Rejects javascript:, data:, vbscript:, file:, and anything else.
 */
export function isSafeHttpUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Returns true if the value is safe to use as an email address target
 * (does not contain dangerous URI schemes).
 */
export function isSafeEmailValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  // Block anything that looks like a dangerous scheme
  return !/^(javascript|data|vbscript|file):/i.test(trimmed);
}

/**
 * Sanitize a URL for rendering in an href attribute.
 * Returns a safe URL or null if the input is dangerous.
 *
 * For email-type links, the caller wraps the value in `mailto:` themselves,
 * so we just check the raw value is safe.
 */
export function safeHref(
  url: string,
  isEmail: boolean
): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (isEmail) {
    return isSafeEmailValue(trimmed) ? `mailto:${trimmed}` : null;
  }

  return isSafeHttpUrl(trimmed) ? trimmed : null;
}

/**
 * Returns true only if the URL points at our Supabase project host.
 *
 * Used to guard `og:image` (avatar_url) before echoing it into public
 * metadata — defense-in-depth against SSRF and spoofed external hosts.
 * The hostname is derived from NEXT_PUBLIC_SUPABASE_URL so it stays in
 * sync with the active Supabase project without hardcoding.
 */
export function isAllowedStorageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (!isSafeHttpUrl(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return false;
    const supabaseHost = new URL(supabaseUrl).hostname;
    return parsed.hostname === supabaseHost;
  } catch {
    return false;
  }
}

/**
 * Allowed image MIME types for uploads (avatars + logos).
 * SVG is EXCLUDED because it can carry <script> tags → stored XSS.
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Allowed file extensions for uploaded images.
 * Used to sanitize the path before constructing the storage key.
 */
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

/**
 * Sanitize a file extension for use in a storage path.
 * Returns the extension if it's in the allowlist, otherwise falls back to "png".
 */
export function safeFileExtension(filename: string): string {
  const rawExt = (filename.split(".").pop() || "").toLowerCase();
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(rawExt)
    ? rawExt
    : "png";
}