"use client";

import { cloneElement, isValidElement, useState } from "react";

type TooltipProps = {
  /** Text shown on hover. */
  label: string;
  /** Preferred side. Falls back automatically when near a viewport edge. */
  side?: "top" | "bottom";
  /** The element that triggers the tooltip on hover/focus. */
  children: React.ReactNode;
  /** Extra classes on the tooltip bubble. */
  className?: string;
};

/**
 * Lightweight, dependency-free hover/focus tooltip.
 * Wraps any child (clones it so we can attach accessible aria-describedby).
 */
export default function Tooltip({
  label,
  side = "top",
  children,
  className = "",
}: TooltipProps) {
  const [show, setShow] = useState(false);

  const sideClass =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {/* Clone child to add aria-describedby for screen readers */}
      {isValidElement(children)
        ? cloneElement(children as React.ReactElement<{
            "aria-describedby"?: string;
          }>, {
            "aria-describedby": show ? "tooltip" : undefined,
          })
        : children}

      {show && (
        <span
          role="tooltip"
          id="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-lg dark:bg-zinc-700 ${sideClass} ${className}`}
        >
          {label}
        </span>
      )}
    </span>
  );
}