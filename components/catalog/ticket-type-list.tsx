import { formatPrice } from "@/lib/catalog/format";
import type { RulesTicketType, VisibleTicketType } from "@/lib/catalog/rules";
import { Badge } from "./badge";
import { DateTime } from "./date-time";

type TicketTypeLike = RulesTicketType & { id: number };

/**
 * Visible ticket types, in the order given (the rules module sorts them by
 * price). HIDDEN ticket types never reach this component.
 */
export function TicketTypeList({
  ticketTypes,
  timeZone,
}: {
  ticketTypes: VisibleTicketType<TicketTypeLike>[];
  timeZone: string;
}) {
  return (
    <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
      {ticketTypes.map(({ ticketType, state }) => (
        <li
          key={ticketType.id}
          data-ticket-type={ticketType.name}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4"
        >
          <div>
            <p className="font-medium">{ticketType.name}</p>
            <p className="text-stone-700 dark:text-stone-300">
              {formatPrice(ticketType.priceAmount, ticketType.currency)}
            </p>
          </div>
          <TicketAvailability
            state={state}
            quantityRemaining={ticketType.quantityRemaining}
            saleStartsAt={ticketType.saleStartsAt}
            timeZone={timeZone}
          />
        </li>
      ))}
    </ul>
  );
}

function TicketAvailability({
  state,
  quantityRemaining,
  saleStartsAt,
  timeZone,
}: {
  state: VisibleTicketType["state"];
  quantityRemaining: number;
  saleStartsAt: Date | null;
  timeZone: string;
}) {
  switch (state) {
    case "AVAILABLE":
      return <p className="text-sm font-medium">{quantityRemaining} left</p>;
    case "SOLD_OUT":
      return <Badge tone="soldOut">Sold out</Badge>;
    case "NOT_YET_ON_SALE":
      return (
        <Badge tone="upcoming">
          <span>
            On sale from{" "}
            {saleStartsAt ? (
              <DateTime value={saleStartsAt} timeZone={timeZone} />
            ) : null}
          </span>
        </Badge>
      );
  }
}
