import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
        // Don't exchange the code here on the server. The PKCE code_verifier
        // was stored in the BROWSER's storage (localStorage/cookies) by the
        // client that called resetPasswordForEmail(), and is NOT accessible
        // to this server route. Instead, pass the code to the reset-password
        // page, which exchanges it client-side where the verifier is available.
        return NextResponse.redirect(`${origin}/auth/reset-password?code=${code}`);
    }

    // No code → the link was malformed or already consumed.
    return NextResponse.redirect(`${origin}/auth/login?error=reset_failed`);
}