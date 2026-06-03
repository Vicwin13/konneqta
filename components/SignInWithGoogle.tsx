'use client';

import { createClient } from "@/lib/supabase/client";

export default function SignInWithGoogle() {
    const supabase = createClient();

    async function handleSignIn() {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
    }
    return(
        <button className="border py-2 px-4 hover:bg-black hover:text-whitedark:border-white rounded-4xl cursor-pointer dark:text-white" onClick={handleSignIn}>
            Sign in with Google
        </button>
    )
}