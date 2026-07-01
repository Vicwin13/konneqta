"use client";

import { useEffect, useId, useRef, useState } from "react";

type InfoTipProps = {
  /** The explanatory text shown in the bubble. */
  content: string;
  /** Preferred side. Falls back automatically when near a viewport edge. */
  side?: "top" | "bottom";
  /** Extra classes on the trigger button (e.g. sizing). */
  className?: string;
};

/**
 * Click-to-toggle info tip (for mobile-first surfaces where hover is absent).
 *
 * Behaviour:
 * - Click/tap the `?` button to toggle the bubble open/closed.
 * - Dismiss when open: click the button again, click anywhere outside, or
 *   press Escape.
 * - Accessible: the button exposes aria-expanded/aria-controls, and the
 *   bubble has role="tooltip".
 *
 * This is intentionally separate from `Tooltip.tsx`, which is hover/focus
 * based and better suited to desktop icon labels.
 */
export default function InfoTip({
  content,
  side = "top",
  className = "",
}: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);

  // Dismiss on outside click.
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const sideClass =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";

  return (
    <span ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-label="More information"
        aria-expanded={open}
        aria-controls={open ? tipId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold leading-none text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200 ${className}`}
      >
        ?
      </button>

      {open && (
        <span
          id={tipId}
          role="tooltip"
          className={`absolute z-50 w-56 max-w-[calc(100vw-2rem)] whitespace-normal rounded-md bg-zinc-900 px-3 py-2 text-xs font-normal text-white shadow-lg dark:bg-zinc-700 ${sideClass}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}