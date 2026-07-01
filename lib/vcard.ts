/**
 * vCard (.vcf) builder helper.
 *
 * Design notes:
 * - The vCard is intentionally THIN: full name + Konneqta profile URL,
 *   and (optionally) the phone number. Email is never included.
 * - The URL is the centrepiece: it makes the saved contact a "living pointer"
 *   to the always-current profile, so the card itself never goes stale.
 * - Generation happens server-side in the vCard route on every request, so
 *   the snapshot fields (name/phone) are always as fresh as the last DB write.
 *
 * Spec compliance:
 * - vCard 3.0 (RFC 2426). Widely supported by iOS/Android/macOS/Windows.
 * - CRLF line endings.
 * - Lines longer than 75 octets are "folded" with a space continuation.
 * - Special characters in values are escaped (commas, semicolons, newlines).
 */

export type BuildVCardOptions = {
  /** Full display name, e.g. "Victor Winner". Falls back to username. */
  fullName: string | null;
  /** Username, used as a name fallback and in the URL. */
  username: string;
  /** Absolute profile URL, e.g. "https://konneqta.app/johndoe". */
  profileUrl: string;
  /** Phone number to include ONLY if `showPhone` is true. */
  phone?: string | null;
  /** Owner-controlled flag. Phone is omitted unless this is true. */
  showPhone?: boolean | null;
};

const CRLF = "\r\n";

/**
 * Escape a vCard 3.0 text value:
 * - backslash, comma, semicolon and newlines must be escaped.
 */
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r\n|\n|\r/g, "\\n");
}

/**
 * Fold a single logical line to ≤75 octets per physical line, continuing
 * with a leading space (RFC 2426 §5.8.1).
 */
function foldLine(line: string): string {
  // Operate on the UTF-8 byte length to be spec-correct.
  const bytes = Buffer.byteLength(line, "utf8");
  if (bytes <= 75) return line;

  const chunks: string[] = [];
  let remaining = line;
  while (Buffer.byteLength(remaining, "utf8") > 75) {
    // Slice conservatively by character count, then walk back to stay
    // under 75 bytes (safe for multibyte UTF-8).
    let cut = 75;
    while (Buffer.byteLength(remaining.slice(0, cut), "utf8") > 75) {
      cut -= 1;
    }
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  chunks.push(remaining);
  return chunks.join(CRLF + " ");
}

/**
 * Build a thin vCard 3.0 string from profile fields.
 *
 * The returned string is terminated with a trailing CRLF and ready to be
 * served as `text/vcard`.
 */
export function buildVCard({
  fullName,
  username,
  profileUrl,
  phone,
  showPhone,
}: BuildVCardOptions): string {
  const displayName = (fullName?.trim() || username).trim();

  // Split display name into a best-effort structured N: family;given;;;.
  const parts = displayName.split(/\s+/);
  const familyName = parts.length > 1 ? parts.slice(1).join(" ") : displayName;
  const givenName = parts.length > 1 ? parts[0] : "";

  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  // Structured name: Family;Given;;; (the trailing semicolons are the
  // additional, empty name components per spec).
  lines.push(
    foldLine(
      `N:${escapeValue(familyName)};${escapeValue(givenName)};;;`
    )
  );

  // Full display name.
  lines.push(foldLine(`FN:${escapeValue(displayName)}`));

  // The living pointer: always-current Konneqta profile URL.
  lines.push(foldLine(`URL:${profileUrl}`));

  // Phone is included ONLY when the owner opted in AND a number exists.
  const trimmedPhone = (phone ?? "").trim();
  if (showPhone && trimmedPhone) {
    // TYPE=CELL is the most common default for personal contacts; many
    // address books route the "mobile" label from this.
    lines.push(foldLine(`TEL;TYPE=CELL:${trimmedPhone}`));
  }

  lines.push("END:VCARD");

  return lines.join(CRLF) + CRLF;
}