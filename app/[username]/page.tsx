import type { Metadata } from "next";
import ProfileCard from "@/components/ProfileCard";
import { createClient } from "@/lib/supabase/server";
import { isAllowedStorageUrl } from "@/lib/url-validation";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  // Look up only the public fields needed for the preview card.
  // Same explicit-column discipline as the page body — phone / email /
  // show_phone are NEVER selected, so they can never leak into metadata.
  // (Next.js memoizes this fetch with the page body's fetch when identical.)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, job_title, company, avatar_url")
    .eq("username", username)
    .maybeSingle();

  // No profile → minimal metadata; the page body handles the redirect.
  if (!profile) {
    return {
      title: `${username} · Konneqta`,
      description: `Connect with @${username} on Konneqta`,
    };
  }

  const fullName = profile.full_name?.trim() || username;

  // Description: job title + company only (no bio — privacy + formatting).
  const jobTitle = profile.job_title?.trim() || "";
  const company = profile.company?.trim() || "";
  const description =
    jobTitle && company
      ? `${jobTitle} at ${company}`
      : jobTitle || company || `Connect with @${username} on Konneqta`;

  // OG image: validated avatar, else branded fallback banner.
  const avatarUrl = profile.avatar_url?.trim() || "";
  const ogImage =
    avatarUrl && isAllowedStorageUrl(avatarUrl) ? avatarUrl : "/banner.png";

  return {
    title: `${fullName} · Konneqta`,
    description,
    alternates: {
      canonical: `/${username}`,
    },
    openGraph: {
      title: `${fullName} · Konneqta`,
      description,
      url: `/${username}`,
      siteName: "Konneqta",
      type: "profile",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullName} · Konneqta`,
      description,
      images: [ogImage],
    },
  };
}

export default async function UsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // Look up the public profile by username.
  // IMPORTANT: explicit column list only — do NOT use "*".
  // phone / email / show_phone are private and must never reach the public
  // page payload. See supabase/vcard-setup.sql for the privacy rationale.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, job_title, company, bio, avatar_url, logo_url, qr_code_url"
    )
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    // No profile matches this username → fallback to home
    redirect("/");
  }

  // Fetch the social links for this profile
  const { data: socialLinks } = await supabase
    .from("social_links")
    .select("platform, url")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true });

  // Check if the current visitor is the owner (for showing the Edit button)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = Boolean(user && user.id === profile.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <ProfileCard
        profile={profile}
        socialLinks={socialLinks ?? []}
        isOwner={isOwner}
      />
    </main>
  );
}
