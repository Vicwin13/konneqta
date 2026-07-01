import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline · Konneqta",
  description: "You are offline.",
  robots: { index: false, follow: false },
};

/**
 * Offline fallback page (static route: /offline).
 *
 * Precached by the Serwist service worker and shown when a navigation request
 * fails AND there is no cached version available (e.g. the user opened a
 * profile URL they have never visited before, while offline).
 *
 * Pages the user has visited before are served instantly from the
 * "konneqta-pages" cache (NetworkFirst strategy). This page is the
 * last-resort fallback.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-10 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-512.png"
        alt="Konneqta"
        width={120}
        height={120}
        className="mb-8 opacity-90"
      />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {"You're offline"}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-zinc-400">
        {"We couldn't reach the internet to load this page. Reconnect to continue using Konneqta — profiles you've already visited will still be available here."}
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
      >
        Try again
      </Link>
    </main>
  );
}