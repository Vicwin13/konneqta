import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/post-login";

    console.log("Auth callback hit. Code:", code ? "present" : "MISSING");
    console.log("Next:", next);
    console.log("FULL URL:", request.url);

    if (code){
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        console.log("Exchange error:", error?.message ?? "none");
        if (!error){
            return NextResponse.redirect(`${origin}${next}`)
        }

    }

    return NextResponse.redirect(`${origin}/auth/login`)
}