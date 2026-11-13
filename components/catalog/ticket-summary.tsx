import { formatPrice } from "@/lib/catalog/format";
import type { EventSummary } from "@/lib/catalog/rules";
import { Badge } from "./badge";
import { DateTime } from "./date-time";

/** The one-line ticket summary on an event card. */
export function TicketSummary({
  summary,
  timeZone,
}: {
  summary: EventSummary;
  timeZone: string;
}) {
  switch (summary.kind) {
    case "FROM":
      return (
        <p className="font-medium">
          from {formatPrice(summary.priceAmount, summary.currency)}
        </p>
      );
    case "ON_SALE_FROM":
      return (
        <Badge tone="upcoming">
          <span>
            On sale from{" "}
            <DateTime value={summary.saleStartsAt} timeZone={timeZone} />
          </span>
        </Badge>
      );
    case "SOLD_OUT":
      return <Badge tone="soldOut">Sold out</Badge>;
  }
}
