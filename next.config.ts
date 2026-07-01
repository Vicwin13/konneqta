import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHost = (() => {
  try {
    return supabaseUrl ? new URL(supabaseUrl).hostname : "";
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  images: {
    // Next.js 16 requires an explicit qualities allowlist
    qualities: [75],
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
          },
        ]
      : [],
  },
};

// @serwist/turbopack wraps the Next config to enable Turbopack-native service
// worker compilation. The SW source lives at app/sw.ts and is served by the
// route handler at app/serwist/route.ts (output: /serwist.js).
// This works with Next.js 16's default Turbopack for both dev and build.
export default withSerwist(nextConfig);