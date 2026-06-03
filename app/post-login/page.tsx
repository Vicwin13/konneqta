import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function PostLoginPage() { 
    const supabase = await createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) { 
        redirect('/');
    }

    const {data: profile} = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
        .single();

    if (!profile) { 
        redirect('/onboarding');
    }

    redirect(`/${profile.username}`);


}