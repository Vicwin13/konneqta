import OnboardingForm from "@/components/OnboardingForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Check if profile already exists — if so, redirect to profile page
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    redirect(`/${profile.username}`);
  }

  const fullName = user.user_metadata?.full_name ?? "";
  const email = user.email ?? "";

  return <OnboardingForm fullName={fullName} email={email} />;
}
