import EditProfileForm from "@/components/EditProfileForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // 1. Must be logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // 2. Fetch the profile for this username
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    redirect("/");
  }

  // 3. Ownership check — only the profile owner can edit
  if (profile.id !== user.id) {
    redirect(`/${username}`);
  }

  // 4. Fetch the owner's existing social links
  const { data: socialLinks } = await supabase
    .from("social_links")
    .select("id, platform, url")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true });

  return (
    <EditProfileForm
      initialProfile={{
        username: profile.username,
        full_name: profile.full_name ?? "",
        email: profile.email ?? "",
        job_title: profile.job_title ?? "",
        company: profile.company ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
        logo_url: profile.logo_url ?? "",
      }}
      initialSocialLinks={socialLinks ?? []}
    />
  );
}