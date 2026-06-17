import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function PostLoginPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

    // No profile yet → first-time user → needs to onboard
    if (error || !profile) {
        redirect('/onboarding');
    }

    // Profile exists → go to their public profile page
    redirect(`/${profile.username}`);
}