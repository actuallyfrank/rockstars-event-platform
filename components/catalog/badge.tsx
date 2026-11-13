import type { ReactNode } from "react";

const tones = {
  neutral:
    "bg-stone-100 text-stone-800 ring-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-700",
  soldOut:
    "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900",
  upcoming:
    "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900",
} as const;

/** A small label. State is always carried by the text, never by colour alone. */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
