/**
 * Display formatting for prices and dates. Built-in Intl only; no framework
 * imports. Dates are always shown in the event's own timezone.
 */

export const DISPLAY_LOCALE = "en-GB";

/** Minor-unit digits for a currency, e.g. 2 for EUR, 0 for JPY. */
function minorUnitDigits(currency: string): number {
  return (
    new Intl.NumberFormat(DISPLAY_LOCALE, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/** Formats an amount in minor units, e.g. (2500, "EUR") -> "€25.00". */
export function formatPrice(priceAmount: number, currency: string): string {
  const digits = minorUnitDigits(currency);
  return new Intl.NumberFormat(DISPLAY_LOCALE, {
    style: "currency",
    currency,
  }).format(priceAmount / 10 ** digits);
}

const dateTimeOptions: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
};

function dateTimeFormat(timeZone: string) {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    ...dateTimeOptions,
    timeZone,
  });
}

/** E.g. "Thu, 10 Dec 2026, 20:00 CET" for an Amsterdam event. */
export function formatDateTime(instant: Date, timeZone: string): string {
  return dateTimeFormat(timeZone).format(instant);
}
