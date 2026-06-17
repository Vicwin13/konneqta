import type { Metadata } from "next";
import ProfileCard from "@/components/ProfileCard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} · Konneqta`,
    description: `Connect with @${username} on Konneqta`,
  };
}

export default async function UsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // Look up the public profile by username
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
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
