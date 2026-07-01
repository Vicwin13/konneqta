import { buildVCard } from "@/lib/vcard";
import { createClient } from "@/lib/supabase/server";

/**
 * vCard (.vcf) download route.
 *
 * Serves a live, thin vCard generated from the current profile row.
 *
 * Privacy:
 * - Selects ONLY the columns it needs: full_name, username, phone, show_phone.
 * - Phone is included in the output only when show_phone is TRUE and the
 *   phone value is non-empty. Otherwise it is read and discarded.
 * - Email is never selected, never included.
 *
 * The profile URL written into the `URL:` field is the canonical Konneqta
 * profile link derived from the request host, making the saved contact a
 * living pointer to the always-current profile.
 */

// Always dynamic — every request must hit the DB for fresh profile data.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  const { username } = await ctx.params;
  const supabase = await createClient();

  // Only the columns this route is allowed to read.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, phone, show_phone")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    return new Response("Not Found", { status: 404 });
  }

  // Build the canonical profile URL from the incoming request host.
  const url = new URL(_req.url);
  const profileUrl = `${url.origin}/${profile.username}`;

  const vcf = buildVCard({
    fullName: profile.full_name,
    username: profile.username,
    profileUrl,
    phone: profile.phone,
    showPhone: profile.show_phone,
  });

  // Suggest a filename the OS will use for "Save Contact".
  const fileBase = (profile.full_name || "contact").replace(
    /[^a-z0-9_-]/gi,
    ""
  );

  return new Response(vcf, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileBase}.vcf"`,
      // Never cache — the card must reflect the latest DB row.
      "Cache-Control": "no-store",
    },
  });
}