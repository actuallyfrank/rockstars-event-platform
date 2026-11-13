import type { RulesEvent, RulesTicketType } from "./rules";

export const at = (iso: string) => new Date(iso);

export function makeEvent(overrides: Partial<RulesEvent> = {}): RulesEvent {
  return {
    status: "published",
    startsAt: at("2026-12-10T19:00:00Z"),
    endsAt: at("2026-12-10T23:00:00Z"),
    ...overrides,
  };
}

export function makeTicketType(
  overrides: Partial<RulesTicketType> = {},
): RulesTicketType {
  return {
    name: "Regular",
    priceAmount: 3500,
    currency: "EUR",
    quantityRemaining: 142,
    saleStartsAt: null,
    saleEndsAt: null,
    ...overrides,
  };
}
