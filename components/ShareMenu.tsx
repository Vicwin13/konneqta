"use client";

import { FaEnvelope, FaTelegram, FaWhatsapp } from "react-icons/fa6";
import { LuMessageCircle, LuShare2 } from "react-icons/lu";

import { useState } from "react";

type ShareMenuProps = {
  /** Username whose profile is being shared. */
  username: string;
  /** Display name used in the share message. */
  title: string;
};

/**
 * Share button that uses the native Web Share API when available (shows the
 * mobile bottom-sheet with installed apps). On desktop it falls back to a
 * small dropdown of direct-share links.
 *
 * The absolute profile URL is computed lazily at click-time to stay
 * SSR-safe (window is only read in event handlers).
 */
export default function ShareMenu({ username, title }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Build the full URL only when the user actually interacts
  const getUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/${username}`
      : `/${username}`;

  const shareText = `Connect with ${title} on Konneqta:`;

  // ---- Native share (mobile / supported browsers) ----
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${title} · Konneqta`,
          text: shareText,
          url: getUrl(),
        });
      } catch {
        // User cancelled — no action needed
      }
    } else {
      setOpen((prev) => !prev);
    }
  };

  // ---- Copy to clipboard ----
  const handleCopy = async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fallback share targets — URLs are built lazily (client-only)
  const buildTargets = () => {
    const url = getUrl();
    return [
      {
        label: "WhatsApp",
        icon: FaWhatsapp,
        href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
        color: "text-green-500",
      },
      {
        label: "Telegram",
        icon: FaTelegram,
        href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
        color: "text-sky-500",
      },
      {
        label: "Messages",
        icon: LuMessageCircle,
        href: `sms:?&body=${encodeURIComponent(`${shareText} ${url}`)}`,
        color: "text-blue-500",
      },
      {
        label: "Email",
        icon: FaEnvelope,
        href: `mailto:?subject=${encodeURIComponent(`${title} · Konneqta`)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`,
        color: "text-zinc-500",
      },
    ];
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Share profile"
        aria-expanded={open}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <LuShare2 className="h-4 w-4" />
      </button>

      {/* Fallback dropdown (desktop / browsers without Web Share API) */}
      {open && (
        <>
          {/* Click-away overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2">
            <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              {buildTargets().map((target) => {
                const Icon = target.icon;
                return (
                  <a
                    key={target.label}
                    href={target.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex w-36 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Icon className={`h-4 w-4 ${target.color}`} />
                    {target.label}
                  </a>
                );
              })}

              {/* Divider + Copy link */}
              <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              <button
                type="button"
                onClick={handleCopy}
                className="flex w-36 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {copied ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-green-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}